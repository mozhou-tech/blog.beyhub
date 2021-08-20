---
title: "SpringBoot-Bean基本原理"
date: 2020-04-10T00:59:34+08:00
categories:
  - "源码"
tags:
  - "Spring"
  - "Java"
---

被称作 bean 的对象是构成应用程序的支柱也是由 Spring IoC 容器管理的。bean 是一个被实例化，组装，并通过 Spring IoC 容器所管理的对象。这些 bean 是由用容器提供的配置元数据创建的，例如，已经在先前章节看到的，在 XML 的表单中的 定义。

![](/media/2020/bean-lifecycle.png)

> Spring 只帮我们管理单例模式 Bean 的完整生命周期，对于 prototype 的 bean ，Spring 在创建好交给使用者之后则不会再管理后续的生命周期。

<!--more-->

## IoC与DI详解

### IoC的实现方式 及 与DI的关系？

**依赖查找(Dependency Lookup)：**容器中的受控对象通过容器的API来查找自己所依赖的资源和协作对象。
 这种方式虽然降低了对象间的依赖，但是同时也使用到了容器的API，造成了我们无法在容器外使用和测试对象。
   依赖查找是一种更加传统的IoC实现方式。

**依赖注入(Dependency Injection)：**这就是DI，字面上理解，依赖注入就是将服务注入到使用它的地方。对象只提供普通的方法让容器去决定依赖关系，
 容器全权负责组件的装配，它会把符合依赖关系的对象通过属性（JavaBean中的setter）或者是构造子传递给需要的对象。

相对于IoC而言，依赖注入(DI)更加准确地描述了IoC的设计理念。所谓依赖注入，即组件之间的依赖关系由容器在应用系统运行期来决定，
 也就是由容器动态地将某种依赖关系的目标对象实例注入到应用系统中的各个关联的组件之中。

### Spring中的IoC与DI

IoC是Spring的核心，贯穿始终。对于Spring框架来说，就是由Spring来负责控制对象的生命周期和对象间的关系。
   Spring中DI有两种实现方式---Setter方式(传值方式)和构造器方式(引用方式)。 
   
### IoC的实现原理：反射与工厂模式

#### 反射

反射是Java语言的一个特性，它允许程序在运行时（注意不是编译的时候）来进行自我检查并且对内部的成员进行操作。例如它允许一个Java类获取它所有的成员变量和方法并且显示出来。

反射主要是指程序可以访问，检测和修改它本身状态或行为的一种能力，并能根据自身行为的状态和结果，调整或修改应用所描述行为的状态和相关的语义。在Java中，只要给定类的名字，那么就可以通过反射机制来获得类的所有信息。

**反射的作用**

1. 在运行时判断任意一个对象所属的类；
2. 在运行时获取类的对象；
3. 在运行时访问java对象的属性，方法，构造方法等；
1. 在运行时修改类的对象、方法和属性

静态编译：在编译时确定类型，绑定对象，即通过。<br/>
动态编译：运行时确定类型，绑定对象。动态编译最大限度发挥了Java的灵活性，体现了多态的应用，有以降低类之间的藕合性。<br>

**反射机制优缺点**

优点：可以实现动态创建对象和编译，体现出很大的灵活性（特别是在J2EE的开发中它的灵活性就表现的十分明显）。通过反射机制我们可以获得类的各种内容，进行反编译。对于JAVA这种先编译再运行的语言来说，反射机制可以使代码更加灵活，更加容易实现面向对象。

比如，一个大型的软件，不可能一次就把把它设计得很完美，把这个程序编译后，发布了，当发现需要更新某些功能时，我们不可能要用户把以前的卸载，再重新安装新的版本，假如这样的话，这个软件肯定是没有多少人用的。采用静态的话，需要把整个程序重新编译一次才可以实现功能的更新，而采用反射机制的话，它就可以不用卸载，只需要在运行时动态地创建和编译，就可以实现该功能。

缺点：对性能有影响。使用反射基本上是一种解释操作，我们可以告诉JVM，我们希望做什么并且让它满足我们的要求。这类操作总是慢于直接执行相同的操作。

#### 工厂模式

IOC容器的工作：创建和管理Bean，它是一个工厂，负责对外提供Bean实例。

## @Bean

Spring的@Bean注解用于告诉方法，产生一个Bean对象，然后这个Bean对象交给Spring管理。产生这个Bean对象的方法Spring只会调用一次，随后这个Spring将会将这个Bean对象放在自己的IOC容器中。(默认bean的名称就是其方法名。但是也可以指定名称)

```Java
@Service
public class BeanTest {
    @Bean
    public BeanTest getBean(){
        BeanTest bean = new  BeanTest();
        System.out.println("调用方法："+bean);
        return bean;
    }

}
public class Main {
    @SuppressWarnings("unused")
    public static void main(String[] args) {
        ClassPathXmlApplicationContext context = new ClassPathXmlApplicationContext("application-context.xml");
        Object bean1 = context.getBean("getBean");
        System.out.println(bean1);
        Object bean2 = context.getBean("getBean");
        System.out.println(bean2);
    }
}
```
```text
调用方法：Spring.BeanTest@5a4041cc
Spring.BeanTest@5a4041cc
Spring.BeanTest@5a4041cc
```

## FAQ

### Spring中的Bean是线程安全的吗（不是）？

Spring中的Bean默认是单例模式的，框架并没有对bean进行多线程的封装处理。实际上大部分时间Bean是无状态的（比如Dao） 所以说在某种程度上来说Bean其实是安全的。但是如果Bean是有状态的 那就需要开发人员自己来进行线程安全的保证，最简单的办法就是改变bean的作用域把singleton改为protopyte这样每次请求Bean就相当于是new Bean()这样就可以保证线程的安全了。　(有状态就是有数据存储功能/无状态就是不会保存数据）

线程安全这个问题，要从单例与原型Bean分别进行说明。

**原型Bean：**
对于原型Bean,每次创建一个新对象，也就是线程之间并不存在Bean共享，自然是不会有线程安全的问题。

**单例Bean：**
对于单例Bean,所有线程都共享一个单例实例Bean,因此是存在资源的竞争。
如果单例Bean,是一个无状态Bean，也就是线程中的操作不会对Bean的成员执行查询以外的操作，那么这个单例Bean是线程安全的。比如Spring mvc 的 Controller、Service、Dao等，这些Bean大多是无状态的，只关注于方法本身。

### Spring 的 bean 作用域（scope）类型 ?

1. singleton:单例，默认作用域。
2. prototype:原型，每次创建一个新对象。
3. request:请求，每次Http请求创建一个新对象，适用于WebApplicationContext环境下。
4. session:会话，同一个会话共享一个实例，不同会话使用不用的实例。
5. global-session:全局会话，所有会话共享一个实例。

### @Service和@Controller是否线程安全？

默认配置下不是的。为啥呢？因为默认情况下@Controller没有加上@Scope，没有加@Scope就是默认值singleton，单例的。意思就是系统只会初始化一次Controller容器，所以每次请求的都是同一个Controller容器，当然是非线程安全的。

1. 在@Controller/@Service等容器中，默认情况下，scope值是单例-singleton的，也是线程不安全的
2. 尽量不要在@Controller/@Service等容器中定义静态变量，不论是单例(singleton)还是多实例(prototype)他都是线程不安全的
3. 默认注入的Bean对象，在不设置scope的时候他也是线程不安全的
4. 一定要定义变量的话，用ThreadLocal来封装，这个是线程安全的

> 多线程场景下，多个线程对这个单例Bean的成员变量并不存在资源的竞争，因为ThreadLocal为每个线程保存线程私有的数据。这是一种以空间换时间的方式。

### @Bean和@Component之间的联系和区别

**@Component**
注解表明一个类会作为组件类，并告知Spring要为这个类创建bean，（@Controller,@Service,@Repository实际上都包含了@Component注解）

**@Bean**
用在方法上，一般有返回值，@Bean注解告诉Spring这个方法将会返回一个对象，这个对象要注册为Spring应用上下文中的bean。通常方法体中包含了最终产生bean实例的逻辑；第三方的类，如果要注册到spring中，一般用bean的方式。

### ApplicationContext 与 BeanFactory 区别

Bean工厂（BeanFactory）是Spring框架的最核心接口，它提供了高级Ioc的配置机制。应用上下文（ApplicationContext）是BeanFactory的实现，以Bean工厂为基础，它提供了更多面向应用的功能。

在用途上，BeanFactory是Spring框架的基础设施，面向Spring本身，我们一般不直接使用；ApplicationContext面向使用Spring框架的开发者，所以，在几乎所有的应用场合我们都使用应用上下文而非Bean工厂。

## 扩展阅读

1. Spring 中的bean 是线程安全的吗： https://www.cnblogs.com/myseries/p/11729800.html
1. Bean 文档： https://wiki.jikexueyuan.com/project/spring/bean-definition.html
