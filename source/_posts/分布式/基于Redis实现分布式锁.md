---
title: "基于Redis实现分布式锁"
date: 2020-04-10T14:31:52+08:00
categories: 
    - "数据库"
tags:
    - "分布式" 
    - "高并发" 
---

在多线程的环境下，为了保证一个代码块在同一时间只能由一个线程访问，Java中我们一般可以使用synchronized语法和ReetrantLock去保证，这实际上是本地锁的方式。但是现在公司都是流行分布式架构，在分布式环境下，如何保证不同节点的线程同步执行呢？保证分布式操作的原子性。

<!--more-->

## 简介

实际上，对于分布式场景，我们可以使用分布式锁，它是控制**分布式系统之间互斥访问共享资源**的一种方式。比如说在一个分布式系统中，多台机器上部署了多个服务，当客户端一个用户发起一个数据插入请求时，如果没有分布式锁机制保证，那么那多台机器上的多个服务可能进行并发插入操作，导致数据重复插入，对于某些不允许有多余数据的业务来说，这就会造成问题。而分布式锁机制就是为了解决类似这类问题，保证多个服务之间互斥的访问共享资源，如果一个服务抢占了分布式锁，其他服务没获取到锁，就不进行后续操作。大致意思如下图所示（不一定准确）

![分布式锁](/media/2020/distributed-lock.png)

Redis 锁主要利用 Redis 的 setnx 命令。

## 场景举例

1. 假设有一个进程A，每小时准点给用户发送一条短信"Hello world"，为了高可用，就必须在多台机器上面部署多个进程，避免宕机的情况；
1. 假设部署在两台机器，那么问题来了，用户每个小时就会收到两条"Hello world"，信息就重复了；
1. 我们希望只发送一条"Hello world"，那么就可以引入分布式锁的概念了；
1. 进程A和进程B发送短信前先去注册一个锁，假设进程A抢到了锁，进程B就等待结果，如果发送成功了，那么B就放弃此次任务，等待下一个小时。
1. 问题的核心就在于怎么注册锁，检查锁的存在和注册锁是一个原子性操作，类似mysql的主键，存在则不能insert，就是说你不能把我的锁覆盖了，你得等着；
1. 我们有多种方式可以实现分布式锁，最简单的就是以每小时准点这个时间作为主键，到mysql写入一条数据，利用数据库来维持一致性。

### 分布式锁一般有如下的特点：

* 互斥性： 同一时刻只能有一个线程持有锁
* 可重入性： 同一节点上的同一个线程如果获取了锁之后能够再次获取锁
* 锁超时：和J.U.C中的锁一样支持锁超时，防止死锁
* 高性能和高可用：加锁和解锁需要高效，同时也需要保证高可用，防止分布式锁失效
* 具备阻塞和非阻塞性：能够及时从阻塞状态中被唤醒

### 我们一般实现分布式锁有以下几种方式：

* 基于数据库
* 基于Redis
* 基于zookeeper
* 本篇文章主要介绍基于Redis如何实现分布式锁


## 分布式锁应该具备的条件

1. 在分布式系统环境下，一个方法在同一时间只能被一个机器的的一个线程执行；
1. 高可用的获取锁与释放锁；
1. 高性能的获取锁与释放锁；
1. 具备可重入特性；
1. 具备锁失效机制，防止死锁；
1. 具备非阻塞锁特性，即没有获取到锁将直接返回获取锁失败。

## Redis的分布式锁实现

### 利用setnx+expire命令 (错误的做法)

Redis的SETNX命令，setnx key value，将key设置为value，当键不存在时，才能成功，若键存在，什么也不做，成功返回1，失败返回0 。 SETNX实际上就是SET IF NOT Exists的缩写

因为分布式锁还需要超时机制，所以我们利用expire命令来设置，所以利用setnx+expire命令的核心代码如下：
```Java
public boolean tryLock(String key,String requset,int timeout) {
    Long result = jedis.setnx(key, requset);
    // result = 1时，设置成功，否则设置失败
    if (result == 1L) {
        return jedis.expire(key, timeout) == 1L;
    } else {
        return false;
    }
}
```

实际上上面的步骤是有问题的，setnx和expire是分开的两步操作，不具有原子性，如果执行完第一条指令应用异常或者重启了，锁将无法过期。

一种改善方案就是使用Lua脚本来保证原子性（包含setnx和expire两条指令）

### 使用Lua脚本（包含setnx和expire两条指令）

代码如下

```Java
public boolean tryLock_with_lua(String key, String UniqueId, int seconds) {
    String lua_scripts = "if redis.call('setnx',KEYS[1],ARGV[1]) == 1 then" +
            "redis.call('expire',KEYS[1],ARGV[2]) return 1 else return 0 end";
    List<String> keys = new ArrayList<>();
    List<String> values = new ArrayList<>();
    keys.add(key);
    values.add(UniqueId);
    values.add(String.valueOf(seconds));
    Object result = jedis.eval(lua_scripts, keys, values);
    //判断是否成功
    return result.equals(1L);
}
```
### 使用 set key value [EX seconds][PX milliseconds][NX|XX] 命令 (正确做法)

Redis在 2.6.12 版本开始，为 SET 命令增加一系列选项：

SET key value[EX seconds][PX milliseconds][NX|XX]

* EX seconds: 设定过期时间，单位为秒
* PX milliseconds: 设定过期时间，单位为毫秒
* NX: 仅当key不存在时设置值
* XX: 仅当key存在时设置值

set命令的nx选项，就等同于setnx命令，代码过程如下：
```Java
public boolean tryLock_with_set(String key, String UniqueId, int seconds) {
    return "OK".equals(jedis.set(key, UniqueId, "NX", "EX", seconds));
}
```

value必须要具有唯一性，我们可以用UUID来做，设置随机字符串保证唯一性，至于为什么要保证唯一性？假如value不是随机字符串，而是一个固定值，那么就可能存在下面的问题：

1. 客户端1获取锁成功
2. 客户端1在某个操作上阻塞了太长时间
3. 设置的key过期了，锁自动释放了
4. 客户端2获取到了对应同一个资源的锁
5. 客户端1从阻塞中恢复过来，因为value值一样，所以执行释放锁操作时就会释放掉客户端2持有的锁，这样就会造成问题

所以通常来说，在释放锁时，我们需要对value进行验证

释放锁的实现
释放锁时需要验证value值，也就是说我们在获取锁的时候需要设置一个value，不能直接用del key这种粗暴的方式，因为直接del key任何客户端都可以进行解锁了，所以解锁时，我们需要判断锁是否是自己的，基于value值来判断，代码如下：

```Java
public boolean releaseLock_with_lua(String key,String value) {
    String luaScript = "if redis.call('get',KEYS[1]) == ARGV[1] then " +
            "return redis.call('del',KEYS[1]) else return 0 end";
    return jedis.eval(luaScript, Collections.singletonList(key), Collections.singletonList(value)).equals(1L);
}
```

这里使用Lua脚本的方式，尽量保证原子性。

使用 set key value [EX seconds][PX milliseconds][NX|XX] 命令 看上去很OK，实际上在Redis集群的时候也会出现问题，比如说A客户端在Redis的master节点上拿到了锁，但是这个加锁的key还没有同步到slave节点，master故障，发生故障转移，一个slave节点升级为master节点，B客户端也可以获取同个key的锁，但客户端A也已经拿到锁了，这就导致多个客户端都拿到锁。

所以针对Redis集群这种情况，还有其他方案

### Redlock算法 与 Redisson 实现
Redis作者 antirez基于分布式环境下提出了一种更高级的分布式锁的实现Redlock，原理如下：

> 下面参考文章Redlock：Redis分布式锁最牛逼的实现 和 https://redis.io/topics/distlock

假设有5个独立的Redis节点（注意这里的节点可以是5个Redis单master实例，也可以是5个Redis Cluster集群，但并不是有5个主节点的cluster集群）：

* 获取当前Unix时间，以毫秒为单位
* 依次尝试从5个实例，使用相同的key和具有唯一性的value(例如UUID)获取锁，当向Redis请求获取锁时，客户端应该设置一个网络连接和响应超时时间，这个超时时间应用小于锁的失效时间，例如你的锁自动失效时间为10s，则超时时间应该在5~50毫秒之间，这样可以避免服务器端Redis已经挂掉的情况下，客户端还在死死地等待响应结果。如果服务端没有在规定时间内响应，客户端应该尽快尝试去另外一个Redis实例请求获取锁
* 客户端使用当前时间减去开始获取锁时间（步骤1记录的时间）就得到获取锁使用的时间，当且仅当从大多数(N/2+1，这里是3个节点)的Redis节点都取到锁，并且使用的时间小于锁失败时间时，锁才算获取成功。
* 如果取到了锁，key的真正有效时间等于有效时间减去获取锁所使用的时间（步骤3计算的结果）
* 如果某些原因，获取锁失败（没有在至少N/2+1个Redis实例取到锁或者取锁时间已经超过了有效时间），客户端应该在所有的Redis实例上进行解锁（即便某些Redis实例根本就没有加锁成功，防止某些节点获取到锁但是客户端没有得到响应而导致接下来的一段时间不能被重新获取锁）

### Redisson实现简单分布式锁

对于Java用户而言，我们经常使用Jedis，Jedis是Redis的Java客户端，除了Jedis之外，Redisson也是Java的客户端，Jedis是阻塞式I/O，而Redisson底层使用Netty可以实现非阻塞I/O，该客户端封装了锁的，继承了J.U.C的Lock接口，所以我们可以像使用ReentrantLock一样使用Redisson，具体使用过程如下。首先加入POM依赖
```xml
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson</artifactId>
    <version>3.10.6</version>
</dependency>
```

使用Redisson，代码如下(与使用ReentrantLock类似）

```Java
// 1. 配置文件
Config config = new Config();
config.useSingleServer()
        .setAddress("redis://127.0.0.1:6379")
        .setPassword(RedisConfig.PASSWORD)
        .setDatabase(0);
//2. 构造RedissonClient
RedissonClient redissonClient = Redisson.create(config);

//3. 设置锁定资源名称
RLock lock = redissonClient.getLock("redlock");
lock.lock();
try {
    System.out.println("获取锁成功，实现业务逻辑");
    Thread.sleep(10000);
} catch (InterruptedException e) {
    e.printStackTrace();
} finally {
    lock.unlock();
}
```

关于Redlock算法的实现，在Redisson中我们可以使用RedissonRedLock来完成。

## Redis实现的分布式锁轮子

下面利用SpringBoot + Jedis + AOP的组合来实现一个简易的分布式锁。

### 自定义注解

自定义一个注解，被注解的方法会执行获取分布式锁的逻辑

```Java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface RedisLock {
    /**
     * 业务键
     *
     * @return
     */
    String key();
    /**
     * 锁的过期秒数,默认是5秒
     *
     * @return
     */
    int expire() default 5;

    /**
     * 尝试加锁，最多等待时间
     *
     * @return
     */
    long waitTime() default Long.MIN_VALUE;
    /**
     * 锁的超时时间单位
     *
     * @return
     */
    TimeUnit timeUnit() default TimeUnit.SECONDS;
}
```

### AOP拦截器实现
在AOP中我们去执行获取分布式锁和释放分布式锁的逻辑，代码如下：

```Java
@Aspect
@Component
public class LockMethodAspect {
    @Autowired
    private RedisLockHelper redisLockHelper;
    @Autowired
    private JedisUtil jedisUtil;
    private Logger logger = LoggerFactory.getLogger(LockMethodAspect.class);

    @Around("@annotation(com.redis.lock.annotation.RedisLock)")
    public Object around(ProceedingJoinPoint joinPoint) {
        Jedis jedis = jedisUtil.getJedis();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        RedisLock redisLock = method.getAnnotation(RedisLock.class);
        String value = UUID.randomUUID().toString();
        String key = redisLock.key();
        try {
            final boolean islock = redisLockHelper.lock(jedis,key, value, redisLock.expire(), redisLock.timeUnit());
            logger.info("isLock : {}",islock);
            if (!islock) {
                logger.error("获取锁失败");
                throw new RuntimeException("获取锁失败");
            }
            try {
                return joinPoint.proceed();
            } catch (Throwable throwable) {
                throw new RuntimeException("系统异常");
            }
        }  finally {
            logger.info("释放锁");
            redisLockHelper.unlock(jedis,key, value);
            jedis.close();
        }
    }
}
```

### Redis实现分布式锁核心类
```Java
@Component
public class RedisLockHelper {
    private long sleepTime = 100;
    /**
     * 直接使用setnx + expire方式获取分布式锁
     * 非原子性
     *
     * @param key
     * @param value
     * @param timeout
     * @return
     */
    public boolean lock_setnx(Jedis jedis,String key, String value, int timeout) {
        Long result = jedis.setnx(key, value);
        // result = 1时，设置成功，否则设置失败
        if (result == 1L) {
            return jedis.expire(key, timeout) == 1L;
        } else {
            return false;
        }
    }

    /**
     * 使用Lua脚本，脚本中使用setnex+expire命令进行加锁操作
     *
     * @param jedis
     * @param key
     * @param UniqueId
     * @param seconds
     * @return
     */
    public boolean Lock_with_lua(Jedis jedis,String key, String UniqueId, int seconds) {
        String lua_scripts = "if redis.call('setnx',KEYS[1],ARGV[1]) == 1 then" +
                "redis.call('expire',KEYS[1],ARGV[2]) return 1 else return 0 end";
        List<String> keys = new ArrayList<>();
        List<String> values = new ArrayList<>();
        keys.add(key);
        values.add(UniqueId);
        values.add(String.valueOf(seconds));
        Object result = jedis.eval(lua_scripts, keys, values);
        //判断是否成功
        return result.equals(1L);
    }

    /**
     * 在Redis的2.6.12及以后中,使用 set key value [NX] [EX] 命令
     *
     * @param key
     * @param value
     * @param timeout
     * @return
     */
    public boolean lock(Jedis jedis,String key, String value, int timeout, TimeUnit timeUnit) {
        long seconds = timeUnit.toSeconds(timeout);
        return "OK".equals(jedis.set(key, value, "NX", "EX", seconds));
    }

    /**
     * 自定义获取锁的超时时间
     *
     * @param jedis
     * @param key
     * @param value
     * @param timeout
     * @param waitTime
     * @param timeUnit
     * @return
     * @throws InterruptedException
     */
    public boolean lock_with_waitTime(Jedis jedis,String key, String value, int timeout, long waitTime,TimeUnit timeUnit) throws InterruptedException {
        long seconds = timeUnit.toSeconds(timeout);
        while (waitTime >= 0) {
            String result = jedis.set(key, value, "nx", "ex", seconds);
            if ("OK".equals(result)) {
                return true;
            }
            waitTime -= sleepTime;
            Thread.sleep(sleepTime);
        }
        return false;
    }
    /**
     * 错误的解锁方法—直接删除key
     *
     * @param key
     */
    public void unlock_with_del(Jedis jedis,String key) {
        jedis.del(key);
    }

    /**
     * 使用Lua脚本进行解锁操纵，解锁的时候验证value值
     *
     * @param jedis
     * @param key
     * @param value
     * @return
     */
    public boolean unlock(Jedis jedis,String key,String value) {
        String luaScript = "if redis.call('get',KEYS[1]) == ARGV[1] then " +
                "return redis.call('del',KEYS[1]) else return 0 end";
        return jedis.eval(luaScript, Collections.singletonList(key), Collections.singletonList(value)).equals(1L);
    }
}
```

### Controller层控制

定义一个TestController来测试我们实现的分布式锁
```Java
@RestController
public class TestController {
    @RedisLock(key = "redis_lock")
    @GetMapping("/index")
    public String index() {
        return "index";
    }
}

```
---

Zookeeper实现简单，但效率较低；Redis实现复杂，但效率较高。

> 分布式锁重点在于互斥性，在任意一个时刻，只有一个客户端获取了锁。在实际的生产环境中，分布式锁的实现可能会更复杂，而我这里的讲述主要针对的是单机环境下的基于Redis的分布式锁实现，至于Redis集群环境并没有过多涉及，有兴趣的朋友可以查阅相关资料。

### Redission Lock

Lua脚本在Redis底层操作具有原子性（基于事务）

![](/media/2020/redission.png)

## 资料

1. 项目源码地址：https://github.com/pjmike/redis-distributed-lock
2. Redis分布式锁：https://redis.io/topics/distlock
3. 小米的实现方案：https://xiaomi-info.github.io/2019/12/17/redis-distributed-lock/
4. 使用Redis SETNX 命令实现分布式锁：https://blog.csdn.net/lihao21/article/details/49104695
5. [B站视频原理分析](https://www.bilibili.com/video/BV1Y7411j7qU?p=2)
