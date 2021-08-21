---
title: "Java中synchronized详解"
date: 2020-04-10T14:40:21+08:00
categories:
    - "高并发" 
tags: 
    - "Java"    
    - "锁"
toc: true
---

synchronized 是 Java 中的关键字，是利用锁的机制来实现同步的。锁机制有如下两种特性：

* 互斥性：即在同一时间只允许一个线程持有某个对象锁，通过这种特性来实现多线程中的协调机制，这样在同一时间只有一个线程对需同步的代码块(复合操作)进行访问。互斥性我们也往往称为操作的原子性。

* 可见性：必须确保在锁被释放之前，对共享变量所做的修改，对于随后获得该锁的另一个线程是可见的（即在获得锁时应获得最新共享变量的值），否则另一个线程可能是在本地缓存的某个副本上继续操作从而引起不一致。

## 对象锁和类锁

1. 对象锁
在 Java 中，每个对象都会有一个 monitor 对象，这个对象其实就是 Java 对象的锁，通常会被称为“内置锁”或“对象锁”。类的对象可以有多个，所以每个对象有其独立的对象锁，互不干扰。
2. 类锁
在 Java 中，针对每个类也有一个锁，可以称为“类锁”，类锁实际上是通过对象锁实现的，即类的 Class 对象锁。每个类只有一个 Class 对象，所以每个类只有一个类锁。

## synchronized 的用法分类

synchronized 的用法可以从两个维度上面分类：

1. 根据修饰对象分类
1. synchronized 可以修饰方法和代码块

修饰代码块
```Java
synchronized(this|object) {}
synchronized(类.class) {}
```

### 修饰方法

#### 修饰非静态方法

获取对象锁
```Java
synchronized(this|object) {}
```
#### 修饰静态方法
相当于给当前类加锁，进入同步方法要获得当前类的锁。我们首先看这个例子，尽管加了synchronized这个关键字，依然是线程不安全的。因为这时两个不同的线程指向不同的对象。如果在synchronized加static ,就能够保持线程安全。此时请求是当前类的类锁。这个锁称为类锁。

获取类锁
```Java
synchronized(类.class) {}
```
----
## synchronized 的用法详解
这里根据获取的锁分类来分析 synchronized 的用法

### 获取对象锁
#### 对于同一对象

同步线程类：
```Java
class SyncThread implements Runnable {
    @Override
    public void run() {
        String threadName = Thread.currentThread().getName();
        if (threadName.startsWith("A")) {
            async();
        } else if (threadName.startsWith("B")) {
            sync1();
        } else if (threadName.startsWith("C")) {
            sync2();
        }
    }
    /**
     * 异步方法
     */
    private void async() {
        try {
            System.out.println(Thread.currentThread().getName() + "_Async_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + "_Async_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    /**
     * 方法中有 synchronized(this|object) {} 同步代码块
     */
    private void sync1() {
        System.out.println(Thread.currentThread().getName() + "_Sync1: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        synchronized (this) {
            try {
                System.out.println(Thread.currentThread().getName() + "_Sync1_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
                Thread.sleep(2000);
                System.out.println(Thread.currentThread().getName() + "_Sync1_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
    /**
     * synchronized 修饰非静态方法
     */
    private synchronized void sync2() {
        System.out.println(Thread.currentThread().getName() + "_Sync2: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        try {
            System.out.println(Thread.currentThread().getName() + "_Sync2_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + "_Sync2_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}

public class SyncTest {
    public static void main(String... args) {
        SyncThread syncThread = new SyncThread();
        Thread A_thread1 = new Thread(syncThread, "A_thread1");
        Thread A_thread2 = new Thread(syncThread, "A_thread2");
        Thread B_thread1 = new Thread(syncThread, "B_thread1");
        Thread B_thread2 = new Thread(syncThread, "B_thread2");
        Thread C_thread1 = new Thread(syncThread, "C_thread1");
        Thread C_thread2 = new Thread(syncThread, "C_thread2");
        A_thread1.start();
        A_thread2.start();
        B_thread1.start();
        B_thread2.start();
        C_thread1.start();
        C_thread2.start();
    }
}
```

```text
B_thread2_Sync1: 14:44:20
A_thread1_Async_Start: 14:44:20
B_thread1_Sync1: 14:44:20
C_thread1_Sync2: 14:44:20
A_thread2_Async_Start: 14:44:20
C_thread1_Sync2_Start: 14:44:20
A_thread1_Async_End: 14:44:22
A_thread2_Async_End: 14:44:22
C_thread1_Sync2_End: 14:44:22
B_thread1_Sync1_Start: 14:44:22
B_thread1_Sync1_End: 14:44:24
B_thread2_Sync1_Start: 14:44:24
B_thread2_Sync1_End: 14:44:26
C_thread2_Sync2: 14:44:26
C_thread2_Sync2_Start: 14:44:26
C_thread2_Sync2_End: 14:44:28
```

结果分析：

A 类线程访问方法中没有同步代码块，A 类线程是异步的，所以有线程访问对象的同步代码块时，另外的线程可以访问该对象的非同步代码块：
```text
A_thread1_Async_Start: 14:44:20
A_thread2_Async_Start: 14:44:20
A_thread1_Async_End: 14:44:22
A_thread2_Async_End: 14:44:22
```

B 类线程访问的方法中有同步代码块，B 类线程是同步的，一个线程在访问对象的同步代码块，另一个访问对象的同步代码块的线程会被阻塞：
```text
B_thread1_Sync1_Start: 14:44:22
B_thread1_Sync1_End: 14:44:24
B_thread2_Sync1_Start: 14:44:24
B_thread2_Sync1_End: 14:44:26

```

synchronized(this|object) {} 代码块 {} 之外的代码依然是异步的：
```text
B_thread2_Sync1: 14:44:20
B_thread1_Sync1: 14:44:20
```

C 类线程访问的是 synchronized 修饰非静态方法，C 类线程是同步的，一个线程在访问对象的同步代方法，另一个访问对象同步方法的线程会被阻塞：
```text
C_thread1_Sync2_Start: 14:44:20
C_thread1_Sync2_End: 14:44:22
C_thread2_Sync2_Start: 14:44:26
C_thread2_Sync2_End: 14:44:28
```
synchronized 修饰非静态方法，作用范围是整个方法，所以方法中所有的代码都是同步的：
```text
C_thread1_Sync2: 14:44:20
C_thread2_Sync2: 14:44:26
```

由结果可知 B 类和 C 类线程顺序执行，类中 synchronized(this|object) {} 代码块和 synchronized 修饰非静态方法获取的锁是同一个锁，即该类的对象的对象锁。所以 B 类线程和 C 类线程也是同步的：
```text
B_thread1_Sync1_Start: 14:44:22
B_thread1_Sync1_End: 14:44:24
C_thread1_Sync2_Start: 14:44:20
C_thread1_Sync2_End: 14:44:22
B_thread2_Sync1_Start: 14:44:24
B_thread2_Sync1_End: 14:44:26
C_thread2_Sync2_Start: 14:44:26
C_thread2_Sync2_End: 14:44:28
```

#### 对于不同对象

修改测试代码为：
```Java
public class SyncTest {

    public static void main(String... args) {
        Thread A_thread1 = new Thread(new SyncThread(), "A_thread1");
        Thread A_thread2 = new Thread(new SyncThread(), "A_thread2");
        Thread B_thread1 = new Thread(new SyncThread(), "B_thread1");
        Thread B_thread2 = new Thread(new SyncThread(), "B_thread2");
        Thread C_thread1 = new Thread(new SyncThread(), "C_thread1");
        Thread C_thread2 = new Thread(new SyncThread(), "C_thread2");
        A_thread1.start();
        A_thread2.start();
        B_thread1.start();
        B_thread2.start();
        C_thread1.start();
        C_thread2.start();
    }
}
```

运行结果：
```text
A_thread2_Async_Start: 15:01:34
C_thread2_Sync2: 15:01:34
B_thread2_Sync1: 15:01:34
C_thread1_Sync2: 15:01:34
B_thread2_Sync1_Start: 15:01:34
B_thread1_Sync1: 15:01:34
C_thread1_Sync2_Start: 15:01:34
A_thread1_Async_Start: 15:01:34
C_thread2_Sync2_Start: 15:01:34
B_thread1_Sync1_Start: 15:01:34
C_thread1_Sync2_End: 15:01:36
A_thread1_Async_End: 15:01:36
C_thread2_Sync2_End: 15:01:36
B_thread2_Sync1_End: 15:01:36
B_thread1_Sync1_End: 15:01:36
A_thread2_Async_End: 15:01:36
```

结果分析：

两个线程访问不同对象的 synchronized(this|object) {} 代码块和 synchronized 修饰非静态方法是异步的，同一个类的不同对象的对象锁互不干扰。



### 获取类锁
#### 对于同一对象

同步线程类：
```Java
class SyncThread implements Runnable {

    @Override
    public void run() {
        String threadName = Thread.currentThread().getName();
        if (threadName.startsWith("A")) {
            async();
        } else if (threadName.startsWith("B")) {
            sync1();
        } else if (threadName.startsWith("C")) {
            sync2();
        }

    }

    /**
     * 异步方法
     */
    private void async() {
        try {
            System.out.println(Thread.currentThread().getName() + "_Async_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + "_Async_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    /**
     * 方法中有 synchronized(类.class) {} 同步代码块
     */
    private void sync1() {
        System.out.println(Thread.currentThread().getName() + "_Sync1: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        synchronized (SyncThread.class) {
            try {
                System.out.println(Thread.currentThread().getName() + "_Sync1_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
                Thread.sleep(2000);
                System.out.println(Thread.currentThread().getName() + "_Sync1_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * synchronized 修饰静态方法
     */
    private synchronized static void sync2() {
        System.out.println(Thread.currentThread().getName() + "_Sync2: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        try {
            System.out.println(Thread.currentThread().getName() + "_Sync2_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + "_Sync2_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

测试代码：
```Java
public class SyncTest {

    public static void main(String... args) {
        SyncThread syncThread = new SyncThread();
        Thread A_thread1 = new Thread(syncThread, "A_thread1");
        Thread A_thread2 = new Thread(syncThread, "A_thread2");
        Thread B_thread1 = new Thread(syncThread, "B_thread1");
        Thread B_thread2 = new Thread(syncThread, "B_thread2");
        Thread C_thread1 = new Thread(syncThread, "C_thread1");
        Thread C_thread2 = new Thread(syncThread, "C_thread2");
        A_thread1.start();
        A_thread2.start();
        B_thread1.start();
        B_thread2.start();
        C_thread1.start();
        C_thread2.start();
    }
}
```

运行结果：
```text
B_thread1_Sync1: 15:08:13
C_thread1_Sync2: 15:08:13
B_thread2_Sync1: 15:08:13
A_thread1_Async_Start: 15:08:13
C_thread1_Sync2_Start: 15:08:13
A_thread2_Async_Start: 15:08:13
C_thread1_Sync2_End: 15:08:15
A_thread2_Async_End: 15:08:15
A_thread1_Async_End: 15:08:15
B_thread2_Sync1_Start: 15:08:15
B_thread2_Sync1_End: 15:08:17
B_thread1_Sync1_Start: 15:08:17
B_thread1_Sync1_End: 15:08:19
C_thread2_Sync2: 15:08:19
C_thread2_Sync2_Start: 15:08:19
C_thread2_Sync2_End: 15:08:21
```

结果分析：

由结果可以看出，在同一对象的情况下，synchronized(类.class) {} 代码块或 synchronized 修饰静态方法和 synchronized(this|object) {} 代码块和 synchronized 修饰非静态方法的行为一致。



#### 对于不同对象

修改测试代码为：
```Java
public class SyncTest {

    public static void main(String... args) {
        Thread A_thread1 = new Thread(new SyncThread(), "A_thread1");
        Thread A_thread2 = new Thread(new SyncThread(), "A_thread2");
        Thread B_thread1 = new Thread(new SyncThread(), "B_thread1");
        Thread B_thread2 = new Thread(new SyncThread(), "B_thread2");
        Thread C_thread1 = new Thread(new SyncThread(), "C_thread1");
        Thread C_thread2 = new Thread(new SyncThread(), "C_thread2");
        A_thread1.start();
        A_thread2.start();
        B_thread1.start();
        B_thread2.start();
        C_thread1.start();
        C_thread2.start();
    }
}
```

运行结果：
```text
A_thread2_Async_Start: 15:17:28
B_thread2_Sync1: 15:17:28
A_thread1_Async_Start: 15:17:28
B_thread1_Sync1: 15:17:28
C_thread1_Sync2: 15:17:28
C_thread1_Sync2_Start: 15:17:28
C_thread1_Sync2_End: 15:17:30
A_thread2_Async_End: 15:17:30
B_thread1_Sync1_Start: 15:17:30
A_thread1_Async_End: 15:17:30
B_thread1_Sync1_End: 15:17:32
B_thread2_Sync1_Start: 15:17:32
B_thread2_Sync1_End: 15:17:34
C_thread2_Sync2: 15:17:34
C_thread2_Sync2_Start: 15:17:34
C_thread2_Sync2_End: 15:17:36
```

结果分析：

两个线程访问不同对象的 synchronized(类.class) {} 代码块或 synchronized 修饰静态方法还是同步的，类中 synchronized(类.class) {} 代码块和 synchronized 修饰静态方法获取的锁是类锁。对于同一个类的不同对象的类锁是同一个。


3 类中同时有 synchronized(类.class) {} 代码块或 synchronized 修饰静态方法和 synchronized(this|object) {} 代码块和 synchronized 修饰非静态方法时会怎样？

修改同步线程类：
```Java
class SyncThread implements Runnable {

    @Override
    public void run() {
        String threadName = Thread.currentThread().getName();
        if (threadName.startsWith("A")) {
            async();
        } else if (threadName.startsWith("B")) {
            sync1();
        } else if (threadName.startsWith("C")) {
            sync2();
        }

    }

    /**
     * 异步方法
     */
    private void async() {
        try {
            System.out.println(Thread.currentThread().getName() + "_Async_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + "_Async_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    /**
     * synchronized 修饰非静态方法
     */
    private synchronized void sync1() {
        try {
            System.out.println(Thread.currentThread().getName() + "_Sync1_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + "_Sync1_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    /**
     * synchronized 修饰静态方法
     */
    private synchronized static void sync2() {
        try {
            System.out.println(Thread.currentThread().getName() + "_Sync2_Start: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
            Thread.sleep(2000);
            System.out.println(Thread.currentThread().getName() + "_Sync2_End: " + new SimpleDateFormat("HH:mm:ss").format(new Date()));
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

修改测试代码：
```Java
public class SyncTest {

    public static void main(String... args) {
        Thread B_thread1 = new Thread(syncThread, "B_thread1");
        Thread C_thread1 = new Thread(syncThread, "C_thread1");
        B_thread1.start();
        C_thread1.start();
    }
}
```

运行结果：
```text
B_thread1_Sync1_Start: 15:35:21
C_thread1_Sync2_Start: 15:35:21
B_thread1_Sync1_End: 15:35:23
C_thread1_Sync2_End: 15:35:23
```

运行结果分析：

由结果可以看到 B 类线程和 C 类线程是异步的，即 synchronized 修饰静态方法和 synchronized 修饰非静态方法是异步的，对于 synchronized(类.class) {} 代码块和 synchronized(this|object) {} 代码块也是一样的。所以对象锁和类锁是独立的，互不干扰。



## 补充

1. synchronized关键字不能继承。
1. 对于父类中的 synchronized 修饰方法，子类在覆盖该方法时，默认情况下不是同步的，必须显示的使用 synchronized 关键字修饰才行。
1. 在定义接口方法时不能使用synchronized关键字。
1. 构造方法不能使用synchronized关键字，但可以使用synchronized代码块来进行同步。

