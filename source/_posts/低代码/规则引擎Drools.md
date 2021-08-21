---
title: "规则引擎Drools"
date: 2020-04-11T11:45:24+08:00
categories:
    - "Java"
tags: 
    - "Drools"
---

Drools 是一个基于Charles Forgy’s的RETE算法的，易于访问企业策略、易于调整以及易于管理的开源业务规则引擎，符合业内标准，速度快、效率高。 业务分析师人员或审核人员可以利用它轻松查看业务规则，从而检验是否已编码的规则执行了所需的业务规则。Drools 是用Java语言编写的开放源码规则引擎，使用Rete算法对所编写的规则求值。Drools允许使用声明方式表达业务逻辑。可以使用非XML的本地语言编写规则，从而便于学习和理解。并且，还可以将Java代码直接嵌入到规则文件中，这令Drools的学习更加吸引人。

<!--more-->

## 特点

1. 非常活跃的社区支持
1. 易用
1. 快速的执行速度
1. 在 Java 开发人员中流行
1. 与 Java Rule Engine API（JSR 94）兼容

## 基本语法

一个规则可以包含三个部分：

1. 属性部分：定义当前规则执行的一些属性等，比如是否可被重复执行、过期时间、生效时间等。
1. 条件部分，即LHS，定义当前规则的条件，如 when Message(); 判断当前workingMemory中是否存在Message对象。
1. 结果部分，即RHS，这里可以写普通java代码，即当前规则条件满足后执行的操作，可以直接调用Fact对象的方法来操作应用。

示例规则：

```Java
rule "name"
       no-loop true
       lock-on-active true
       when
               $message:Message(status == 0)
       then
               System.out.println("fit");
               $message.setStatus(1);
               update($message);
end
```

1. package： 与Java语言类似，drl的头部需要有package和import的声明，package不必和物理路径一致，这里只是一个逻辑区分。
1. import： 导入java Bean的完整路径，也可以将Java静态方法导入调用。
1. rule： 规则名称，需要保持唯一 。
1. no-loop： 定义当前的规则是否允许多次循环执行，默认是 false允许循环执行，也就是当前的规则只要满足条件,可以无限次执行。在对当前传入workingMemory中的Fact对象进行修改或者个数的增减，比如update方法，这种操作会触发规则的重新匹配执行。如果是true，则规则只执行一次，如果本身的RHS部分有update等触发规则重新执行的操作，也不会再次执行当前规则。
1. lock-on-active： 将lock-on-active属性的值设置为true,可避免因某些Fact对象被修改而使已经执行过的规则再次被激活执行。因为一个规则的重复执行不一定是本身触发的，也可能是其他规则触发的，所以这个是no-loop的加强版。
1. date-expires：设置规则的过期时间，默认的时间格式：“日-月-年”，中英文格式相同，但是写法要用各自对应的语言，比如中文："29-七月-2010"，但是还是推荐使用更为精确和习惯的格式，这需要手动在java代码中设置当前系统的时间格式，后续提及。
1. date-effective：设置规则的生效时间，时间格式同上。
1. duration：规则定时，duration 3000 ，3秒后执行规则
1. salience： 用来设置规则执行的优先级,salience 属性的值是一个数字,数字越大执行优先级越高, 同时它的值可以是一个负数。默认情况下,规则的 salience 默认值为 0。如果不设置规则的 salience 属性,那么执行顺序是随机的。
1. when： 条件语句，就是当到达什么条件的时候执行
1. then： 根据条件的结果，来执行什么动作
1. end： 规则结束

### 规则的条件部分，即LHS部分

```Java
when
         eval(true)
         $customer:Customer()
         $message:Message(status==0)
```

上述罗列了三个条件，当前规则只有在这三个条件都匹配的时候才会执行RHS部分。

eval(true)：是一个默认的api，true 无条件执行，类似于 while(true)
$customer:Customer()：表示当前的workingMemory存在Customer类
$message:Message(status==0) 这句话标示的：当前的workingMemory存在Message类型并且status属性的值为0的Fact对象，这个对象通常是通过外部java代码插入或者自己在前面已经执行的规则的RHS部分中insert进去的。

### Drools中条件操作符
Drools提供了十二中类型比较操作符：< 、<=、>、>=、==、!=、contains、not contains、memberOf、not memberOf、matches、not matches，并且这些条件都可以组合使用。


```Java
  $order:Order(name=="qu")
  $message:Message((status==0 ||  (status > 1 && status <=100)) && orders contains $order && $order.name=="qu")
```
条件组合：Message(status==0 || (status > 1 && status <=100))
Fact对象private属性的操作：RHS中对Fact对象private属性的操作必须使用getter和setter方法，而RHS中则必须要直接用.的方法去使用，比如：$order.name=="qu"
contains：对比是否包含操作，操作的被包含目标可以是一个复杂对象也可以是一个简单的值。 $message:Message(status==0 && names contains "网易" && names.size >= 1)。上述的条件中，status必须是0，并且names列表中含有“网易”并且列表长度大于等于1（names是一个List）。
matches：正则表达式匹配，与java不同的是，不用考虑'/'的转义问题
memberOf：判断某个Fact属性值是否在某个集合中，与contains不同的是他被比较的对象是一个集合，而contains被比较的对象是单个值或者对象。

注意：如果条件全部是 &&关系，可以使用“,”来替代，但是两者不能混用

### 规则的结果部分

当规则条件满足，则进入规则结果部分执行，结果部分可以是纯java代码，比如：
```Java
then
       System.out.println("OK"); //会在控制台打印出ok
end
```
insert：往当前workingMemory中插入一个新的Fact对象，会触发规则的再次执行，除非使用no-loop限定；
update：更新
modify：修改，与update语法不同，结果都是更新操作
retract：删除
function：定义一个方法，如：
```Java
function void console {
   System.out.println();
   StringUtils.getId();// 调用外部静态方法，StringUtils必须使用import导入，getId()必须是静态方法
}
```

declare：可以在规则文件中定义一个class，使用起来跟普通java对象相似，你可以在RHS部分中new一个并且使用getter和setter方法去操作其属性。

```Java
declare Address
 @author(quzishen) // 元数据，仅用于描述信息
 @createTime(2011-1-24)
 city : String @maxLengh(100)
 postno : int
end
```

'@'是元数据定义，用于描述数据的数据~，没什么执行含义。
你可以在RHS部分中使用Address address = new Address()的方法来定义一个对象。

更多的规则语法，可以参考其他互联网资料，推荐：http://wenku.baidu.com/view/a6516373f242336c1eb95e7c.html

pom中加入依赖
```xml
<!-- Drools规则引擎包 start -->
<dependency>
    <groupId>org.kie</groupId>
    <artifactId>kie-api</artifactId>
    <version>6.5.0.Final</version>
</dependency>
<dependency>
    <groupId>org.drools</groupId>
    <artifactId>drools-compiler</artifactId>
    <version>6.5.0.Final</version>
</dependency>
<!-- Drools规则引擎包 end -->
```

### 案例

下面是一个增加积分的列子，主要实现用户购买的金额达到一定量后送积分，具体的规则如下:

> 100元以下, 不加分<br>
100元-500元 加100分<br> 
500元-1000元 加500分 <br>
1000元 以上 加1000分<br>

有两种实现方案，一种是规则直接写在文件中，一种是规则写在数据库中。

规则写在文件中
Point.drl 文件
在src/main/resources目录下新建rules.point文件夹，新建Point.drl文件

//这里的package属性是一个逻辑区分，不需要与这个文件路径相对应
```Java
package point.rules

import com.xiaolyuh.domain.model.Order

rule "zero"
    no-loop true
    lock-on-active true
    salience 1
    when
        $s : Order(amout <= 100)
    then
        $s.setScore(0);
        System.out.println("不加积分");
        update($s);
end

rule "add100"
    no-loop true
    lock-on-active true
    salience 1
    when
        $s : Order(amout > 100 && amout <= 500)
    then
        $s.setScore(100);
        System.out.println("加100积分");
        update($s);
end

rule "add500"
    no-loop true
    lock-on-active true
    salience 1
    when
        $s : Order(amout > 500 && amout <= 1000)
    then
        $s.setScore(500);
        System.out.println("加500积分");
        update($s);
end

rule "add1000"
    no-loop true
    lock-on-active true
    salience 1
    when
        $s : Order(amout > 1000)
    then
        $s.setScore(1000);
        System.out.println("加500积分");
        update($s);
end
```

### kmodule.xml

这里需要有一个配置文件告诉代码规则文件drl在哪里，在drools中这个文件就是kmodule.xml，放置到resources/META-INF目录下，内容如下：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<kmodule xmlns="http://jboss.org/kie/6.0.0/kmodule">

    <!-- 这里的packages属性就是规则文件的文件路径 -->
    <kbase name="point_rule" packages="rules.point">
        <ksession name="point_ksession"/>
    </kbase>

</kmodule>

```
以下对配置说明进行简单说明：

1. Kmodule： 中可以包含一个到多个 kbase,分别对应 drl 的规则文件。
1. Kbase 需要一个唯一的 name,可以取任意字符串。
1. packages： 为drl文件所在resource目录下的路径。注意区分drl文件中的package与此处的package不一定相同。多个包用逗号分隔。默认情况下会扫描 resources目录下所有(包含子目录)规则文件。
1. kbase的default属性：标示当前KieBase是不是默认的,如果是默认的则不用名称 就可以查找到该 KieBase,但每个 module 最多只能有一个默认 -
KieBase。
1. kbase的ksession： kbase下面可以有一个或多个 ksession，ksession 的 name 属性必须设置,且必须唯一。

### DroolsUtil

通过该类加载kmodule.xml文件，并获得KieSession。

```Java
/**
 * @author yuhao.wang
 */
public class DroolsUtil {
    public static final Logger log = LoggerFactory.getLogger(DroolsUtil.class);

    /**
     * 线程安全单例
     */
    private static volatile KieServices kieServices = KieServices.Factory.get();
    /**
     * KieBase容器，线程安全单例
     */
    private static volatile KieContainer kieContainer;

    /**
     * 加载KieContainer容器
     */
    public static KieContainer loadKieContainer() throws RuntimeException {
        //通过kmodule.xml 找到规则文件,这个文件默认放在resources/META-INF文件夹
        log.info("准备创建 KieContainer");

        if (kieContainer == null) {
            log.info("首次创建：KieContainer");
            // 设置drools的日期格式
            System.setProperty("drools.dateformat", "yyyy-MM-dd HH:mm:ss");
            //线程安全
            synchronized (DroolsUtil.class) {
                if (kieContainer == null) {
                    // 创建Container
                    kieContainer = kieServices.getKieClasspathContainer();
                    // 检查规则文件是否有错
                    Results results = kieContainer.verify();
                    if (results.hasMessages(Message.Level.ERROR)) {
                        StringBuffer sb = new StringBuffer();
                        for (Message mes : results.getMessages()) {
                            sb.append("解析错误的规则：").append(mes.getPath()).append(" 错误位置：").append(mes.getLine()).append(";");
                        }
                        throw new RuntimeException(sb.toString());
                    }
                }
            }

        }
        log.info("KieContainer创建完毕");
        return kieContainer;
    }

    /**
     * 根据kiesession 名称创建KieSession ，每次调用都是一个新的KieSession
     * @param name kiesession的名称
     * @return 一个新的KieSession，每次使用后要销毁
     */
    public static KieSession getKieSessionByName(String name) {
        if (kieContainer == null) {
            kieContainer = loadKieContainer();
        }
        KieSession kieSession;
        try {
            kieSession = kieContainer.newKieSession(name);
        } catch (Exception e) {
            log.error("根据名称：" + name + " 创建kiesession异常");
            throw new RuntimeException(e);
        }
        return kieSession;
    }

}
```

### 执行规则

DroolsScoreExampleTest.java
```Java
/**
     * 计算额外积分金额 规则如下: 订单原价金额
     * 100以下, 不加分
     * 100-500 加100分
     * 500-1000 加500分
     * 1000 以上 加1000分
     *
     * @param args
     * @throws Exception
     */
    public static final void main(final String[] args) throws Exception {
        // 通过工具类去获取KieSession
        KieSession ksession = DroolsUtil.getKieSessionByName("point_ksession");

        List<Order> orderList = getInitData();
        try {
            for (int i = 0; i < orderList.size(); i++) {
                Order o = orderList.get(i);
                ksession.insert(o);
                ksession.fireAllRules();
                // 执行完规则后, 执行相关的逻辑
                addScore(o);
            }
        } catch (Exception e) {

        } finally {
            ksession.destroy();
        }

    }
```

### 基于数据库的方式

表结构
```MySQL
CREATE TABLE `rule` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `rule_key` varchar(255) NOT NULL DEFAULT '' COMMENT '规则编码',
  `version` varchar(255) NOT NULL DEFAULT '' COMMENT '规则编码',
  `content` varchar(2048) NOT NULL DEFAULT '' COMMENT '规则n内容',
  `create_time` datetime NOT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rule_key` (`rule_key`) USING BTREE,
  KEY `uk_update_time` (`update_time`) USING BTREE,
  KEY `uk_version` (`version`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
```

### 获取KieSession

RuleServiceImpl.java
```Java
@ResponseBody
@RequestMapping("address")
public Object test(int num) {
    AddressCheckResult result = new AddressCheckResult();
    Address address = new Address();
    address.setPostcode(generateRandom(num));

    String ruleKey = "score";
    KieSession kieSession = ruleService.getKieSessionByName(ruleKey);
    int ruleFiredCount = 0;
    try {
        kieSession.insert(address);
        kieSession.insert(result);
        ruleFiredCount = kieSession.fireAllRules();
    } catch (Exception e) {
        logger.warn(e.getMessage(), e);
    } finally {
        if (kieSession != null) {
            kieSession.destroy();
        }
    }
    System.out.println("触发了" + ruleFiredCount + "条规则");

    if (result.isPostCodeResult()) {
        System.out.println("规则校验通过");
    }

    return "ok";
}
```

### 执行规则

RuleController.java

```Java
@ResponseBody
@RequestMapping("address")
public Object test(int num) {
    AddressCheckResult result = new AddressCheckResult();
    Address address = new Address();
    address.setPostcode(generateRandom(num));

    String ruleKey = "score";
    KieSession kieSession = ruleService.getKieSessionByName(ruleKey);
    int ruleFiredCount = 0;
    try {
        kieSession.insert(address);
        kieSession.insert(result);
        ruleFiredCount = kieSession.fireAllRules();
    } catch (Exception e) {
        logger.warn(e.getMessage(), e);
    } finally {
        if (kieSession != null) {
            kieSession.destroy();
        }
    }
    System.out.println("触发了" + ruleFiredCount + "条规则");

    if (result.isPostCodeResult()) {
        System.out.println("规则校验通过");
    }

    return "ok";
}
```

## 扩展阅读

1. drools Examples: https://github.com/tenstone/drools-examples

