---
title: "Synchronized修饰静态方法和非静态方法总结"
date: 2020-04-10T15:34:49+08:00
categories:
    - "Java" 
tags:
    - "多线程"
---

synchronized 的本质就是一个可重入锁，大致分为以下两类

1. 有对象锁 synchronized(this),或者非静态方法上加synchronized修饰
2. 类锁 synchronized(XX.class),或者静态方法上加synchronized修饰

<!--more-->

## Synchronized修饰非静态方法，实际上是对调用该方法的对象加锁，俗称“对象锁”

Java中每个对象都有一个锁，并且是唯一的。假设分配的一个对象空间，里面有多个方法，相当于空间里面有多个小房间，如果我们把所有的小房间都加锁，因为这个对象只有一把钥匙，因此同一时间只能有一个人打开一个小房间，然后用完了还回去，再由JVM 去分配下一个获得钥匙的人。

情况1：同一个对象在两个线程中分别访问该对象的两个同步方法
结果：会产生互斥。
解释：因为锁针对的是对象，当对象调用一个synchronized方法时，其他同步方法需要等待其执行结束并释放锁后才能执行。

情况2：不同对象在两个线程中调用同一个同步方法
结果：不会产生互斥。
解释：因为是两个对象，锁针对的是对象，并不是方法，所以可以并发执行，不会互斥。形象的来说就是因为我们每个线程在调用方法的时候都是new 一个对象，那么就会出现两个空间，两把钥匙，

## Synchronized修饰静态方法，实际上是对该类对象加锁，俗称“类锁”

情况1：用类直接在两个线程中调用两个不同的同步方法
结果：会产生互斥。
解释：因为对静态对象加锁实际上对类（.class）加锁，类对象只有一个，可以理解为任何时候都只有一个空间，里面有N个房间，一把锁，因此房间（同步方法）之间一定是互斥的。

注：上述情况和用单例模式声明一个对象来调用非静态方法的情况是一样的，因为永远就只有这一个对象。所以访问同步方法之间一定是互斥的。

情况2：用一个类的静态对象在两个线程中调用静态方法或非静态方法
结果：会产生互斥。
解释：因为是一个对象调用，同上。

情况3：一个对象在两个线程中分别调用一个静态同步方法和一个非静态同步方法
结果：不会产生互斥。
解释：因为虽然是一个对象调用，但是两个方法的锁类型不同，调用的静态方法实际上是类对象在调用，即这两个方法产生的并不是同一个对象锁，因此不会互斥，会并发执行。


测试代码：
同步方法类：SynchronizedTest.java
```Java
public class SynchronizedTest {
	/*private SynchronizedTest(){}
	private static SynchronizedTest st;           //懒汉式单例模式，线程不安全，需要加synchronized同步
	public static SynchronizedTest getInstance(){
		if(st == null){
			st = new SynchronizedTest();
		}
		return st;
	}*/
	/*private SynchronizedTest(){}
	private static final SynchronizedTest st = new SynchronizedTest();  //饿汉式单利模式，天生线程安全
	public static SynchronizedTest getInstance(){
		return st;
	}*/
	
	public static SynchronizedTest staticIn = new SynchronizedTest();   //静态对象
	
     public synchronized void method1(){                                      //非静态方法1
    	 for(int i = 0;i < 10;i++){  
    		 System.out.println("method1 is running!");
    		 try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
    	 }
     }
     public synchronized void method2(){                                   //非静态方法2
    	 for( int i = 0; i < 10 ; i++){
    		 System.out.println("method2 is running!");
    		 try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
    	 }
     }
    public synchronized static void staticMethod1(){                     //静态方法1
    	for( int i = 0; i < 10 ; i++){
   		 System.out.println("static method1 is running!");
   		 try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
   	 }
    }
    public synchronized static void staticMethod2(){                      //静态方法2
    	for( int i = 0; i < 10 ; i++){
   		 System.out.println("static method2 is running!");
   		 try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
   	 }
    }
}
```


线程类1：Thread1.java（释放不同的注释可以测试不同的情况）
```Java
public class Thread1 implements Runnable{
 
	@Override
	public void run() {
//		SynchronizedTest s = SynchronizedTest.getInstance();
//		s.method1();
//		SynchronizedTest s1 = new SynchronizedTest();
//		s1.method1();
		SynchronizedTest.staticIn.method1();
 
//		SynchronizedTest.staticMethod1();
//		SynchronizedTest.staticMethod2();
	}
}
```
```Java
线程类2：Thread2.Java
public class Thread2 implements Runnable{
 
	@Override
	public void run() {
		// TODO Auto-generated method stub
//		SynchronizedTest s = SynchronizedTest.getInstance();
//		SynchronizedTest s2 = new SynchronizedTest();
//		s2.method1();
//		s.method2();
//		SynchronizedTest.staticMethod1();
//		SynchronizedTest.staticMethod2();
//		SynchronizedTest.staticIn.method2();
		SynchronizedTest.staticIn.staticMethod1();
	}
}
```

主类：ThreadMain.java
```Java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
 
public class ThreadMain {
	public static void main(String[] args) {
	Thread t1 = new Thread(new Thread1());
        Thread t2 = new Thread(new Thread2());
        ExecutorService exec = Executors.newCachedThreadPool();
        exec.execute(t1);
        exec.execute(t2);
        exec.shutdown();
	}
 
}
```


## 总结

1. 对象锁钥匙只能有一把才能互斥，才能保证共享变量的唯一性
2. 在静态方法上的锁，和 实例方法上的锁，默认不是同样的，如果同步需要制定两把锁一样。
3. 关于同一个类的方法上的锁，来自于调用该方法的对象，如果调用该方法的对象是相同的，那么锁必然相同，否则就不相同。比如 new A().x() 和 new A().x(),对象不同，锁不同，如果A的单利的，就能互斥。
4. 静态方法加锁，能和所有其他静态方法加锁的 进行互斥
5. 静态方法加锁，和xx.class 锁效果一样，直接属于类的
