## SpringMVC

#### SpringMVC响应流程



上图是一个Spring MVC从接收请求到返回响应的完整流程。我理解对于SpringBoot的RestController来说，在第四步没有返回ModelAndView，而是直接返回了Json，并通过@ResponseBody将Json直接写到了响应Body，略过了第5步和第6步。

## Spring Boot

### SpringBoot

#### Spring的AOP的底层实现原理

#### Spring的事务是如何回滚的? 

#### 谈谈你对循环依赖的理解 

#### 谈一下对Spring事务传播特性的理解

#### AOP是怎么实现的？它和IOC是什么关系

BeanPostProcessor，AOP是IOC的一个扩展功能

动态代理

#### JDK动态代理和Cglib实现方式

#### 调用aware接口的方法有什么意义

InvokeAwareMethod

#### BeanPostProcessor里的before究竟是什么？

#### 你能分清Bean的实例化和初始化吗？

实例化：在堆中开辟一块空间，对象属性值时默认值

初始化：给对象属性赋值，调用初始化方法

#### BeanFactory是什么？

用于访问Spring Bean容器的根接口

#### BeanFactoryPostProcessor和BeanPostProcessor区别？

针对不同的操作对象（后置处理器，增强器），分别是BeanFactory和Bean

#### PostProcessor是什么？

用于增强Bean的功能

#### @Configuration低层原理

#### Bean的生命周期

#### 如何修改Bean的加载顺序

1. 使用DependsOn注解

2. 使用@AutoConfigureOrder注解

   > 作用于`spring.factories`中的AutoConfiguration的顺序
   >
   > ```
   > @AutoConfigureOrder(Ordered.HIGHEST_PRECEDENCE) # 值越小优先级越高
   > ```

3. 使用@Order注解

4. BeanPostProcessor接口

5. @Lazy注解延迟加载Bean：使用到Bean时才初始化

6. @AutoConfigureAfter：作用范围同@AutoConfigureOrder

7. @AutoConfigureBefore：作用范围同@AutoConfigureOrder

#### Bean的作用域

#### 初始化前、初始化、初始化后

#### 你会如何设计一个框架？

扩展性

#### 谈谈你对SpringlOC的理解

#### 谈谈你的Bean的理解

#### 描述下Spring Bean的生命周期 

#### BeanFactory和FactoryBean有什么区别

#### Spring中用到哪些设计模式

#### BeanFactory和ApplicationContext的区别 

#### Spring中Filter和Interceptor的区别

#### 说说SmartInitializingSingleton接口的作用

#### 说说ApplicationContextAware接口的作用

#### BeanPostProcessorChecker的作用

#### Filter和Interceptor

- Interceptor：拦截用户请求，进行处理，比如判断用户登录情况、权限验证，只要针对Controller请求进行处理，是通过**HandlerInterceptor**，Interceptor分两种情况，

  > - 一种是对会话的拦截，实现spring的HandlerInterceptor接口并注册到mvc的拦截队列中，其中**preHandle()\**方法在调用Handler之前进行拦截。**postHandle()**方法在视图渲染之前调用，**afterCompletion()**方法在返回相应之前执行；
  > - 另一种是对方法的拦截，需要使用@Aspect注解，在每次调用指定方法的前、后进行拦截。 

- Filter：基于Servlet容器，过滤字符编码、做一些业务逻辑判断，主要用于对用户请求进行预处理，同时也可进行逻辑判断。Filter在请求进入servlet容器执行service()方法之前就会经过filter过滤，依赖于servlet。Filter启动是随WEB应用的启动而启动，只需要初始化一次，以后都可以进行拦截。

- 二者的区别

  > 1. Filter是基于函数回调（doFilter()方法）的，而Interceptor则是基于Java反射的（AOP思想）。
  > 2. Filter依赖于Servlet容器，而Interceptor不依赖于Servlet容器。
  > 3. Filter对几乎所有的请求起作用，而Interceptor只能对action请求起作用。
  > 4. Interceptor可以访问Action的上下文，值栈里的对象，而Filter不能。
  > 5. 在action的生命周期里，Interceptor可以被多次调用，而Filter只能在容器初始化时调用一次。
  > 6. Filter在过滤是只能对request和response进行操作，而interceptor可以对request、response、handler、modelAndView、exception进行操作。

#### 说一下Spring里的动态代理，和静态代理有什么区别

## Spring Cloud

#### @RefreshScope注解的实现原理

#### Spring Cloud Stream

https://fangjian0423.github.io/2019/04/03/spring-cloud-stream-intro/#more

#### Spring Cloud Bus

Spring Cloud Bus是基于Stream实现的。

https://fangjian0423.github.io/2019/04/09/spring-cloud-bus-intro/

![img](file:///Users/jerrylau/workspace/writting/whoiscat.com/knowledge/resume/images/813442-20171114180921171-1000088884.png?lastModify=1637145977)

#### Spring Cloud Function