---
title: "基于quartz的任务调度"
date: 2020-04-10T09:28:50+08:00
draft: true
categories:
  - "Java"
tags:
  - "开源组件"
  - "分布式"
---

Quartz是一个Java下作业控制的开源框架。Quartz用来创建或简单或复杂的调度时间表，执行Java下任意数量的作业。

可以通过CronTrigger定义Quartz的调度时间表（例如0 0 12 ? * WED表示“每周三上午12：00”）。此外，时间表也可以通过SimpleTrigger，由Date定义触发的开始时间、毫秒的时间间隔和重复计数（例如“在下周三12：00，然后每隔10秒、执行5次”）。可以使用Calender定义例外的日程（例如“没有周末和节假日”）。作业可以是实现了Job接口任意的Java类。作业监听器（JobListener）和触发器监听器（TriggerListener）通知作业的执行（和其他事件）。作业及其触发器可以被持久化。

Quartz一般用于企业级应用程序，以支持工作流、系统管理（英语：Systems management）（维护）活动，并在应用程序中提供实时的服务。Quartz还支持集群。

<!--more-->

## 核心概念

Quartz对任务调度的领域问题进行了高度的抽象，提出了调度器、任务和触发器这3个核心的概念，并在org.quartz通过接口和类对重要的这些核心概念进行描述：

1. Job：是一个接口，只有一个方法void execute(JobExecutionContext context)，开发者实现该接口定义运行任务，JobExecutionContext类提供了调度上下文的各种信息。Job运行时的信息保存在JobDataMap实例中；

1. JobDetail：Quartz在每次执行Job时，都重新创建一个Job实例，所以它不直接接受一个Job的实例，相反它接收一个Job实现类，以便运行时通过newInstance()的反射机制实例化Job。因此需要通过一个类来描述Job的实现类及其它相关的静态信息，如Job名字、描述、关联监听器等信息，JobDetail承担了这一角色。通过该类的构造函数可以更具体地了解它的功用：JobDetail(java.lang.String name, java.lang.String group, java.lang.Class jobClass)，该构造函数要求指定Job的实现类，以及任务在Scheduler中的组名和Job名称；

1. Trigger：是一个类，描述触发Job执行的时间触发规则。主要有SimpleTrigger和CronTrigger这两个子类。当仅需触发一次或者以固定时间间隔周期执行，SimpleTrigger是最适合的选择；而CronTrigger则可以通过Cron表达式定义出各种复杂时间规则的调度方案：如每早晨9:00执行，周一、周三、周五下午5:00执行等；

1. Calendar：org.quartz.Calendar和java.util.Calendar不同，它是一些日历特定时间点的集合（可以简单地将org.quartz.Calendar看作java.util.Calendar的集合——java.util.Calendar代表一个日历时间点，无特殊说明后面的Calendar即指org.quartz.Calendar）。一个Trigger可以和多个Calendar关联，以便排除或包含某些时间点。

1. Scheduler：代表一个Quartz的独立运行容器，Trigger和JobDetail可以注册到Scheduler中，两者在Scheduler中拥有各自的组及名称，组及名称是Scheduler查找定位容器中某一对象的依据，Trigger的组及名称必须唯一，JobDetail的组和名称也必须唯一（但可以和Trigger的组和名称相同，因为它们是不同类型的）。Scheduler定义了多个接口方法，允许外部通过组及名称访问和控制容器中Trigger和JobDetail。
   
1. ThreadPool：Scheduler使用一个线程池作为任务运行的基础设施，任务通过共享线程池中的线程提高运行效率。

![](/media/2020/quartz.png)

Scheduler、Trigger和Job是Quartz的三大核心组件。

## Quartz集群

虽然单个Quartz实例能给予你很好的Job调度能力，但它不能满足典型的企业需求，如可伸缩性、高可靠性满足。假如你需要故障转移的能力并能运行日益增多的 Job，Quartz集群势必成为你应用的一部分了。使用 Quartz 的集群能力可以更好的支持你的业务需求，并且即使是其中一台机器在最糟的时间崩溃了也能确保所有的 Job 得到执行。

一个 Quartz 集群中的每个节点是一个独立的 Quartz 应用，它又管理着其他的节点。意思是你必须对每个节点分别启动或停止。不像许多应用服务器的集群，独立的 Quartz 节点并不与另一其的节点或是管理节点通信。Quartz 应用是通过数据库表来感知到另一应用的。

![](/media/2020/quartz-distributed.webp)

## 实战

首先我们先创建一个新的类，叫做QuartzTest，并添加对应的main方法。具体代码如下：

```Java
// 需要引入的静态方法
import static org.quartz.TriggerBuilder.newTrigger;
import static org.quartz.SimpleScheduleBuilder.simpleSchedule;
import static org.quartz.JobBuilder.newJob;
public static void main(String[] args) throws SchedulerException {
    // 实例化一个Scheduler
    Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();
    // 设置Trigger
    Trigger trigger = newTrigger() // 需要手动引入静态方法，用于常见一个Trigger
            .withIdentity("trigger1", "group1") // 设置名称和分组
            .startNow() //启动trigger
            .withSchedule(simpleSchedule().withIntervalInSeconds(1).repeatForever()) // 设置任务调度的类型、时间间隔和持续触发
            .build();
    // 设置JobDetail
    JobDetail jobDetail = newJob(MyJobDetail.class)
            .withIdentity("jobDetail1", "group1")
            .usingJobData("user", "AlanShelby")
            .build();
    // 设置一个任务调度，需要一个JobDetail和一个Trigger
    scheduler.scheduleJob(jobDetail, trigger);
    // 启动任务调度
    scheduler.start();
    // 设置指定的睡眠时间
    try {
        Thread.sleep(1000000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    // 关闭任务调度
    scheduler.shutdown();
}
```
在上面的代码中引入了三个静态方法，需手动引入，还有另一种方法，可以不引入静态方法，具体如果编写在下一节中进行演示。可以看到代码中设置了一个JobDetail，这个需要我们自定义一个类，创建MyJobDetail类，实现quartz中的Job类，重写execute方法，代码如下所示：
   
```Java
public class MyJobDetail implements Job {

    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        JobDetail jobDetail = jobExecutionContext.getJobDetail();
        Map map = jobDetail.getJobDataMap();
        System.out.println("time is ---" + getTime() + "data is ---" + map.get("user"));
    }

    // 获取时间的方法
    public String getTime() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss SSS");
        long millis = System.currentTimeMillis();
        String times = sdf.format(millis);
        return times;
    }
}
```
至此，一个简单的demo就完成了，输出信息每一秒打印一次。

## FAQ

**Timer 和 Quartz 之间有什么区别？**

1. Timer 只能执行定时定频率的任务，而 Quartz 不是
1. Timer 只有一个线程在执行，而 Quartz 有线程池，默认开启 10 个线程
1. Timer 中出现异常，一切 GC，不能记录事故现场，而Quartz可以

## 扩展阅读

1. 官方网站：http://www.quartz-scheduler.org/
1. 源码地址：https://github.com/quartz-scheduler/quartz
1. SpringBoot + quartz 的DEMO: https://github.com/tenstone/spring-boot-quartz-demo