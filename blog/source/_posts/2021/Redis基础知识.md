---
title: "Redis基础知识"
date: 2020-04-10T11:51:02+08:00
draft: false
categories: 
    - "数据库"
tags: 
    - "Redis"   
---

Redis 是完全开源免费的，遵守BSD协议，是一个高性能的key-value数据库。
Redis 与其他 key - value 缓存产品有以下三个特点：

* Redis支持数据的持久化，可以将内存中的数据保存在磁盘中，重启的时候可以再次加载进行使用。
* Redis不仅仅支持简单的key-value类型的数据，同时还提供list，set，zset，hash等数据结构的存储。
* Redis支持数据的备份，即master-slave模式的数据备份。

<!--more-->

## 事务处理

Lua脚本在Redis底层了原子操作，并发场景下使用频率很高。
```text
# 开始一个事务
redis 127.0.0.1:6379> MULTI
OK

redis 127.0.0.1:6379> SET book-name "Mastering C++ in 21 days"
QUEUED

redis 127.0.0.1:6379> GET book-name
QUEUED

redis 127.0.0.1:6379> SADD tag "C++" "Programming" "Mastering Series"
QUEUED

redis 127.0.0.1:6379> SMEMBERS tag
QUEUED

# 触发事务执行
redis 127.0.0.1:6379> EXEC
1) OK
2) "Mastering C++ in 21 days"
3) (integer) 3
4) 1) "Mastering Series"
   2) "C++"
   3) "Programming"
```

## 数据类型

> Redis支持五种数据类型：string（字符串），hash（哈希），list（列表），set（集合）及zset(sorted set：有序集合)

### string

string 是 redis 最基本的类型，你可以理解成与 Memcached 一模一样的类型，一个 key 对应一个 value。
string 类型是二进制安全的。意思是 redis 的 string 可以包含任何数据。比如jpg图片或者序列化的对象。

注意：一个键最大能存储 512MB。

```bash
redis 127.0.0.1:6379> SET runoobkey redis
# OK
redis 127.0.0.1:6379> GET runoobkey
# "redis"
```

### hash

Redis hash 是一个键值(key=>value)对集合
Redis hash 是一个 string 类型的 field 和 value 的映射表，hash 特别适合用于存储对象

> Hash实际是内部存储的Value为一个HashMap，也就是说，Key仍然是用户ID,value是一个Map，这个Map的key是成员的属性名，value是属性值，这样对数据的修改和存取都可以直接通过其内部Map的Key(Redis里称内部Map的key为field),也就是通过 key(用户ID) + field(属性标签)就可以操作对应属性数据了，既不需要重复存储数据，也不会带来序列化和并发修改控制的问题。

```bash
redis 127.0.0.1:6379> DEL runoob
redis 127.0.0.1:6379> HMSET runoob field1 "Hello" field2 "World"
# "OK"
redis 127.0.0.1:6379> HGET runoob field1
# "Hello"
redis 127.0.0.1:6379> HGET runoob field2
# "World"
```

[1] [扩展阅读：HashTable哈希表](https://zh.wikipedia.org/zh-hans/%E5%93%88%E5%B8%8C%E8%A1%A8)

### list

Redis列表是简单的字符串列表，按照插入顺序排序。你可以添加一个元素到列表的头部（左边）或者尾部（右边）
一个列表最多可以包含 232 - 1 个元素 (4294967295, 每个列表超过40亿个元素)。

```bash
redis 127.0.0.1:6379> DEL runoob
redis 127.0.0.1:6379> lpush runoob redis
# (integer) 1
redis 127.0.0.1:6379> lpush runoob mongodb
# (integer) 2
redis 127.0.0.1:6379> lpush runoob rabitmq
# (integer) 3
redis 127.0.0.1:6379> lrange runoob 0 10
# 1) "rabitmq"
# 2) "mongodb"
# 3) "redis"
```

### set

Redis 的 Set 是 String 类型的无序集合。集合成员是唯一的，这就意味着集合中不能出现重复的数据。
Redis 中集合是通过哈希表实现的，所以添加，删除，查找的复杂度都是 O(1)。
集合中最大的成员数为 232 - 1 (4294967295, 每个集合可存储40多亿个成员)。

```bash
redis 127.0.0.1:6379> SADD runoobkey redis
# (integer) 1
redis 127.0.0.1:6379> SADD runoobkey mongodb
# (integer) 1
redis 127.0.0.1:6379> SADD runoobkey mysql
# (integer) 1
redis 127.0.0.1:6379> SADD runoobkey mysql
# (integer) 0
redis 127.0.0.1:6379> SMEMBERS runoobkey

# 1) "mysql"
# 2) "mongodb"
# 3) "redis"
```

### zset (sorted set 有序集合)

zset 和 set 一样也是string类型元素的集合,且不允许重复的成员。
不同的是每个元素都会关联一个double类型的分数。redis正是通过分数来为集合中的成员进行从小到大的排序。
zset的成员是唯一的,但分数(score)却可以重复。

```bash
redis 127.0.0.1:6379> ZADD runoobkey 1 redis
# (integer) 1
redis 127.0.0.1:6379> ZADD runoobkey 2 mongodb
# (integer) 1
redis 127.0.0.1:6379> ZADD runoobkey 3 mysql
# (integer) 1
redis 127.0.0.1:6379> ZADD runoobkey 3 mysql
# (integer) 0
redis 127.0.0.1:6379> ZADD runoobkey 4 mysql
# (integer) 0
redis 127.0.0.1:6379> ZRANGE runoobkey 0 10 WITHSCORES

# 1) "redis"
# 2) "1"
# 3) "mongodb"
# 4) "2"
# 5) "mysql"
# 6) "4"
```

## Redis Lua

从定义上来说，Redis 中的脚本本身就是一种事务， 所以任何在事务里可以完成的事，在脚本里面也能完成。并且一般来说， 使用脚本要来得更简单，并且速度更快。

使用事务时可能会遇上以下两种错误：

* 事务在执行 EXEC 之前，入队的命令可能会出错。比如说，命令可能会产生语法错误（参数数量错误，参数名错误，等等），或者其他更严重的错误，比如内存不足（如果服务器使用 maxmemory 设置了最大内存限制的话）。
* 命令可能在 EXEC 调用之后失败。举个例子，事务中的命令可能处理了错误类型的键，比如将列表命令用在了字符串键上面，诸如此类。
对于发生在 EXEC 执行之前的错误，客户端以前的做法是检查命令入队所得的返回值：如果命令入队时返回 QUEUED ，那么入队成功；否则，就是入队失败。如果有命令在入队时失败，那么大部分客户端都会停止并取消这个事务。

### Redis中使用Lua的好处

1. 减少网络开销。可以将多个请求通过脚本的形式一次发送，减少网络时延
1. 原子操作。redis会将整个脚本作为一个整体执行，中间不会被其他命令插入。因此在编写脚本的过程中无需担心会出现竞态条件，无需使用事务。
1. 复用。客户端发送的脚步会永久存在redis中，这样，其他客户端可以复用这一脚本而不需要使用代码完成相同的逻辑。

