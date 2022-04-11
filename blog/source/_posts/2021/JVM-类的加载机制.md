---
title: "JVM 类的加载机制"
date: 2020-04-10T19:36:59+08:00
categories: 
    - "后端"
tags: 
    - "JVM"  
---

从类被加载到虚拟机内存中开始，到卸御出内存为止，它的整个生命周期分为7个阶段，加载(Loading)、验证(Verification)、准备(Preparation)、解析(Resolution)、初始化(Initialization)、使用(Using)、卸御(Unloading)。其中验证、准备、解析三个部分统称为连接。

![](/images/posts/2020/jvm-classloader.webp)
<!--more-->

## Java类加载机制的七个阶段

当我们的Java代码编译完成后，会生成对应的 class 文件。接着我们运行java Demo命令的时候，我们其实是启动了JVM 虚拟机执行 class 字节码文件的内容。而 JVM 虚拟机执行 class 字节码的过程可以分为七个阶段：加载、验证、准备、解析、初始化、使用、卸载。

### 加载

下面是对于加载过程最为官方的描述。

加载阶段是类加载过程的第一个阶段。在这个阶段，JVM 的主要目的是将字节码从各个位置（网络、磁盘等）转化为二进制字节流加载到内存中，接着会为这个类在 JVM 的方法区创建一个对应的 Class 对象，这个 Class 对象就是这个类各种数据的访问入口。

其实加载阶段用一句话来说就是：把代码数据加载到内存中。这个过程对于我们解答这道问题没有直接的关系，但这是类加载机制的一个过程，所以必须要提一下。

### 验证

当 JVM 加载完 Class 字节码文件并在方法区创建对应的 Class 对象之后，JVM 便会启动对该字节码流的校验，只有符合 JVM 字节码规范的文件才能被 JVM 正确执行。这个校验过程大致可以分为下面几个类型：

JVM规范校验。JVM 会对字节流进行文件格式校验，判断其是否符合 JVM 规范，是否能被当前版本的虚拟机处理。例如：文件是否是以 0x cafe bene开头，主次版本号是否在当前虚拟机处理范围之内等。
代码逻辑校验。JVM 会对代码组成的数据流和控制流进行校验，确保 JVM 运行该字节码文件后不会出现致命错误。例如一个方法要求传入 int 类型的参数，但是使用它的时候却传入了一个 String 类型的参数。一个方法要求返回 String 类型的结果，但是最后却没有返回结果。代码中引用了一个名为 Apple 的类，但是你实际上却没有定义 Apple 类。
当代码数据被加载到内存中后，虚拟机就会对代码数据进行校验，看看这份代码是不是真的按照JVM规范去写的。这个过程对于我们解答问题也没有直接的关系，但是了解类加载机制必须要知道有这个过程。

### 准备（重点）
当完成字节码文件的校验之后，JVM 便会开始为类变量分配内存并初始化。这里需要注意两个关键点，即内存分配的对象以及初始化的类型。

内存分配的对象。Java 中的变量有「类变量」和「类成员变量」两种类型，「类变量」指的是被 static 修饰的变量，而其他所有类型的变量都属于「类成员变量」。在准备阶段，JVM 只会为「类变量」分配内存，而不会为「类成员变量」分配内存。「类成员变量」的内存分配需要等到初始化阶段才开始。
例如下面的代码在准备阶段，只会为 factor 属性分配内存，而不会为 website 属性分配内存。

```Java
public static int factor = 3;
public String website = "www.cnblogs.com/chanshuyi";
```
初始化的类型。在准备阶段，JVM 会为类变量分配内存，并为其初始化。但是这里的初始化指的是为变量赋予 Java 语言中该数据类型的零值，而不是用户代码里初始化的值。
例如下面的代码在准备阶段之后，sector 的值将是 0，而不是 3。
```Java
public static int sector = 3;
```
但如果一个变量是常量（被 static final 修饰）的话，那么在准备阶段，属性便会被赋予用户希望的值。例如下面的代码在准备阶段之后，number 的值将是 3，而不是 0。
```Java
public static final int number = 3;
```
之所以 static final 会直接被复制，而 static 变量会被赋予零值。其实我们稍微思考一下就能想明白了。

两个语句的区别是一个有 final 关键字修饰，另外一个没有。而 final 关键字在 Java 中代表不可改变的意思，意思就是说 number 的值一旦赋值就不会在改变了。既然一旦赋值就不会再改变，那么就必须一开始就给其赋予用户想要的值，因此被 final 修饰的类变量在准备阶段就会被赋予想要的值。而没有被 final 修饰的类变量，其可能在初始化阶段或者运行阶段发生变化，所以就没有必要在准备阶段对它赋予用户想要的值。

### 解析
当通过准备阶段之后，JVM 针对类或接口、字段、类方法、接口方法、方法类型、方法句柄和调用点限定符 7 类引用进行解析。这个阶段的主要任务是将其在常量池中的符号引用替换成直接其在内存中的直接引用。

其实这个阶段对于我们来说也是几乎透明的，了解一下就好。

### 初始化（重点）

到了初始化阶段，用户定义的 Java 程序代码才真正开始执行。在这个阶段，JVM 会根据语句执行顺序对类对象进行初始化，一般来说当 JVM 遇到下面 5 种情况的时候会触发初始化：

遇到 new、getstatic、putstatic、invokestatic 这四条字节码指令时，如果类没有进行过初始化，则需要先触发其初始化。生成这4条指令的最常见的Java代码场景是：使用new关键字实例化对象的时候、读取或设置一个类的静态字段（被final修饰、已在编译器把结果放入常量池的静态字段除外）的时候，以及调用一个类的静态方法的时候。
使用 java.lang.reflect 包的方法对类进行反射调用的时候，如果类没有进行过初始化，则需要先触发其初始化。
当初始化一个类的时候，如果发现其父类还没有进行过初始化，则需要先触发其父类的初始化。
当虚拟机启动时，用户需要指定一个要执行的主类（包含main()方法的那个类），虚拟机会先初始化这个主类。
当使用 JDK1.7 动态语言支持时，如果一个 java.lang.invoke.MethodHandle实例最后的解析结果 REF_getstatic,REF_putstatic,REF_invokeStatic 的方法句柄，并且这个方法句柄所对应的类没有进行初始化，则需要先出触发其初始化。

### 使用

当 JVM 完成初始化阶段之后，JVM 便开始从入口方法开始执行用户的程序代码。这个阶段也只是了解一下就可以。

### 卸载

当用户程序代码执行完毕后，JVM 便开始销毁创建的 Class 对象，最后负责运行的 JVM 也退出内存。这个阶段也只是了解一下就可以。

看完了Java的类加载机智之后，是不是有点懵呢。不怕，我们先通过一个小例子来醒醒神。
```Java
public class Book {
    public static void main(String[] args)
    {
        System.out.println("Hello ShuYi.");
    }

    Book()
    {
        System.out.println("书的构造方法");
        System.out.println("price=" + price +",amount=" + amount);
    }

    {
        System.out.println("书的普通代码块");
    }

    int price = 110;

    static
    {
        System.out.println("书的静态代码块");
    }

    static int amount = 112;
}
```

思考一下上面这段代码输出什么？

书的静态代码块
Hello ShuYi.
怎么样，你答对了吗？是不是和你想得有点不一样呢。

下面我们来简单分析一下，首先根据上面说到的触发初始化的5种情况的第4种（当虚拟机启动时，用户需要指定一个要执行的主类（包含main()方法的那个类），虚拟机会先初始化这个主类），我们会进行类的初始化。

那么类的初始化顺序到底是怎么样的呢？

在我们代码中，我们只知道有一个构造方法，但实际上Java代码编译成字节码之后，是没有构造方法的概念的，只有类初始化方法 和 对象初始化方法 。

那么这两个方法是怎么来的呢？

类初始化方法。编译器会按照其出现顺序，收集类变量的赋值语句、静态代码块，最终组成类初始化方法。类初始化方法一般在类初始化的时候执行。
上面的这个例子，其类初始化方法就是下面这段代码了：
```Java
    static
    {
        System.out.println("书的静态代码块");
    }
    static int amount = 112;

```
对象初始化方法。编译器会按照其出现顺序，收集成员变量的赋值语句、普通代码块，最后收集构造函数的代码，最终组成对象初始化方法。对象初始化方法一般在实例化类对象的时候执行。
上面这个例子，其对象初始化方法就是下面这段代码了：
```Java
    {
        System.out.println("书的普通代码块");
    }
    int price = 110;
    System.out.println("书的构造方法");
    System.out.println("price=" + price +",amount=" + amount);
```


类初始化方法 和 对象初始化方法 之后，我们再来看这个例子，我们就不难得出上面的答案了。

但细心的朋友一定会发现，其实上面的这个例子其实没有执行对象初始化方法。

因为我们确实没有进行 Book 类对象的实例化。如果你在 main 方法中增加 new Book() 语句，你会发现对象的初始化方法执行了！

## 什么是类装载器ClassLoader

1. ClassLoader是一个抽象类
1. ClassLoader的实例将读入Java字节码将类装载到JVM中
1. ClassLoader可以定制，满足不同的字节码流获取方式
1. ClassLoader负责类装载过程中的加载阶段。

## JVM中的类加载器

1. 启动类加载器（BootStrap ClassLoader）：引导类装入器是用本地代码实现的类装入器，它负责将 jdk中jre/lib下面的核心类库或-Xbootclasspath选项指定的jar包加载到内存中。由于引导类加载器涉及到虚拟机本地实现细节，开发者无法直接获取到启动类加载器的引用，所以不允许直接通过引用进行操作。

1. 扩展类加载器（Extension ClassLoader）：扩展类加载器是由Sun的ExtClassLoader（sun.misc.Launcher$ExtClassLoader）实现的。它负责将jdk中jre/lib/ext或者由系统变量-Djava.ext.dir指定位置中的类库加载到内存中。开发者可以直接使用标准扩展类加载器。

1. 系统类加载器（System ClassLoader）：系统类加载器是由 Sun的 AppClassLoader（sun.misc.Launcher$AppClassLoader）实现的。它负责将系统类路径java -classpath或-Djava.class.path变量所指的目录下的类库加载到内存中。开发者可以直接使用系统类加载器。

下图中展示了类加载器直接的关系和双亲委派模型

![双亲委派模型](/images/posts/2020/classloader2.webp)

从图中我们发现除启动类加载器外，每个加载器都有父的类加载器。

> 双亲委派机制：如果一个类加载器在接到加载类的请求时，它首先不会自己尝试去加载这个类，而是把这个请求任务委托给父类加载器去完成，依次递归，如果父类加载器可以完成类加载任务，就成功返回；只有父类加载器无法完成此加载任务时，才自己去加载。

从类的继承关系来看，ExtClassLoader和AppClassLoader都是继承URLClassLoader，都是ClassLoader的子类。而BootStrapClassLoader是有C++写的，不再java的ClassLoader子类中。

## 自定义类加载器

前面提到了 Java 自带的加载器 BootstrapClassLoader、AppClassLoader和ExtClassLoader，这些都是 Java 已经提供好的。
而真正有意思的，是 自定义类加载器，它允许我们在运行时可以从本地磁盘或网络上动态加载自定义类。这使得开发者可以动态修复某些有问题的类，热更新代码。
下面来实现一个网络类加载器，这个加载器可以从网络上动态下载 .class 文件并加载到虚拟机中使用。
后面我还会写作与 热修复／动态更新 相关的文章，这里先学习 Java 层 NetworkClassLoader 相关的原理。

作为一个 NetworkClassLoader，它首先要继承 ClassLoader；
然后它要实现ClassLoader内的 findClass() 方法。注意，不是loadClass()方法，因为ClassLoader提供了loadClass()（如上面的源码），它会基于双亲委托机制去搜索某个 class，直到搜索不到才会调用自身的findClass()，如果直接复写loadClass()，那还要实现双亲委托机制；
在 findClass() 方法里，要从网络上下载一个 .class 文件，然后转化成 Class 对象供虚拟机使用。

具体实现代码如下：
```Java
  /**
   * Load class from network
   */
  public class NetworkClassLoader extends ClassLoader {
  
      @Override
      protected Class<?> findClass(String name) throws ClassNotFoundException {
          byte[] classData = downloadClassData(name); // 从远程下载
          if (classData == null) {
              super.findClass(name); // 未找到，抛异常
          } else {
              return defineClass(name, classData, 0, classData.length); // convert class byte data to Class<?> object
          }
          return null;
      }
  
      private byte[] downloadClassData(String name) {
          // 从 localhost 下载 .class 文件
          String path = "http://localhost" + File.separatorChar + "java" + File.separatorChar + name.replace('.', File.separatorChar) + ".class"; 
  
          try {
              URL url = new URL(path);
              InputStream ins = url.openStream();
              ByteArrayOutputStream baos = new ByteArrayOutputStream();
              int bufferSize = 4096;
              byte[] buffer = new byte[bufferSize];
              int bytesNumRead = 0;
              while ((bytesNumRead = ins.read(buffer)) != -1) {
                  baos.write(buffer, 0, bytesNumRead); // 把下载的二进制数据存入 ByteArrayOutputStream
              }
              return baos.toByteArray();
          } catch (Exception e) {
              e.printStackTrace();
          }
          return null;
      }
  
      public String getName() {
          System.out.printf("Real NetworkClassLoader\n");
          return "networkClassLoader";
      }
  }
```
这个类的作用是从网络上（这里是本人的 local apache 服务器 http://localhost/java 上）目录里去下载对应的 .class 文件，并转换成 Class<?> 返回回去使用。

下面我们来利用这个 NetworkClassLoader 去加载 localhost 上的 MusicPlayer 类：
   
首先把 MusicPlayer.class 放置于 /Library/WebServer/Documents/java （MacOS）目录下，由于 MacOS 自带 apache 服务器，这里是服务器的默认目录；执行下面一段代码：
```Java
  String className = "classloader.NetworkClass";
  NetworkClassLoader networkClassLoader = new NetworkClassLoader();
  Class<?> clazz  = networkClassLoader.loadClass(className);
```
正常运行，加载 http://localhost/java/classloader/MusicPlayer.class成功。可以看出 NetworkClassLoader 可以正常工作，如果读者要用的话，只要稍微修改 url 的拼接方式即可自行使用。

# 小结

类加载方式是 Java 上非常创新的一项技术，给未来的热修复技术提供了可能。本文力求通过简单的语言和合适的例子来讲解其中双亲委托机制、自定义加载器等，并开发了自定义的NetworkClassLoader。当然，类加载是很有意思的技术，很难覆盖所有知识点，比如不同类加载器加载同一个类，得到的实例却不是同一个等等。

## 双亲委派模型的好处

Java类随着加载它的类加载器一起具备了一种带有优先级的层次关系。比如，Java中的Object类，它存放在rt.jar之中,无论哪一个类加载器要加载这个类，最终都是委派给处于模型最顶端的启动类加载器进行加载，因此Object在各种类加载环境中都是同一个类。如果不采用双亲委派模型，那么由各个类加载器自己取加载的话，那么系统中会存在多种不同的Object类。

# 参考

1. [深入探讨 Java 类加载器](https://www.ibm.com/developerworks/cn/java/j-lo-classloader/index.html)
