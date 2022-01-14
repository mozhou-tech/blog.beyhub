## Java基础

### 数据类型

#### 为什么字符串是不可变的

1. 引入常量池 The *String* is the most widely used data structure. Caching the *String* literals and reusing them saves a lot of heap space because different *String* variables refer to the same object in the *String* pool. *String* intern pool serves exactly this purpose.
   
   Java String Pool is **the special memory region where \*Strings\* are stored by the JVM**. Since *Strings* are immutable in Java, the JVM optimizes the amount of memory allocated for them by storing only one copy of each literal *String* in the pool. This process is called interning

2. 安全性 **If \*Strings\* were mutable, then by the time we execute the update, we can't be sure that the \*String\* we received, even after performing security checks, would be safe.** The untrustworthy caller method still has the reference and can change the *String* between integrity checks. Thus making our query prone to SQL injections in this case. So mutable *Strings* could lead to degradation of security over time.
   
   It could also happen that the *String* *userName* is visible to another thread, which could then change its value after the integrity check.
   
   In general, immutability comes to our rescue in this case because it's easier to operate with sensitive code when values don't change because there are fewer interleavings of operations that might affect the result.

3. 并发 Being immutable automatically makes the *String* thread safe since they won't be changed when accessed from multiple threads.
   
   Hence **immutable objects, in general, can be shared across multiple threads running simultaneously. They're also thread-safe** because if a thread changes the value, then instead of modifying the same, a new *String* would be created in the *String* pool. Hence, *Strings* are safe for multi-threading.

4. Hashcode缓存
   
   Since *String* objects are abundantly used as a data structure, they are also widely used in hash implementations like *HashMap*, *HashTable*, *HashSet*, etc. When operating upon these hash implementations, *hashCode()* method is called quite frequently for bucketing.
   
   The immutability guarantees *Strings* that their value won’t change. So **the \*hashCode()\* method is overridden in \*String\* class to facilitate caching, such that the hash is calculated and cached during the first \*hashCode()\* call and the same value is returned ever since.**
   
   **This, in turn, improves the performance of collections that uses hash implementations when operated with \*String\* objects.**
   
   On the other hand, mutable *Strings* would produce two different hashcodes at the time of insertion and retrieval if contents of *String* was modified after the operation, potentially losing the value object in the *Map*.

5. 性能
   
   As we saw previously, *String* pool exists because *Strings* are immutable. In turn, it enhances the performance by saving heap memory and faster access of hash implementations when operated with *Strings.*
   
   Since *String* is the most widely used data structure, improving the performance of *String* have a considerable effect on improving the performance of the whole application in general.

https://www.baeldung.com/java-string-immutable

#### 8大基本类型

| 数据类型    | 长度    | 位数  | 默认值   |
| ------- | ----- | --- | ----- |
| byte    | 1Byte | 8   | 0     |
| short   | 2Byte | 16  | 0     |
| int     | 4Byte | 32  | 0     |
| long    | 8Byte | 64  | 0     |
| float   | 4Byte | 32  | 0.0f  |
| double  | 8Byte | 64  | 0.0d  |
| boolean | -     | -   | false |

#### boolean基本类型占几个字节

JVM虚拟机规范中没有针对boolean的指令集，这只是 Java 虚拟机的建议。

- HotSop中boolean 类型被编译成 int 类型来使用，占 4 个 byte 
- boolean 数组被编译成 byte 数组类型，每个 boolean 数组成员占 1 个 byte 
- 在 Java 虚拟机里，1 表示 true ，0 表示 false 
- 可以肯定的是，肯定不是占1个比特

#### String、StringBuilder和StringBuffer

#### 为什么Integer128==128返回false

When you compile a number literal in Java and assign it to a Integer (capital `I`) the compiler emits:

```
 Integer b2 = Integer.valueOf(127)
```

This line of code is also generated when you use autoboxing.

`valueOf` is implemented such that certain numbers are "pooled", and it returns the same instance for values smaller than 128.

From the java 1.6 source code, line 621:

```
 public static Integer valueOf(int i) {
     if(i >= -128 && i <= IntegerCache.high)
         return IntegerCache.cache[i + 128];
     else
         return new Integer(i);
 }
```

#### Integer缓冲池IntegerCache

Integer中有个静态内部类IntegerCache，里面有个cache[],也就是**Integer常量池**，常量池的大小为一个字节（-128~127）。

所有整数类型都有类似的缓存机制，其目的是节省内存、提高性能等特性。

The value of `high` can be configured to another value, with the system property.

> -Djava.lang.Integer.IntegerCache.high=999

#### 基本类型的内存分配

字符串的字面量分配到常量池。

包装类在编译阶段自动拆箱。

结合栈上分配、标量替换。

```java
public class DemoTest {
    int y;// 分布在堆上
    public static void main(String[] args) {
      	// 局部变量的基本类型是在栈上分配的。
      	// 栈属于线程私有的空间，局部变量的生命周期和作用域一般都很短，为了提高gc效率，所以没必要放在堆里面。
        int x=1; //分配在栈上
        String name = new String("cat");//数据在堆上，name变量的指针在栈上
        String address = "北京";//数据在常量池，属于堆空间，指针在栈
        Integer price = 4;//包装类型同样是引用类型，编译时会自动装拆箱，所以数据在堆上，指针在栈
    }
}
```

#### 基本类型的包装类

针对各个基本类型的包装类型，如：Integer，Double，Long等，这些属于引用类型，我们直接在局部方法里面使用包装类型赋值，那么数据真正的内存分配还是在堆内存里面，这里有个隐式的拆装箱来自动完成转换，数据的指针是在栈上，包装类型的出现主要是为了基本类型能够用在泛型的设计上和使用null值，而基本类型则拥有更好的计算性能，这一点我们也需要注意。

### 语法

#### equals和==区别(null哪个能用)

### 反射

### 注解

### 异常

### 泛型

### IO

### 集合框架

#### JDK1.7之前的HashMap是如何实现的

#### JDK1.8中HashMap是如何实现的

### SPI机制

#### 如果在catch里return了，finally中的代码还会被执行吗？

#### 双等号==的含义

基本数据类型之间应用双等号，比较的是他们的数值。 复合数据类型(类)之间应用双等号，比较的是他们在内存中的存放地址。

### 其它

#### 为什么Java不是100%的面向对象语言

Java is not 100% Object-oriented because it makes use of eight primitive data types such as boolean, byte, char, int, float, double, long, short which are not objects.

#### Java中为什么不用指针，还作为优点

为了摒弃指针带来的风险（当然了，也就放弃了指针带来的效率）。

1. C/C++什么有指针？

这个很简单，程序都是在内存中运行的，只要有内存，就有内存地址，有地址，就必然有指针，只是C++对内存地址的访问做了语言的支持，称之为指针。

2. 指针的优点？
   a、效率，指针就是内存的地址访问(虽然不是真正的物理地址，但是通过简单的映射就可以得到)，性能非常好。
   b、[C/C++](https://www.baidu.com/s?wd=C%2FC%2B%2B&tn=SE_PcZhidaonwhc_ngpagmjz&rsv_dl=gh_pc_zhidao)语言的需要，[C/C++](https://www.baidu.com/s?wd=C%2FC%2B%2B&tn=SE_PcZhidaonwhc_ngpagmjz&rsv_dl=gh_pc_zhidao)没有完善的面向对象支持，因此你不能声明一个Object类型的形参来接收所有类型的实参，因此C++只能通过万能指针void*来支持，C++中new出来的对象都是指针类型的(区别于直接声明一个类对象，Java中声明一个类的对象不实例化就是null，C/C++中对象类型可以像基本类型那样直接声明一个)。

3. 指针的缺点？
   a、稳定问题，指针太灵活，不小心就容易出现指针访问越界之类的问题，非常容易出问题。
   b、安全性问题。

4. java有类似指针，在java中称为引用。所谓的引用就是内存地址的值。拿到该引用就相当 于得到了该内存处的对象。

> **内存地址**：“在电脑运算中，内存地址是一种用于软件及硬件等不同层级中的数据概念，用来访问电脑主存中的数据。作用在8086的实模式下，把某一段寄存器左移4位，然后与地址ADDR相加后被直接送到内存总线上，这个相加后的地址就是内存单元的物理地址，而程序中的这个地址就叫逻辑地址（或叫虚地址）。”
>
> 内存地址只是一个编号，代表一个内存空间。那么这个空间是多大呢？原来在计算机中存储器的容量是以字节为基本单位的。也就是说一个**内存地址代表一个字节（8bit）的存储空间**。
>
> 32位的操作系统最多支持4GB的内存空间，也就是说CPU只能寻址2的32次方（4GB），注意这里的4GB是以Byte为单位的，不是bit。也就是说有4G=4*1024M（Byte）=4*1024*1024Kb(Byte)=4*1024*1024*1024Byte(8bit)，即2的32次方个8bit单位（1Byte=8bit）。

## Java进阶

### JVM执行引擎

#### 什么是解释器，什么是 JIT 编译器？

**解释器**： 当 Java 虚拟机启动时会根据预定义的规范对字节码采用逐行解释的方式执行，将每条字节码中的内容“翻译”为对应平台的本地机器指令执行。

**编译器**：

> 1、*动态编译*（dynamic compilation）指的是“在运行时进行编译”；与之相对的是事前编译（ahead-of-time compilation，简称AOT），也叫*静态编译*（static compilation）。
> 2、*JIT*编译（just-in-time compilation）狭义来说是当某段代码即将第一次被执行时进行编译，因而叫“即时编译”。*JIT编译是动态编译的一种特例*。JIT编译一词后来被*泛化*，时常与动态编译等价；但要注意广义与狭义的JIT编译所指的区别。
> 3、*自适应动态编译*（adaptive dynamic compilation）也是一种动态编译，但它通常执行的时机比JIT编译迟，先让程序“以某种式”先运行起来，收集一些信息之后再做动态编译。这样的编译可以更加优化。

解释器的执行，抽象的看是这样的：
输入的代码 -> [ 解释器 解释执行 ] -> 执行结果
而要JIT编译然后再执行的话，抽象的看则是：
输入的代码 -> [ 编译器 编译 ] -> 编译后的代码 -> [ 执行 ] -> 执行结果
说JIT比解释快，其实说的是**“执行编译后的代码”比“解释器解释执行”要快**，并不是说“编译”这个动作比“解释”这个动作快。

**为什么不全部编译**: 对一般的Java方法而言，编译后代码的大小相对于字节码的大小，膨胀比达到10x是很正常的。同上面说的时间开销一样，这里的空间开销也是，只有对执行频繁的代码才值得编译，如果把所有代码都编译则会显著增加代码所占空间，导致“代码爆炸”。

#### 为什么HotSopt有Server和Client两个不同的编译器

HotSpot虚拟机中内置了两个即时编译器：Client Complier和Server Complier，简称为C1、C2编译器，分别用在客户端和服务端。目前主流的HotSpot虚拟机中默认是采用解释器与其中一个编译器直接配合的方式工作。程序使用哪个编译器，取决于虚拟机运行的模式。HotSpot虚拟机会根据自身版本与宿主机器的硬件性能自动选择运行模式，用户也可以使用“-client”或“-server”参数去强制指定虚拟机运行在Client模式或Server模式。

用Client Complier获取更高的*编译速度*，用Server Complier 来获取更好的*编译质量*。为什么提供多个即时编译器与为什么提供多个垃圾收集器类似，都是为了适应不同的应用场景。

#### 为什么说 Java 语言是半编译半解释型语言？

Java是一个半解释半编译型语言，早期java是通过解释器来执行，效率低下；后期进行优化，解释器在原本的c++字节码解释器基础上，扩充了模板解释器，效率有了明显提升；后来又加入了JIT（即时编译），效率就更加得到了提升。

解释器：当程序需要迅速启动和执行的时候，解释器可以首先发挥作用，省去编译的时间，立即执行。

编译器：在程序运行后，随着时间的推移，编译器逐渐发挥作用，把越来越多的代码编译成本地代码之后，可以获取更高的执行效率。

两者的协作：在程序运行环境中内存资源限制较大时，可以使用解释执行节约内存，反之可以使用编译执行来提升效率。当通过编译器优化时，发现并没有起到优化作用，，可以通过逆优化退回到解释状态继续执行。

![img](file:///Users/jerrylau/workspace/writting/whoiscat.com/knowledge/resume/images/ba83857ecf9f344e4972fd551c4973d653952.png@648w_454h_80q?lastModify=1637145977)

#### bytecode存在的意义

为了保证WORA，JVM使用Java字节码这种介于Java和机器语言之间的中间语言。**字节码是部署Java代码的最小单位。**

### 对象模型

#### 对象头

1. 对象头（包含锁状态标志，线程持有的锁等标志）

   > - **markOop _mark**![img](images/16d4dc0bfb6ccc39~tplv-t2oaga2asx-watermark-0934554.awebp)![img](images/16d4dc0f83c8387c~tplv-t2oaga2asx-watermark.awebp)
   >
   > - **union _metadata**
   >   元数据指针，它包含了 2 部分内容，klass 和 _compressed_klass 他们指向了对象所属的类。
   >
   >   ```java
   >   class Model
   >   {
   >       public static int a = 1;
   >       public int b;
   >       
   >       public Model(int b) {
   >           this.b = b;
   >       }
   >   }
   >   public static void main(String[] args) {
   >       int c = 10;
   >       Model modelA = new Model(2);
   >       Model modelB = new Model(3);
   >   }
   >   ```
   >
   >   上述代码的内存使用情况如下图所示：
   >
   >   ![img](images/16d4e60e034ff5a5~tplv-t2oaga2asx-watermark.awebp)
   >
   > - **内存布局工具包**
   >
   >   ```xml
   >   <dependency>
   >       <groupId>org.openjdk.jol</groupId>
   >       <artifactId>jol-core</artifactId>
   >       <version>0.10</version>
   >   </dependency>
   >   # 使用方法
   >   # log.info("{}", VM.current().details());
   >       
   >   # log.info("{}",ClassLayout.parseClass(String.class).toPrintable());
   >     [main] INFO com.flydean.JolUsage - java.lang.String object internals:
   >        OFFSET  SIZE      TYPE DESCRIPTION               VALUE
   >             0     4           (object header)           01 c2 63 a2 (00000001 11000010 01100011 10100010) (-1570520575)
   >             4     4           (object header)           0c 00 00 00 (00001100 00000000 00000000 00000000) (12)
   >             8     4           (object header)           77 1a 06 00 (01110111 00011010 00000110 00000000) (399991)
   >            12     4    byte[] String.value          [119, 119, 119, 46, 102, 108, 121, 100, 101, 97, 110, 46, 99, 111, 109]
   >            16     4       int String.hash                               0
   >            20     1      byte String.coder                              0
   >            21     1   boolean String.hashIsZero                         false
   >            22     2           (loss due to the next object alignment)
   >       Instance size: 24 bytes
   >       Space losses: 0 bytes internal + 2 bytes external = 2 bytes total
   >       
   >   # log.info("{}",ClassLayout.parseInstance("www.flydean.com").toPrintable());
   >     [main] INFO com.flydean.JolUsage - java.lang.String object internals:
   >      OFFSET  SIZE      TYPE DESCRIPTION                               VALUE
   >           0     4           (object header)                           01 c2 63 a2 (00000001 11000010 01100011 10100010) (-1570520575)
   >           4     4           (object header)                           0c 00 00 00 (00001100 00000000 00000000 00000000) (12)
   >           8     4           (object header)                           77 1a 06 00 (01110111 00011010 00000110 00000000) (399991)
   >          12     4    byte[] String.value                              [119, 119, 119, 46, 102, 108, 121, 100, 101, 97, 110, 46, 99, 111, 109]
   >          16     4       int String.hash                               0
   >          20     1      byte String.coder                              0
   >          21     1   boolean String.hashIsZero                         false
   >          22     2           (loss due to the next object alignment)
   >     Instance size: 24 bytes
   >     Space losses: 0 bytes internal + 2 bytes external = 2 bytes total
   >   ----
   >   从该对象头中分析加锁信息，MarkWordk为0x00007ff0c80053ea，二进制为0xb00000000 00000000 01111111 11110000 11001000 00000000 01010011 11101010。
   >   倒数第三位为"0"，说明不是偏向锁状态，倒数两位为"10"，因此，是重量级锁状态，那么前面62位就是指向互斥量的指针。
   >   ```

#### 对象模型OOP-Klass Model

OOP-Klass Model（Ordinary Object Point-Klass Model）指的是普通对象指针，用来描述 java 类和对象在 JVM 中的表现形式，OOP 用来表示 java 实例在 JVM 中的表现，Klass 用来表示类在 JVM 中的表现。之所以要一分为二的设计是因为想要避免每个 Java 对象都存在一个虚函数，所以 oop 实例没有虚函数，而 Klass 类有虚函数，虚函数则是实现多态的关键所以 **Java 最终也是通过虚函数来实现多态的**。

> **虚函数** : Java中其实没有虚函数的概念，它的普通函数就相当于C++的虚函数，动态绑定是Java的默认行为。 如果Java中不希望某个函数具有虚函数特性，可以加上final关键字变成非虚函数。 抽象函数或者说是纯虚函数的存在是为了定义接口。 抽象类的存在是因为父类中既包括子类共性函数的具体定义，也包括需要子类各自实现的函数接口。
>
> 抽象函数或者说是纯虚函数的存在是为了定义接口。*C++*中纯虚函数形式为：virtual void print() = 0;Java中纯虚函数形式为：abstract void print();
> *C++*虚函数  *== Java*普通函数
> *C++*纯虚函数 *== Java*抽象函数
> *C++*抽象类  *== Java*抽象类
> *C++*虚基类  *== Java*接口

1. 实例数据
2. 对齐填充

### JVM内存管理

#### 内存分区相关参数有哪些

| 参数名称                        | 可选值     | 说明             |
| ------------------------------- | ---------- | ---------------- |
| -XX:StringTableSize=4901        | 要求为素数 | 字符串池大小     |
| -XX:+PrintStringTableStatistics | -          |                  |
| -XX:-UseCompressedOops          |            | 默认开启指针压缩 |

#### 常量池有哪几种，在什么内存区

1. class文件常量池（方法区，多个） java的源代码`.java`文件在编译之后会生成`.class`文件，class文件需要严格遵循JVM规范才能被JVM正常加载，它是一个二进制字节流文件，里面包含了class文件常量池的内容。
   
   **每个class的字节码文件中都有一个常量池**，里面是编译后即知的该class会用到的字面量与符号引用，这就是class文件常量池。JVM加载class，会将其类信息，包括class文件常量池置于方法区中。
   
   class类信息及其class文件常量池是字节码的二进制流，它代表的是一个类的静态存储结构。

2. 运行时常量池（方法区）
   
   JVM加载类时，需要将其转换为方法区中的java.lang.Class类的对象实例；同时，会**将class文件常量池中的内容导入运行时常量池**。
   
   运行时常量池中的常量对应的内容只是**字面量**，比如一个"字符串"，它还**不是String对象**；当Java程序在运行时执行到这个"字符串"字面量时，会去字符串常量池里找该字面量的对象引用是否存在，存在则直接返回该引用，**不存在则在Java堆里创建该字面量对应的String对象，并将其引用置于字符串常量池中，然后返回该引用**。

3. 字符串常量池（逻辑上属于永久代的方法区，JDK1.7开始挪到了堆区）
   
   字符串常量池，是JVM用来维护字符串实例的一个引用表。在HotSpot虚拟机中，它被实现为一个全局的StringTable，底层是一个c++的hashtable。它将字符串的字面量作为key，实际堆中创建的String对象的引用作为value。
   
   String的字面量被导入JVM的运行时常量池时，并不会马上试图在字符串常量池加入对应String的引用，而是等到程序实际运行时，要用到这个字面量对应的String对象时，才会去字符串常量池试图获取或者加入String对象的引用。因此它是懒加载的。

4. 基本类型包装类常量池（堆） Java的基本数据类型中，除了两个浮点数类型，其他的基本数据类型都在各自内部实现了常量池，但都在[-128~127]这个范围内。

#### 字符串常量池会被GC吗？

Before Java 7, the JVM placed the Java String Pool in the PermGen space, which has a fixed size — it can't be expanded at runtime and is not eligible for garbage collection.

The risk of interning Strings in the PermGen (instead of the Heap) is that we can get an OutOfMemory error from the JVM if we intern too many Strings.

From Java 7 onwards, the Java String Pool is stored in the Heap space, which is garbage collected by the JVM. The advantage of this approach is the reduced risk of OutOfMemory error because unreferenced Strings will be removed from the pool, thereby releasing memory.

#### String s=new String("abc")创建了几个对象?

2个，堆中一个，常量池一个。

String s = new String("abc")实际上是"abc"本身就是**字符串池**中的一个对象，在运行 new String()时，把字符串池的字符串"abc"复制到堆中，并把这个对象的应用交给s，所以创建了两个String对象，一个在字符串池中，一个在堆中。(注：我们假设的是字符串池中默认是没有abc字符串的，如果之前已存在的话，则该题的答案就是一个对象了)

字符串常量池

#### String name=new String("ja"+"hel")对象数？

解一（错误）：

1. "java"创建了一个对象，存于String常量池
2. "hello"创建了一个对象，存于String常量池
3. "java"+"hello",创建了一个对象，存于常量池（基于字符串的+操作，如带有引用的，将在堆中创建对象，否则值会存于字符常量池）
4. new将会创建一个对象，将字符常量池中的"javahello"复制到堆中，一共创建四个对象

解二（正确）：

1. "java"+"hello"，java在编译期间会自己先优化的，会合并成一个对象"javahello"的，然后在字符串池中保留
2. 创建了两个对象，一个javahello的对象在字符串池中，一个new出的对象在堆上

#### java.lang.String.intern()

运行时常量池相对于CLass文件常量池的另外一个重要特征是**具备动态性**，Java语言并不要求常量一定只有编译期才能产生，也就是并非预置入CLass文件中常量池的内容才能进入方法区运行时常量池，运行期间也可能将新的常量放入池中，这种特性被开发人员利用比较多的就是**String类的intern()**方法。

String的intern()方法会查找在常量池中是否存在一份equal相等的字符串,如果有则返回该字符串的引用,如果没有则添加自己的字符串进入常量池。

https://tech.meituan.com/2014/03/06/in-depth-understanding-string-intern.html

#### 数组总是存储在Heap？

堆区中分配空间后会把每个[数组元素](https://so.csdn.net/so/search?q=数组元素)初始化为0。**array是引用变量，它在栈区占用的空间大小为4bytes**。

- 本质上，数组变量是数组的管理者而非数组本身；

- 数组变量之间的赋值是管理权限的赋予；

- 数组变量之间的比较是判断是否管理同一个数组。

- 数组在java中是对象，因此数据会被

  > 案例一：
  >
  > 创建对象数组：Department[] dept = new Department[100]; dept是引用变量。
  > 内存分配关键在于new。
  > 对象数组的默认初始化全部是null，也就是不指向任何对象。所以想要真正初始化，就要：dept[0] = new Department();
  > 这一内存分配模型也适用于二维数组。
  >
  > 从图中可以看出，对象数组变量其实就是**指针的指针**。![在这里插入图片描述](images/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L0NvYmIxNDE=,size_16,color_FFFFFF,t_70.png)
  >
  > -------
  >
  > 案例二：
  >
  > 原始类型的数组例如int[10]，则是把数据存储在堆中。

#### 字符串常量池创建字符串有几种方式?

创建字符串有两种方式：两种内存区域（字符串池，堆）

1. " " 引号创建的字符串在字符串池中

2. new，new创建字符串时首先查看池中是否有相同值的字符串，如果有，则拷贝一份到堆中，然后返回堆中的地址；如果池中没有，则在堆中创建一份，然后返回堆中的地址（注意，此时不需要从堆中复制到池中，否则导致浪费池的空间）

3. 另外，对字符串进行赋值时，如果右操作数含有一个或一个以上的字符串引用时，则在堆中再建立一个字符串对象，返回引用；如String str2=str1+ "abc"; 
   
   比较两个已经存在于字符串池中字符串对象可以用"=="进行，拥有比equals操作符更快的速度。

#### 常量池的好处

常量池是为了避免频繁的创建和销毁对象而影响系统性能，其实现了对象的共享。例如字符串常量池，在编译阶段就把所有的字符串文字放到一个常量池中。 （1）节省内存空间：常量池中所有相同的字符串常量被合并，只占用一个空间。 （2）节省运行时间：比较字符串时，比equals()快。对于两个引用变量，只用判断引用是否相等，也就可以判断实际值是否相等。

#### 常量池在Integer类型中的应用

1. `Integer i1=40；`Java在编译的时候会直接将代码封装成`Integer i1=Integer.valueOf(40);`，从而使用常量池中的对象。
2. `Integer i1 = new Integer(40);`这种情况下会创建新的对象。
3. 除Integer和String类型，Byte,Short,Long,Character,Boolean也使用了常量池技术，值得注意的是`Double`和`Float`两种浮点类型没有使用常量池。

```java
   Integer i1 = 40;
   Integer i2 = new Integer(40);
   Integer i3 = 40;
   System.out.println(i1==i2);//输出false
   System.out.println(i1==i3);//输出true
```

#### JVM逃逸分析、同步消除、标量替换

- 逃逸分析
  
  > JVM通过逃逸分析，那些逃不出方法的对象会在栈上分配。-XX:+DoEscapeAnalysis：启用逃逸分析(默认打开) -XX:-DoEscapeAnalysis：关闭逃逸分析（+号就是开启，-号就是关闭） -XX:+EliminateAllocations：标量替换(默认打开) -XX:+UseTLAB：本地线程分配缓冲(默认打开) -XX:+PrintGC：打出GC日志。
  > 
  > 判断是否发生逃逸：
  > 
  > 1. 任何可以在多个线程间共享的都属于逃逸对象（线程逃逸）
  > 2. 当一个对象在方法中被定义后，对象只在方法内部使用，则认为没有发生逃逸。
  > 3. 当一个对象在方法中被定义后，它被外部方法所引用，则认为发生逃逸。例如作为调用参数传递到其他地方中。
  > 
  > ```
  >  public class EscapeTest {
  >      public static Object globalVariableObject;
  >      public Object instanceObject;
  >      public void globalVariableEscape(){
  >          globalVariableObject = new Object(); // 静态变量,外部线程可见,发生逃逸
  >      }
  >      public void instanceObjectEscape(){
  >          instanceObject = new Object(); // 赋值给堆中实例字段,外部线程可见,发生逃逸
  >      }
  >      public Object returnObjectEscape(){
  >          return new Object();  // 返回实例,外部线程可见，发生逃逸
  >      }
  >      public void noEscape(){
  >          Object noEscape = new Object();  // 仅创建线程可见,对象无逃逸
  >      }
  >  }
  > ```

- 同步消除
  
  > 线程同步本身就是一个相对耗时的过程，如果逃逸分析能够确定**一个变量不会逃逸出线程**，无法被其他线程访问，那这个变量的读写肯定就不会有竞争，对这个变量实施的同步措施也就可以消除掉。

- 标量替换
  
  > 标量（Scalar)是指一个数据已经无法再分解成更小的数据来表示了，Java虚拟机中的原始数据类型（int、long等数值类型 及reference类型等）都不能再进一步分解，它们就可以被称为标量。相对的，如果一个数据可以继续分解，那它就被称做聚合量（Aggregate), Java中的对象就是最典型的聚合量。
  > 
  > 如果把一个Java对象拆散，根据程序访问的情况，将其使用到的成员变量恢复原始类型来访问就叫做标量替换。如果逃逸分析证明一个对象不会被外部访问，并且这个对象可以被拆散的话，那程序真正执行的时候将可能不创建这个对象，而改为直接创建它的若干个被这个方法使用到的成员变景来代替。将对象拆分后，除了可以让对象的成员变量在栈上（栈上存储的数据，很大机会会被虚拟机分配至物理机器的高速寄存器中存储）分配和读写之外，还可以为后续进一步的优化手段创建条件。
  > 
  > ```
  >  public static void main(String[] args) {
  >   alloc();
  >  }
  >  private static void alloc() {
  >   Point point = new Point（1,2）;
  >   System.out.println("point.x="+point.x+"; point.y="+point.y);
  >  }
  >  class Point{
  >   private int x;
  >   private int y;
  >  }
  > ```
  > 
  > 以上代码中，point对象并没有逃逸出alloc方法，并且point对象是可以拆解成标量的。那么，JIT就会不会直接创建Point对象，而是直接使用两个标量int x ，int y来替代Point对象。经过标量替换后，就会变成：
  > 
  > ```
  >  private static void alloc() {
  >  int x = 1;
  >  int y = 2;
  >  System.out.println("point.x="+x+"; point.y="+y);
  >  }
  > ```
  > 
  > Point这个聚合量经过逃逸分析后，发现他并没有逃逸，就被替换成两个聚合量了。那么标量替换有什么好处呢？就是可以大大减少堆内存的占用。因为一旦不需要创建对象了，那么就不再需要分配堆内存了。

#### 对象一定分配在堆中吗？

EscapeAnalysis，逃逸分析，指的是虚拟机在`运行期`通过计算分析将原本在堆上分配的对象改成在栈中分配，这样的好处是栈上分配的对象随着线程的结束而自动销毁，不依赖于GC，可以降低垃圾收集器运行的频率。

#### JVM的内存管理有哪些问题

1. Java 对象存储密度低。一个只包含 boolean 属性的对象占用了16个字节内存：对象头占了8个，boolean 属性占了1个，对齐填充占了7个。而实际上只需要一个bit（1/8字节）就够了。
2. Full GC 会极大地影响性能，尤其是为了处理更大数据而开了很大内存空间的JVM来说，GC 会达到秒级甚至分钟级。
3. OOM 问题影响稳定性。OutOfMemoryError是分布式计算框架经常会遇到的问题，当JVM中所有对象大小超过分配给JVM的内存大小时，就会发生OutOfMemoryError错误，导致JVM崩溃，分布式框架的健壮性和性能都会受到影响。

#### GC调优有哪些参数？

| 参数名称               | 可选值 | 说明              |
| ------------------ | --- | --------------- |
| -XX:MaxPermSize=1G |     | JDK1.7之前设置永久代大小 |

#### 线上系统GC问题如何快速定位与分析?

#### 解释下三色标记算法算法思想?

https://juejin.cn/post/6859931488352370702

#### TLAB

https://segmentfault.com/a/1190000039676470

### JMM

#### 什么是JavaMemoryModel

是根据英文Java Memory Model（JMM）翻译过来的的一套规范，不真实存在，主要是解决多线程共享内存通信中可见性，原子性，顺序性的问题而建立的模型。定义了语法集映射到java关键字volatile、synchronized。

![img](images/513568-20200821160720362-843660073.png)

#### Volatile底层的内存屏障是如何实现的?

内存屏障是CPU指令。如果你的字段是volatile，Java内存模型将在写操作后插入一个写屏障指令，在读操作前插入一个读屏障指令。

下面是基于保守策略的JMM内存屏障插入策略：1）在每个volatile写操作的前面插入一个StoreStore屏障；2）在每个volatile写操作的后面插入一个StoreLoad屏障；3）在每个volatile读操作的前面插入一个LoadLoad屏障；4）在每个volatile读操作的后面插入一个LoadStore屏障。

#### 说下JVM内存模型与]ava线程内存模型的区别?

#### GC执行时机是任何时候都可以吗?安全点知道吗?

#### CMS垃圾收集器的并发更新失败是怎么回事?如何优化?

#### 高并发系统为何建议选择G1垃圾收集器?

#### 阿里巴巴Arthas实现原理能大概说下吗?

#### 单机几十万并发的系统JVM如何优化?

#### 单例模式的双检锁为什么要用volatile修饰，为什么要锁类？

```java
 public class Singleton {  
     private volatile static Singleton singleton;  // volatile 内存屏障
     private Singleton (){}  
     public static Singleton getSingleton() {  
     if (singleton == null) {  
         synchronized (Singleton.class) {         // 类锁是所有线程共享的，所以要锁类
           if (singleton == null) {  
               singleton = new Singleton();  
           }  
         }  
     }  
     return singleton;  
    }  
 }
```

### 数据结构

#### DelayQueue

#### BlockingQueue

#### HashMap

- 数据结构
  
  > 数组Table+链表

- 负载因子loadFactor
  
  > 负载因子是0.75的时候，空间利用率比较高，而且避免了相当多的Hash冲突，使得底层的链表或者是红黑树的高度比较低，提升了空间效率。**比如说当前的容器容量是16，负载因子是0.75,16\*0.75=12，也就是说，当容量达到了12的时候就会进行扩容操作。**
  > 
  > 扩容resize
  > 
  > > 扩容(resize)就是重新计算容量，向HashMap对象里不停的添加元素，而HashMap对象内部的数组无法装载更多的元素时，对象就需要扩大数组的长度，以便能装入更多的元素。当然Java里的数组是无法自动扩容的，方法是使用一个新的数组代替已有的容量小的数组，就像我们用一个小桶装水，如果想装更多的水，就得换大水桶。
  > 
  > Rehash
  > 
  > PUT操作
  > 
  > > ![img](file:///Users/jerrylau/workspace/writting/whoiscat.com/knowledge/resume/images/d669d29c.png?lastModify=1637145977)

https://tech.meituan.com/2016/06/24/java-hashmap.html

### JUC

#### 什么是可重入锁

可重入锁，也叫做递归锁，是指在一个线程中可以多次获取同一把锁，比如：一个线程在执行一个带锁的方法，该方法中又调用了另一个需要相同锁的方法，则该线程可以直接执行调用的方法【即可重入】，而无需重新获得锁。

实现原理：**加锁时**，需要判断锁是否已经被获取。如果已经被获取，则判断获取锁的线程是否是当前线程。如果是当前线程，则给获取次数加1。如果不是当前线程，则需要等待。**释放锁时**，需要给锁的获取次数减1，然后判断，次数是否为0了。如果次数为0了，则需要调用锁的唤醒方法，让锁上阻塞的其他线程得到执行的机会。

Java中ReentrantLock和synchronized都是可重入锁，可重入锁的一个优点是可一定程度避免死锁。

#### synchronized 和 ReentrantLock 区别

#### synchronized实现原理

synchronized是悲观锁，在操作同步资源之前需要给同步资源先加锁，这把锁就是存在Java对象头里。首先为什么Synchronized能实现线程同步？在回答这个问题之前我们需要了解两个重要的概念：“Java对象头”、“Monitor”。

- Java对象头
  
  > synchronized是悲观锁，在操作同步资源之前需要给同步资源先加锁，这把锁就是存在Java对象头里的，而Java对象头又是什么呢？
  > 
  > 我们以Hotspot虚拟机为例，Hotspot的对象头主要包括两部分数据：Mark Word（标记字段）、Klass Pointer（类型指针）。
  > 
  > **Mark Word**：默认存储对象的HashCode，分代年龄和锁标志位信息。这些信息都是与对象自身定义无关的数据，所以Mark Word被设计成一个非固定的数据结构以便在极小的空间内存存储尽量多的数据。它会根据对象的状态复用自己的存储空间，也就是说在运行期间Mark Word里存储的数据会随着锁标志位的变化而变化。
  > 
  > **Klass Point**：对象指向它的类元数据的指针，虚拟机通过这个指针来确定这个对象是哪个类的实例。
  > 
  > ![img](file:///Users/jerrylau/workspace/writting/whoiscat.com/knowledge/resume/images/16d4dc0bfb6ccc39~tplv-t2oaga2asx-watermark.awebp?lastModify=1637145977)

- Monitor
  
  > Monitor可以理解为一个同步工具或一种同步机制，通常被描述为一个对象。每一个Java对象就有一把看不见的锁，称为内部锁或者Monitor锁。
  > 
  > Monitor是线程私有的数据结构，每一个线程都有一个可用monitor record列表，同时还有一个全局的可用列表。每一个被锁住的对象都会和一个monitor关联，同时monitor中有一个Owner字段存放拥有该锁的线程的唯一标识，表示该锁被这个线程占用。
  > 
  > 现在话题回到synchronized，synchronized通过Monitor来实现线程同步，Monitor是依赖于底层的操作系统的Mutex Lock（互斥锁）来实现的线程同步。
  > 
  > 如同我们在自旋锁中提到的“阻塞或唤醒一个Java线程需要操作系统切换CPU状态来完成，这种状态转换需要耗费处理器时间。如果同步代码块中的内容过于简单，状态转换消耗的时间有可能比用户代码执行的时间还要长”。这种方式就是synchronized最初实现同步的方式，这就是JDK 6之前synchronized效率低的原因。这种依赖于操作系统Mutex Lock所实现的锁我们称之为“重量级锁”，JDK 6中为了减少获得锁和释放锁带来的性能消耗，引入了“偏向锁”和“轻量级锁”。

所以目前锁一共有4种状态，级别从低到高依次是：无锁、偏向锁、轻量级锁和重量级锁，**锁状态只能升级不能降级**。

通过上面的介绍，我们对synchronized的加锁机制以及相关知识有了一个了解，那么下面我们给出四种锁状态对应的的Mark Word内容，然后再分别讲解四种锁状态的思路以及特点：

| 锁状态  | 存储内容                          | 存储内容 |
|:---- |:----------------------------- |:---- |
| 无锁   | 对象的hashCode、对象分代年龄、是否是偏向锁（0）  | 01   |
| 偏向锁  | 偏向线程ID、偏向时间戳、对象分代年龄、是否是偏向锁（1） | 01   |
| 轻量级锁 | 指向栈中锁记录的指针                    | 00   |
| 重量级锁 | 指向互斥量（重量级锁）的指针                | 10   |

**无锁**

无锁没有对资源进行锁定，所有的线程都能访问并修改同一个资源，但同时只有一个线程能修改成功。

无锁的特点就是修改操作在循环内进行，线程会不断的尝试修改共享资源。如果没有冲突就修改成功并退出，否则就会继续循环尝试。如果有多个线程修改同一个值，必定会有一个线程能修改成功，而其他修改失败的线程会不断重试直到修改成功。上面我们介绍的CAS原理及应用即是无锁的实现。无锁无法全面代替有锁，但无锁在某些场合下的性能是非常高的。

**偏向锁**

偏向锁是指一段同步代码一直被一个线程所访问，那么该线程会自动获取锁，降低获取锁的代价。

在大多数情况下，锁总是由同一线程多次获得，不存在多线程竞争，所以出现了偏向锁。其目标就是在只有一个线程执行同步代码块时能够提高性能。

当一个线程访问同步代码块并获取锁时，会在Mark Word里存储锁偏向的线程ID。在线程进入和退出同步块时不再通过CAS操作来加锁和解锁，而是检测Mark Word里是否存储着指向当前线程的偏向锁。引入偏向锁是为了在无多线程竞争的情况下尽量减少不必要的轻量级锁执行路径，因为轻量级锁的获取及释放依赖多次CAS原子指令，而偏向锁只需要在置换ThreadID的时候依赖一次CAS原子指令即可。

偏向锁只有遇到其他线程尝试竞争偏向锁时，持有偏向锁的线程才会释放锁，线程不会主动释放偏向锁。偏向锁的撤销，需要等待全局安全点（在这个时间点上没有字节码正在执行），它会首先暂停拥有偏向锁的线程，判断锁对象是否处于被锁定状态。撤销偏向锁后恢复到无锁（标志位为“01”）或轻量级锁（标志位为“00”）的状态。

偏向锁在JDK 6及以后的JVM里是默认启用的。可以通过JVM参数关闭偏向锁：-XX:-UseBiasedLocking=false，关闭之后程序默认会进入轻量级锁状态。

**轻量级锁**

是指当锁是偏向锁的时候，被另外的线程所访问，偏向锁就会升级为轻量级锁，其他线程会通过自旋的形式尝试获取锁，不会阻塞，从而提高性能。

在代码进入同步块的时候，如果同步对象锁状态为无锁状态（锁标志位为“01”状态，是否为偏向锁为“0”），虚拟机首先将在当前线程的栈帧中建立一个名为锁记录（Lock Record）的空间，用于存储锁对象目前的Mark Word的拷贝，然后拷贝对象头中的Mark Word复制到锁记录中。

拷贝成功后，虚拟机将使用CAS操作尝试将对象的Mark Word更新为指向Lock Record的指针，并将Lock Record里的owner指针指向对象的Mark Word。

如果这个更新动作成功了，那么这个线程就拥有了该对象的锁，并且对象Mark Word的锁标志位设置为“00”，表示此对象处于轻量级锁定状态。

如果轻量级锁的更新操作失败了，虚拟机首先会检查对象的Mark Word是否指向当前线程的栈帧，如果是就说明当前线程已经拥有了这个对象的锁，那就可以直接进入同步块继续执行，否则说明多个线程竞争锁。

若当前只有一个等待线程，则该线程通过自旋进行等待。但是当自旋超过一定的次数，或者一个线程在持有锁，一个在自旋，又有第三个来访时，轻量级锁升级为重量级锁。

**重量级锁**

升级为重量级锁时，锁标志的状态值变为“10”，此时Mark Word中存储的是指向重量级锁的指针，此时等待锁的线程都会进入阻塞状态。

整体的锁状态升级流程如下：

![img](file:///Users/jerrylau/workspace/writting/whoiscat.com/knowledge/resume/images/8afdf6f2.jpg?lastModify=1637145977)

综上，偏向锁通过对比Mark Word解决加锁问题，避免执行CAS操作。而轻量级锁是通过用CAS操作和自旋来解决加锁问题，避免线程阻塞和唤醒而影响性能。重量级锁是将除了拥有锁的线程以外的线程都阻塞。

#### 公平锁与非公平锁

#### 类锁和对象锁的区别

- 使用对象锁（只有多个线程调用同一实例是才受影响）
  
  > 1. 锁住非静态变量
  > 2. 锁住this
  > 3. 锁非静态方法

- 使用类锁的方式（类锁是所有线程共享的锁，只能有一个线程使用加了锁的方法或方法体，不管是不是同一个实例）
  
  > 1. 锁住静态变量
  > 2. 在静态方法上加锁
  > 3. 锁住Foo.class

#### 死锁的四个条件，如何避免死锁？

两个或两个以上的进程在执行过程中，因争夺资源而造成的一种互相等待的现象，若无外力作用，它们都将无法推进下去。

- 产生死锁的四个必要条件
  
  > 1. 互斥条件： 资源是独占的且排他使用，线程互斥使用资源，即任意时刻一个资源只能给一个线程使用，其他线程若申请一个资源，而该资源被另一线程占有时，则申请者等待直到资源被占有者释放。
  > 2. 不可剥夺条件： 线程所获得的资源在未使用完毕之前，不被其他线程强行剥夺，而只能由获得该资源的线程资源释放。
  > 3. 请求和保持条件： 线程每次申请它所需要的资源，在申请新的资源的同时，继续占用已分配到的资源。
  > 4. 循环等待条件： 在发生死锁时必然存在一个线程等待队列{P1,P2,…,Pn},其中P1等待P2占有的资源，P2等待P3占有的资源，…，Pn等待P1占有的资源，形成一个线程等待环路，环路中每一个线程所占有的资源同时被另一个申请，也就是前一个线程占有后一个线程所申请的资源。

- 如何避免死锁
  
  > 1. 破坏4个必要条件中的一个或几个（控制好资源使用顺序）
  > 2. 进程启动拒绝：如果一个进程的请求会导致死锁，则不启动该进程。
  > 3. 资源分配拒绝：如果一个进程增加的资源请求会导致死锁，则不允许此分配(**银行家算法**)。
  > 4. 使用无锁编程

- 银行家算法

#### 死锁检测

遇到死锁问题的时候，我们很容易觉得莫名其妙，而且定位问题也很困难。一般发生死锁时，主要表现为相关线程不再工作，但是并没有抛出异常。死锁检测方法：

> 执行`jps`命令，找到发生死锁的进程
> 
> 执行`jstack -l 108` 108为发生死锁的进程，查看堆栈信息即可发现两个进程互相持有对方的资源，又互相需要对方的资源导致死锁。
> 
> 备注：jvisualvm/jconsole都可以监测死锁

#### 手写一个死锁

```java
 public class MustDeadLockDemo {
     public static void main(String[] args) {
         Object lock1 = new Object();
         Object lock2 = new Object();
         new Thread(new DeadLockTask(lock1, lock2, true), "线程1").start();
         new Thread(new DeadLockTask(lock1, lock2, false), "线程2").start();

     }
     static class DeadLockTask implements Runnable {
         private boolean flag;
         private Object lock1;
         private Object lock2;
         public DeadLockTask(Object lock1, Object lock2, boolean flag) {
             this.lock1 = lock1;
             this.lock2 = lock2;
             this.flag = flag;
         }
         @Override
         public void run() {
             if (flag) {
                 synchronized (lock1) {
                     System.out.println(Thread.currentThread().getName() + "->拿到锁1");
                     try {
                         Thread.sleep(1000);
                     } catch (InterruptedException e) {
                         e.printStackTrace();
                     }
                     System.out.println(Thread.currentThread().getName() + "->等待锁2释放...");
                     synchronized (lock2) { // lock2锁已被另一个线程获得
                         System.out.println(Thread.currentThread().getName() + "->拿到锁2");
                     }
                 }
             }
             if (!flag) {
                 synchronized (lock2) {
                     System.out.println(Thread.currentThread().getName() + "->拿到锁2");
                     try {
                         Thread.sleep(1000);
                     } catch (InterruptedException e) {
                         e.printStackTrace();
                     }
                     System.out.println(Thread.currentThread().getName() + "->等待锁1释放...");
                     synchronized (lock1) { // lock1锁已经被另一个线程获得，并且对方一直不释放
                         System.out.println(Thread.currentThread().getName() + "->拿到锁1");
                     }
                 }
             }
         }
     }
 }
```

#### Semaphore

#### CountDownLatch

#### ReadWriteLock

#### ReentrantLock和Condition

#### LockSupport

`LockSupport`是一个线程阻塞工具类，所有的方法都是静态方法，可以让线程在任意位置阻塞，当然阻塞之后肯定得有唤醒的方法。

```
 public static void park(Object blocker); // 暂停当前线程
 public static void parkNanos(Object blocker, long nanos); // 暂停当前线程，不过有超时时间的限制
 public static void parkUntil(Object blocker, long deadline); // 暂停当前线程，直到某个时间
 public static void park(); // 无期限暂停当前线程
 public static void parkNanos(long nanos); // 暂停当前线程，不过有超时时间的限制
 public static void parkUntil(long deadline); // 暂停当前线程，直到某个时间
 public static void unpark(Thread thread); // 恢复当前线程
 public static Object getBlocker(Thread t);
```

原理介绍：https://juejin.cn/post/6844903729380982797

#### 什么是对象锁，如何使用

### 进程

### 多线程

#### 进程和线程之间有什么区别

Both processes and threads are units of concurrency, but they have a fundamental difference: processes do not share a common memory, while threads do.

From the operating system's point of view, a process is an independent piece of software that runs in its own virtual memory space. Any multitasking operating system (which means almost any modern operating system) has to separate processes in memory so that one failing process wouldn't drag all other processes down by scrambling common memory.

The processes are thus usually isolated, and they cooperate by the means of inter-process communication which is defined by the operating system as a kind of intermediate API.

On the contrary, a thread is a part of an application that shares a common memory with other threads of the same application. Using common memory allows to shave off lots of overhead, design the threads to cooperate and exchange data between them much faster.

#### 什么是死锁？产生死锁的条件是什么？

#### 如何创建一个线程并运行它

To create an instance of a thread, you have two options. First, pass a *Runnable* instance to its constructor and call *start()*. *Runnable* is a functional interface, so it can be passed as a lambda expression:

```
 Thread thread1 = new Thread(() ->
   System.out.println("Hello World from Runnable!"));
 thread1.start();
```

Thread also implements *Runnable*, so another way of starting a thread is to create an anonymous subclass, override its *run()* method, and then call *start()*:

```
 Thread thread2 = new Thread() {
     @Override
     public void run() {
         System.out.println("Hello World from subclass!");
     }
 };
 thread2.start();
```

#### 介绍一下线程的状态，以及状态在什么时候会发生变化

The state of a *Thread* can be checked using the *Thread.getState()* method. Different states of a *Thread* are described in the *Thread.State* enum. They are:

- ***NEW\*** — a new *Thread* instance that was not yet started via *Thread.start()*
- ***RUNNABLE\*** — a running thread. It is called runnable because at any given time it could be either running or waiting for the next quantum of time from the thread scheduler. A *NEW* thread enters the *RUNNABLE* state when you call *Thread.start()* on it
- ***BLOCKED\*** — a running thread becomes blocked if it needs to enter a synchronized section but cannot do that due to another thread holding the monitor of this section
- ***WAITING\*** — a thread enters this state if it waits for another thread to perform a particular action. For instance, a thread enters this state upon calling the *Object.wait()* method on a monitor it holds, or the *Thread.join()* method on another thread
- ***TIMED_WAITING\*** — same as the above, but a thread enters this state after calling timed versions of *Thread.sleep()*, *Object.wait()*, *Thread.join()* and some other methods
- ***TERMINATED\*** — a thread has completed the execution of its *Runnable.run()* method and terminated

#### Callable和Runable接口有什么区别，如何使用

The *Runnable* interface has a single *run* method. It represents a unit of computation that has to be run in a separate thread. The *Runnable* interface does not allow this method to return value or to throw unchecked exceptions.

The *Callable* interface has a single *call* method and represents a task that has a value. That's why the *call* method returns a value. It can also throw exceptions. *Callable* is generally used in *ExecutorService* instances to start an asynchronous task and then call the returned *Future* instance to get its value.

#### 什么是守护线程，如何创建守护线程

A daemon thread is a thread that does not prevent JVM from exiting. When all non-daemon threads are terminated, the JVM simply abandons all remaining daemon threads. Daemon threads are usually used to carry out some supportive or service tasks for other threads, but you should take into account that they may be abandoned at any time.

To start a thread as a daemon, you should use the *setDaemon()* method before calling *start()*:

```
 Thread daemon = new Thread(()
   -System.out.println("Hello from daemon!"));
 daemon.setDaemon(true);
 daemon.start();
```

Curiously, if you run this as a part of the *main()* method, the message might not get printed. This could happen if the *main()* thread would terminate before the daemon would get to the point of printing the message. You generally should not do any I/O in daemon threads, as they won't even be able to execute their *finally* blocks and close the resources if abandoned.

#### 什么是线程中断标志，它与InterruptException有何关联

The interrupt flag, or interrupt status, is an internal *Thread* flag that is set when the thread is interrupted. To set it, simply call *thread.interrupt()* on the thread object*.*

If a thread is currently inside one of the methods that throw *InterruptedException* (*wait*, *join*, *sleep* etc.), then this method immediately throws InterruptedException. The thread is free to process this exception according to its own logic.

If a thread is not inside such method and *thread.interrupt()* is called, nothing special happens. It is thread's responsibility to periodically check the interrupt status using *static Thread.interrupted()* or instance *isInterrupted()* method. The difference between these methods is that the *static Thread.interrupted()* clears the interrupt flag, while *isInterrupted()* does not.

#### Executor和ExecutorService这两个接口有什么区别？

*Executor* and *ExecutorService* are two related interfaces of *java.util.concurrent* framework. *Executor* is a very simple interface with a single *execute* method accepting *Runnable* instances for execution. In most cases, this is the interface that your task-executing code should depend on.

*ExecutorService* extends the *Executor* interface with multiple methods for handling and checking the lifecycle of a concurrent task execution service (termination of tasks in case of shutdown) and methods for more complex asynchronous task handling including *Futures*.

#### ExecutorService在标准库中有哪些实现

The *ExecutorService* interface has three standard implementations:

- ***ThreadPoolExecutor\*** — for executing tasks using a pool of threads. Once a thread is finished executing the task, it goes back into the pool. If all threads in the pool are busy, then the task has to wait for its turn.
- ***ScheduledThreadPoolExecutor\*** allows to schedule task execution instead of running it immediately when a thread is available. It can also schedule tasks with fixed rate or fixed delay.
- ***ForkJoinPool\*** is a special *ExecutorService* for dealing with recursive algorithms tasks. If you use a regular *ThreadPoolExecutor* for a recursive algorithm, you will quickly find all your threads are busy waiting for the lower levels of recursion to finish. The *ForkJoinPool* implements the so-called work-stealing algorithm that allows it to use available threads more efficiently.

#### 什么是JMM，说一下他的用途

Java Memory Model is a part of Java language specification described in [Chapter 17.4](https://docs.oracle.com/javase/specs/jls/se8/html/jls-17.html#jls-17.4). It specifies how multiple threads access common memory in a concurrent Java application, and how data changes by one thread are made visible to other threads. While being quite short and concise, JMM may be hard to grasp without strong mathematical background.

The need for memory model arises from the fact that the way your Java code is accessing data is not how it actually happens on the lower levels. Memory writes and reads may be reordered or optimized by the Java compiler, JIT compiler, and even CPU, as long as the observable result of these reads and writes is the same.

This can lead to counter-intuitive results when your application is scaled to multiple threads because most of these optimizations take into account a single thread of execution (the cross-thread optimizers are still extremely hard to implement). Another huge problem is that the memory in modern systems is multilayered: multiple cores of a processor may keep some non-flushed data in their caches or read/write buffers, which also affects the state of the memory observed from other cores.

To make things worse, the existence of different memory access architectures would break the Java's promise of “write once, run everywhere”. Happily for the programmers, the JMM specifies some guarantees that you may rely upon when designing multithreaded applications. Sticking to these guarantees helps a programmer to write multithreaded code that is stable and portable between various architectures.

The main notions of JMM are:

- **Actions**, these are inter-thread actions that can be executed by one thread and detected by another thread, like reading or writing variables, locking/unlocking monitors and so on
- **Synchronization actions**, a certain subset of actions, like reading/writing a *volatile* variable, or locking/unlocking a monitor
- **Program Order** (PO), the observable total order of actions inside a single thread
- **Synchronization Order** (SO), the total order between all synchronization actions — it has to be consistent with Program Order, that is, if two synchronization actions come one before another in PO, they occur in the same order in SO
- **synchronizes-with** (SW) relation between certain synchronization actions, like unlocking of monitor and locking of the same monitor (in another or the same thread)
- **Happens-before Order** — combines PO with SW (this is called *transitive closure* in set theory) to create a partial ordering of all actions between threads. If one action *happens-before* another, then the results of the first action are observable by the second action (for instance, write of a variable in one thread and read in another)
- **Happens-before consistency** — a set of actions is HB-consistent if every read observes either the last write to that location in the happens-before order, or some other write via data race
- **Execution** — a certain set of ordered actions and consistency rules between them

For a given program, we can observe multiple different executions with various outcomes. But if a program is **correctly synchronized**, then all of its executions appear to be **sequentially consistent**, meaning you can reason about the multithreaded program as a set of actions occurring in some sequential order. This saves you the trouble of thinking about under-the-hood reorderings, optimizations or data caching.

#### 什么是volatile关键字，JMM如何确保它的作用

A *volatile* field has special properties according to the Java Memory Model (see Q9). The reads and writes of a *volatile* variable are synchronization actions, meaning that they have a total ordering (all threads will observe a consistent order of these actions). A read of a volatile variable is guaranteed to observe the last write to this variable, according to this order.

If you have a field that is accessed from multiple threads, with at least one thread writing to it, then you should consider making it *volatile*, or else there is a little guarantee to what a certain thread would read from this field.

Another guarantee for *volatile* is atomicity of writing and reading 64-bit values (*long* and *double*). Without a volatile modifier, a read of such field could observe a value partly written by another thread.

#### 下列哪些是原子操作

- writing to a non-*volatile* *int*;
- writing to a *volatile int*;
- writing to a non-*volatile long*;
- writing to a *volatile long*;
- incrementing a *volatile long*?

A write to an *int* (32-bit) variable is guaranteed to be atomic, whether it is *volatile* or not. A *long* (64-bit) variable could be written in two separate steps, for example, on 32-bit architectures, so by default, there is no atomicity guarantee. However, if you specify the *volatile* modifier, a *long* variable is guaranteed to be accessed atomically.

The increment operation is usually done in multiple steps (retrieving a value, changing it and writing back), so it is never guaranteed to be atomic, wether the variable is *volatile* or not. If you need to implement atomic increment of a value, you should use classes *AtomicInteger*, *AtomicLong* etc.

#### What Special Guarantees Does the Jmm Hold for Final Fields of a Class?

  JVM basically guarantees that *final* fields of a class will be initialized before any thread gets hold of the object. Without this guarantee, a reference to an object may be published, i.e. become visible, to another thread before all the fields of this object are initialized, due to reorderings or other optimizations. This could cause racy access to these fields.

  This is why, when creating an immutable object, you should always make all its fields *final*, even if they are not accessible via getter methods.

#### What Is the Meaning of a Synchronized Keyword in the Definition of a Method? of a Static Method? Before a Block?

  The *synchronized* keyword before a block means that any thread entering this block has to acquire the monitor (the object in brackets). If the monitor is already acquired by another thread, the former thread will enter the *BLOCKED* state and wait until the monitor is released.

```
 synchronized(object) {
     // ...
 }
```

  A *synchronized* instance method has the same semantics, but the instance itself acts as a monitor.

```
 synchronized void instanceMethod() {
     // ...
 }
```

  For a *static synchronized* method, the monitor is the *Class* object representing the declaring class.

```
static synchronized void staticMethod() {
    // ...
}
```

#### If Two Threads Call a Synchronized Method on Different Object Instances Simultaneously, Could One of These Threads Block? What If the Method Is Static?

  If the method is an instance method, then the instance acts as a monitor for the method. Two threads calling the method on different instances acquire different monitors, so none of them gets blocked.

  If the method is *static*, then the monitor is the *Class* object. For both threads, the monitor is the same, so one of them will probably block and wait for another to exit the *synchronized* method.

#### What Is the Purpose of the Wait, Notify and Notifyall Methods of the Object Class?**

  A thread that owns the object's monitor (for instance, a thread that has entered a *synchronized* section guarded by the object) may call *object.wait()* to temporarily release the monitor and give other threads a chance to acquire the monitor. This may be done, for instance, to wait for a certain condition.

  When another thread that acquired the monitor fulfills the condition, it may call *object.notify()* or *object.notifyAll()* and release the monitor. The *notify* method awakes a single thread in the waiting state, and the *notifyAll* method awakes all threads that wait for this monitor, and they all compete for re-acquiring the lock.

  The following *BlockingQueue* implementation shows how multiple threads work together via the *wait-notify* pattern. If we *put* an element into an empty queue, all threads that were waiting in the *take* method wake up and try to receive the value. If we *put* an element into a full queue, the *put* method *wait*s for the call to the *get* method. The *get* method removes an element and notifies the threads waiting in the *put* method that the queue has an empty place for a new item.

```java
 public class BlockingQueue<T{

     private List<Tqueue = new LinkedList<T>();

     private int limit = 10;

     public synchronized void put(T item) {
         while (queue.size() == limit) {
             try {
                 wait();
             } catch (InterruptedException e) {}
         }
         if (queue.isEmpty()) {
             notifyAll();
         }
         queue.add(item);
     }

     public synchronized T take() throws InterruptedException {
         while (queue.isEmpty()) {
             try {
                 wait();
             } catch (InterruptedException e) {}
         }
         if (queue.size() == limit) {
             notifyAll();
         }
         return queue.remove(0);
     }

 }
```

#### Describe the Conditions of Deadlock, Livelock, and Starvation. Describe the Possible Causes of These Conditions.**

  **Deadlock** is a condition within a group of threads that cannot make progress because every thread in the group has to acquire some resource that is already acquired by another thread in the group. The most simple case is when two threads need to lock both of two resources to progress, the first resource is already locked by one thread, and the second by another. These threads will never acquire a lock to both resources and thus will never progress.

  **Livelock** is a case of multiple threads reacting to conditions, or events, generated by themselves. An event occurs in one thread and has to be processed by another thread. During this processing, a new event occurs which has to be processed in the first thread, and so on. Such threads are alive and not blocked, but still, do not make any progress because they overwhelm each other with useless work.

  **Starvation** is a case of a thread unable to acquire resource because other thread (or threads) occupy it for too long or have higher priority. A thread cannot make progress and thus is unable to fulfill useful work.

#### Describe the Purpose and Use-Cases of the Fork/Join Framework.

  The fork/join framework allows parallelizing recursive algorithms. The main problem with parallelizing recursion using something like *ThreadPoolExecutor* is that you may quickly run out of threads because each recursive step would require its own thread, while the threads up the stack would be idle and waiting.

  The fork/join framework entry point is the *ForkJoinPool* class which is an implementation of *ExecutorService*. It implements the work-stealing algorithm, where idle threads try to “steal” work from busy threads. This allows to spread the calculations between different threads and make progress while using fewer threads than it would require with a usual thread pool.

  More information and code samples for the fork/join framework may be found in the article [“Guide to the Fork/Join Framework in Java”](https://www.baeldung.com/java-fork-join).

#### 有没有一种一定能保证线程安全的代码写法？

#### 多个线程如何保持A1B2C3等顺序交替输出？

- 方法1：LockSupport
  
  ```
   public class ThreadUtils {
     static Thread t3 = null;
     static Thread t4 = null;
     public static void main(String[] args) {
       t3 = new Thread() {
         public void run() {
   //        for(int i=97;i<123;i++) {//小写字母
           for (int i = 65; i < 91; i++) {
             System.out.print((char) i);
             LockSupport.unpark(t4);//唤醒t4
             LockSupport.park();//阻塞自己
           }
         }
       };
       t4 = new Thread() {
         public void run() {
           for (int i = 1; i < 27; i++) {
             LockSupport.park();
             System.out.print(i);
             LockSupport.unpark(t3);
           }
         }
       };
        t3.start();
        t4.start();
     }
   }
  ```

- 方法2：对象锁
  
  ```java
   public class ThreadUtils {
     static Thread t1 = null;
     static Thread t2 = null;
     public static void main(String[] args) {
       Object o = new Object();
       t1 = new Thread() {
         public void run() {
           synchronized (o) {
   //          for(int i=97;i<123;i++) {//小写字母
             for (int i = 65; i < 91; i++) {
               System.out.print((char) i);
               try {
                 o.notify();//叫醒t2
                 o.wait();//阻塞自己
               } catch (InterruptedException e) {
                 e.printStackTrace();
               }
             }
             //需要注意，如果不写，会出现一个线程一直阻塞在wait()操作而无法结束，出现输出完成而程序无法结束
             o.notify();
           }
         }
       };
       t2 = new Thread() {
         public void run() {
           synchronized (o) {
             for (int i = 1; i < 27; i++) {
               System.out.print(i + " ");
               try {
                 o.notify();//叫醒t1
                 o.wait();//阻塞自己
               } catch (InterruptedException e) {
                 // TODO Auto-generated catch block
                 e.printStackTrace();
               }
             }
             o.notify();
           }
         }
       };
       t1.start();
       t2.start();
     }
   }
  ```

#### synchronized volatile的CPU原语是如何实现的？

#### 无锁、偏向锁、轻量级锁、重量级锁有什么差别？

#### 如何正确的启动和停止一个线程？

#### 线程和纤程的区别的是什么？为什么纤程比较轻量级？

#### ThreadLocal有没有内存泄漏的问题？为什么？

#### 下列三种业务，应该如何使用线程池

A高并发、任务执行时间短/B并发不高、任务执行时间长/C并发高、业务执行时间长

#### 线程池遇到异常会发生什么，怎么处理？

#### 如何用jstack定位性能问题

https://sq.sf.163.com/blog/article/200006580885712896

#### i++ 是线程安全的吗？

每个线程都有自己的工作内存，每个线程需要对共享变量操作时必须先把共享变量从主内存 load 到自己的工作内存，等完成对共享变量的操作时再 save 到主内存。

问题就出在这了，如果一个线程运算完后还没刷到主内存，此时这个共享变量的值被另外一个线程从主内存读取到了，这个时候读取的数据就是脏数据了，它会覆盖其他线程计算完的值。

**这也是经典的内存不可见问题，那么把 count 加上 volatile 让内存可见是否能解决这个问题呢？** 答案是：不能。因为 volatile 只能保证可见性，不能保证原子性。多个线程同时读取这个共享变量的值，就算保证其他线程修改的可见性，也不能保证线程之间读取到同样的值然后相互覆盖对方的值的情况。

解决方案：

1、对 i++ 操作的方法加同步锁，同时只能有一个线程执行 i++ 操作；

2、使用支持原子性操作的类，如 `java.util.concurrent.atomic.AtomicInteger`，它使用的是 CAS 算法，效率优于第 1 种；

## 开发框架

### Netty

#### BIO、NIO 和 AIO 的区别？

BIO：一个连接一个线程，客户端有连接请求时服务器端就需要启动一个线程进行处理。线程 开销大。 伪异步 IO：将请求连接放入线程池，一对多，但线程还是很宝贵的资源。 

NIO：一个请求一个线程，但客户端发送的连接请求都会注册到多路复用器上，多路复用器轮询到连接有 I/O 请求时才启动一个线程进行处理。 AIO：一个有效请求一个线程，客户端的 I/O 请求都是由 OS 先完成了再通知服务器应用去启动线程进行处理， BIO是面向流的，NIO 是面向缓冲区的；BIO 的各种流是阻塞的。而NIO是非阻塞的;BIO的 Stream 是单向的，而NIO的channel 是双向的。 NIO 的特点：事件驱动模型、单线程处理多任务、非阻塞 I/O， I/O 读写不再阻塞，而是返回 0、基于 block 的传输比基于流的传输更高效、更高级的 IO 函数 zero-copy、 IO 多路复用大大提高了 Java 网络应用的可伸缩性和实用性。基于 Reactor 线程模型。 在 Reactor 模式中，事件分发器等待某个事件或者可应用或个操作的状态发生，事件分发器就把这个事件传给事先注册的事件处理函数或者回调函数，由后者来做实际的读写操作。如在 Reactor 中实现读：注册读就绪事件和相应的事件处理器、事件分发器等待事件、事件到来，激活分发器，分发器调用事件对应的处理器、事件处理器完成实际的读操作，处理读到的数据，注册新的事件，然后返还控制权。

#### NIO 的组成？

Buffer：与 Channel 进行交互，数据是从 Channel 读入缓冲区，从缓冲区写入 Channel 中的 flip 方法 ： 反转此缓冲区，将 position 给 limit，然后将 position 置为 0，其实就是切换读写模式 clear 方法 ：清除此缓冲区，将 position 置为 0，把 capacity 的值给 limit。 rewind 方法 ： 重绕此缓冲区，将 position 置为0,DirectByteBuffer 可减少一次系统空间到用户空间的拷贝。但 Buffer 创建和销毁的成本更高，不可控，通常会用内存池来提高性能。直接缓冲区主要分配给那些易受基础系统的本机 I/O 操作影响的大型、持久的缓冲区。如果数据量比较小的中小应用情况下，可以考虑使用 heapBuffer，由 JVM 进行管理。 Channel：表示 IO 源与目标打开的连接，是双向的，但不能直接访问数据，只能与 Buffer进行交互。通过源码可知， FileChannel 的 read 方法和 write 方法都导致数据复制了两次！ Selector 可使一个单独的线程管理多个 Channel， open 方法可创建 Selector， register 方法向多路复用器器注册通道，可以监听的事件类型：读、写、连接、 accept。注册事件后会产生一个 SelectionKey：它表示 SelectableChannel 和 Selector 之间的注册关系， wakeup 方 法：使尚未返回的第一个选择操作立即返回，唤醒的原因是：注册了新的 channel 或者事件； channel 关闭，取消注册；优先级更高的事件触发（如定时器事件），希望及时处理。 Selector 在 Linux 的实现类是 EPollSelectorImpl，委托给 EPollArrayWrapper 实现，其中三个native 方法是对 epoll 的封装，而 EPollSelectorImpl. implRegister 方法，通过调用 epoll_ctl向 epoll 实例中注册事件，还将注册的文件描述符(fd)与 SelectionKey 的对应关系添加到fdToKey 中，这个 map 维护了文件描述符与 SelectionKey 的映射。 fdToKey 有时会变得非常大，因为注册到 Selector 上的 Channel 非常多（百万连接）；过期或失效的 Channel 没有及时关闭。 fdToKey 总是串行读取的，而读取是在 select 方法中进行的，该方法是非线程安全的。 Pipe：两个线程之间的单向数据连接，数据会被写到 sink 通道，从 source 通道读取 NIO 的服务端建立过程： Selector.open()：打开一个 Selector； ServerSocketChannel.open()：创建服务端的 Channel； bind()：绑定到某个端口上。并配置非阻塞模式； register()：注册Channel 和关注的事件到 Selector 上； select()轮询拿到已经就绪的事件

#### Netty 的特点？

一个高性能、异步事件驱动的 NIO 框架，它提供了对 TCP、 UDP 和文件传输的支持使用更高效的 socket 底层，对 epoll 空轮询引起的 cpu 占用飙升在内部进行了处理，避免了直接使用 NIO 的陷阱，简化了 NIO 的处理方式。采用多种 decoder/encoder 支持，对 TCP 粘包/分包进行自动化处理 可使用接受/处理线程池，提高连接效率，对重连、心跳检测的简单支持可配置 IO 线程数、 TCP 参数， TCP 接收和发送缓冲区使用直接内存代替堆内存，通过内存池的方式循环利用 ByteBuf通过引用计数器及时申请释放不再引用的对象，降低了 GC 频率使用单线程串行化的方式，高效的 Reactor 线程模型大量使用了 volitale、使用了 CAS 和原子类、线程安全类的使用、读写锁的使用

#### Netty 的线程模型？

Netty 通过 Reactor 模型基于多路复用器接收并处理用户请求，内部实现了两个线程池，boss 线程池和 work 线程池，其中 boss 线程池的线程负责处理请求的 accept 事件，当接收到 accept 事件的请求时，把对应的 socket 封装到一个 NioSocketChannel 中，并交给 work线程池，其中 work 线程池负责请求的 read 和 write 事件，由对应的 Handler 处理。 单线程模型：所有 I/O 操作都由一个线程完成，即多路复用、事件分发和处理都是在一个Reactor 线程上完成的。既要接收客户端的连接请求,向服务端发起连接，又要发送/读取请求或应答/响应消息。一个 NIO 线程同时处理成百上千的链路，性能上无法支撑，速度慢，若线程进入死循环，整个程序不可用，对于高负载、大并发的应用场景不合适。 多线程模型：有一个 NIO 线程（ Acceptor） 只负责监听服务端，接收客户端的 TCP 连接请求； NIO 线程池负责网络 IO 的操作，即消息的读取、解码、编码和发送； 1 个 NIO 线程可以同时处理 N 条链路，但是 1 个链路只对应 1 个 NIO 线程，这是为了防止发生并发操作问题。但在并发百万客户端连接或需要安全认证时，一个 Acceptor 线程可能会存在性能不足问题。 主从多线程模型： Acceptor 线程用于绑定监听端口，接收客户端连接，将 SocketChannel从主线程池的 Reactor 线程的多路复用器上移除，重新注册到 Sub 线程池的线程上，用于处理 I/O 的读写等操作，从而保证 mainReactor 只负责接入认证、握手等操作；

#### TCP 粘包/拆包的原因及解决方法？

TCP 是以流的方式来处理数据，一个完整的包可能会被 TCP 拆分成多个包进行发送，也可能把小的封装成一个大的数据包发送。 TCP 粘包/分包的原因： 应用程序写入的字节大小大于套接字发送缓冲区的大小，会发生拆包现象，而应用程序写入数据小于套接字缓冲区大小，网卡将应用多次写入的数据发送到网络上，这将会发生粘包现象； 进行 MSS 大小的 TCP 分段，当 TCP 报文长度-TCP 头部长度>MSS 的时候将发生拆包以太网帧的 payload（净荷）大于 MTU（ 1500 字节）进行 ip 分片。 解决方法 消息定长： FixedLengthFrameDecoder 类包尾增加特殊字符分割：行分隔符类： LineBasedFrameDecoder 或自定义分隔符类 ： DelimiterBasedFrameDecoder将消息分为消息头和消息体： LengthFieldBasedFrameDecoder 类。分为有头部的拆包与粘包、长度字段在前且有头部的拆包与粘包、多扩展头部的拆包与粘包。

#### 了解哪几种序列化协议？

序列化（编码）是将对象序列化为二进制形式（字节数组），主要用于网络传输、数据持久化等；而反序列化（解码）则是将从网络、磁盘等读取的字节数组还原成原始对象，主要用于网络传输对象的解码，以便完成远程调用。 影响序列化性能的关键因素：序列化后的码流大小（网络带宽的占用）、序列化的性能（ CPU 资源占用）；是否支持跨语言（异构系统的对接和开发语言切换）。 Java 默认提供的序列化：无法跨语言、序列化后的码流太大、序列化的性能差XML， 优点：人机可读性好，可指定元素或特性的名称。 缺点：序列化数据只包含数据本身以及类的结构，不包括类型标识和程序集信息；只能序列化公共属性和字段；不能序列化方法；文件庞大，文件格式复杂，传输占带宽。 适用场景：当做配置文件存储数据，实时数据转换。

JSON，是一种轻量级的数据交换格式 优点：兼容性高、数据格式比较简单，易于读写、序列化后数据较小，可扩展性好，兼容性好、与 XML 相比，其协议比较简单，解析速度比较快。 缺点：数据的描述性比 XML 差、不适合性能要求为 ms 级别的情况、额外空间开销比较大。 适用场景（可替代ＸＭＬ）：跨防火墙访问、可调式性要求高、基于 Webbrowser 的 Ajax 请求、传输数据量相对小，实时性要求相对低（例如秒级别）的服务。***

Fastjson，采用一种“假定有序快速匹配”的算法。 优点：接口简单易用、目前 java 语言中最快的 json 库。 缺点：过于注重快，而偏离了“标准”及功能性、代码质量不高，文档不全。 适用场景：协议交互、 Web 输出、 Android 客户端

Thrift，不仅是序列化协议，还是一个 RPC 框架。 优点：序列化后的体积小, 速度快、支持多种语言和丰富的数据类型、对于数据字段的增删具有较强的兼容性、支持二进制压缩编码。 缺点：使用者较少、跨防火墙访问时，不安全、不具有可读性，调试代码时相对困难、不能与其他传输层协议共同使用（例如 HTTP）、无法支持向持久层直接读写数据，即不适合做数据持久化序列化协议。 适用场景：分布式系统的 RPC 解决方案

Avro， Hadoop 的一个子项目，解决了 JSON 的冗长和没有 IDL 的问题。 优点：支持丰富的数据类型、简单的动态语言结合功能、具有自我描述属性、提高了数据解析速度、快速可压缩的二进制数据形式、可以实现远程过程调用 RPC、支持跨编程语言实现。 缺点：对于习惯于静态类型语言的用户不直观。 适用场景：在 Hadoop 中做 Hive、 Pig 和 MapReduce的持久化数据格式。

Protobuf，将数据结构以.proto 文件进行描述，通过代码生成工具可以生成对应数据结构的POJO 对象和 Protobuf 相关的方法和属性。 优点：序列化后码流小，性能高、结构化数据存储格式（ XML JSON 等）、通过标识字段的顺序，可以实现协议的前向兼容、结构化的文档更容易管理和维护。 缺点：需要依赖于工具生成代码、支持的语言相对较少，官方只支持Java 、 C++ 、 python。 适用场景：对性能要求高的 RPC 调用、具有良好的跨防火墙的访问属性、适合应用层对象的持久化

其它 protostuff 基于 protobuf 协议，但不需要配置 proto 文件，直接导包即可 Jboss marshaling 可以直接序列化 java 类， 无须实java.io.Serializable 接口 Message pack 一个高效的二进制序列化格式 Hessian 采用二进制协议的轻量级 remoting onhttp 工具 kryo 基于 protobuf 协议，只支持 java 语言,需要注册（ Registration），然后序列化（ Output），反序列化（ Input）

#### 如何选择序列化协议？

具体场景 对于公司间的系统调用，如果性能要求在 100ms 以上的服务，基于 XML 的 SOAP 协议是一个值得考虑的方案。 基于 Web browser 的 Ajax，以及 Mobile app 与服务端之间的通讯， JSON 协议是首选。对于性能要求不太高，或者以动态类型语言为主，或者传输数据载荷很小的的运用场景， JSON也是非常不错的选择。 对于调试环境比较恶劣的场景，采用 JSON 或 XML 能够极大的提高调试效率，降低系统开发成本。 当对性能和简洁性有极高要求的场景， Protobuf， Thrift， Avro 之间具有一定的竞争关系。 对于 T 级别的数据的持久化应用场景， Protobuf 和 Avro 是首要选择。如果持久化后的数据存储在 hadoop 子项目里， Avro 会是更好的选择。 对于持久层非 Hadoop 项目，以静态类型语言为主的应用场景， Protobuf 会更符合静态类型语言工程师的开发习惯。 由于 Avro 的设计理念偏向于动态类型语言，对于动态语言为主的应用场景， Avro 是更好的选择。 如果需要提供一个完整的 RPC 解决方案， Thrift 是一个好的选择。 如果序列化之后需要支持不同的传输层协议，或者需要跨防火墙访问的高性能场景，Protobuf 可以优先考虑。 protobuf 的数据类型有多种： bool、 double、 float、 int32、 int64、 string、 bytes、 enum、message。 protobuf 的限定符： required: 必须赋值，不能为空、 optional:字段可以赋值，也可以不赋值、 repeated: 该字段可以重复任意次数（包括 0 次）、枚举；只能用指定的常量集中的一个值作为其值； protobuf 的基本规则：每个消息中必须至少留有一个 required 类型的字段、包含 0 个或多个 optional 类型的字段； repeated 表示的字段可以包含 0 个或多个数据； [1,15]之内的标识号在编码的时候会占用一个字节（常用）， [16,2047]之内的标识号则占用 2 个字节，标识号一定不能重复、使用消息类型，也可以将消息嵌套任意多层，可用嵌套消息类型来代替组。 protobuf 的消息升级原则：不要更改任何已有的字段的数值标识；不能移除已经存在的required 字段， optional 和 repeated 类型的字段可以被移除，但要保留标号不能被重用。新添加的字段必须是 optional 或 repeated。因为旧版本程序无法读取或写入新增的 required 限定符的字段。编译器为每一个消息类型生成了一个.java 文件，以及一个特殊的 Builder 类（该类是用来创建消息类接口的）。如：UserProto.User.Builder builder =UserProto.User.newBuilder();builder.build()；Netty 中的使用： ProtobufVarint32FrameDecoder 是用于处理半包消息的解码类； ProtobufDecoder(UserProto.User.getDefaultInstance())这是创建的 UserProto.java 文件中的解码类； ProtobufVarint32LengthFieldPrepender 对 protobuf 协议的消息头上加上一个长度为32 的整形字段，用于标志这个消息的长度的类； ProtobufEncoder 是编码类将 StringBuilder 转换为 ByteBuf 类型： copiedBuffer()方法

#### Netty 的零拷贝实现？

Netty 的接收和发送 ByteBuffer 采用 DIRECT BUFFERS，使用堆外直接内存进行 Socket 读写，不需要进行字节缓冲区的二次拷贝。堆内存多了一次内存拷贝， JVM 会将堆内存Buffer 拷贝一份到直接内存中，然后才写入 Socket 中。 ByteBuffer 由 ChannelConfig 分配，而 ChannelConfig 创建 ByteBufAllocator 默认使用 Direct BufferCompositeByteBuf 类可以将多个 ByteBuf 合并为一个逻辑上的 ByteBuf, 避免了传统通过内存拷贝的方式将几个小 Buffer 合并成一个大的 Buffer。 addComponents 方法将 header与 body 合并为一个逻辑上的 ByteBuf, 这两个 ByteBuf 在 CompositeByteBuf 内部都是单独存在的, CompositeByteBuf 只是逻辑上是一个整体通过 FileRegion 包装的 FileChannel.tranferTo 方法 实现文件传输, 可以直接将文件缓冲区的数据发送到目标 Channel，避免了传统通过循环 write 方式导致的内存拷贝问题。通过 wrap 方法, 我们可以将 byte[] 数组、 ByteBuf、 ByteBuffer 等包装成一个 NettyByteBuf 对象, 进而避免了拷贝操作。Selector BUG：若 Selector 的轮询结果为空，也没有 wakeup 或新消息处理，则发生空轮询， CPU 使用率 100%； Netty 的解决办法：对 Selector 的 select 操作周期进行统计，每完成一次空的 select 操作进行一次计数，若在某个周期内连续发生 N 次空轮询，则触发了 epoll 死循环 bug。重建Selector，判断是否是其他线程发起的重建请求，若不是则将原 SocketChannel 从旧的Selector 上去除注册，重新注册到新的 Selector 上，并将原来的 Selector 关闭。

#### Netty 的高性能表现在哪些方面？

心跳，对服务端：会定时清除闲置会话 inactive(netty5)，对客户端:用来检测会话是否断开，是否重来，检测网络延迟，其中 idleStateHandler 类 用来检测会话状态 串行无锁化设计，即消息的处理尽可能在同一个线程内完成，期间不进行线程切换，这样就避免了多线程竞争和同步锁。表面上看，串行化设计似乎 CPU 利用率不高，并发程度不够。但是，通过调整 NIO 线程池的线程参数，可以同时启动多个串行化的线程并行运行，这种局部无锁化的串行线程设计相比一个队列-多个工作线程模型性能更优。 可靠性，链路有效性检测：链路空闲检测机制，读/写空闲超时机制；内存保护机制：通过内存池重用 ByteBuf;ByteBuf 的解码保护；优雅停机：不再接收新消息、退出前的预处理操作、资源的释放操作。 Netty 安全性：支持的安全协议： SSL V2 和 V3， TLS， SSL 单向认证、双向认证和第三方 CA认证。 高效并发编程的体现： volatile 的大量、正确使用； CAS 和原子类的广泛使用；线程安全容器的使用；通过读写锁提升并发性能。 IO 通信性能三原则：传输（ AIO）、协议（ Http）、线程（主从多线程） 流量整型的作用（变压器）：防止由于上下游网元性能不均衡导致下游网元被压垮，业务流中断；防止由于通信模块接受消息过快，后端业务线程处理不及时导致撑死问题。 TCP 参数配置： SO_RCVBUF 和 SO_SNDBUF：通常建议值为 128K 或者 256K； SO_TCPNODELAY： NAGLE 算法通过将缓冲区内的小封包自动相连，组成较大的封包，阻止大量小封包的发送阻塞网络，从而提高网络应用效率。但是对于时延敏感的应用场景需要关闭该优化算法；

#### NIOEventLoopGroup 源码？

NioEventLoopGroup(其实是 MultithreadEventExecutorGroup) 内部维护一个类型为EventExecutor children [], 默认大小是处理器核数 * 2, 这样就构成了一个线程池，初始化EventExecutor 时 NioEventLoopGroup 重载 newChild 方法，所以 children 元素的实际类型为NioEventLoop。 线程启动时调用 SingleThreadEventExecutor 的构造方法，执行 NioEventLoop 类的 run 方法，首先会调用 hasTasks()方法判断当前 taskQueue 是否有元素。如果 taskQueue 中有元素，执行 selectNow() 方法，最终执行 selector.selectNow()，该方法会立即返回。如果 taskQueue 没有元素，执行 select(oldWakenUp) 方法select ( oldWakenUp) 方法解决了 Nio 中的 bug， selectCnt 用来记录selector.select 方法的执行次数和标识是否执行过 selector.selectNow()，若触发了 epoll 的空轮询 bug，则会反复执行selector.select(timeoutMillis)，变量 selectCnt 会逐渐变大，当 selectCnt 达到阈值（默认 512），则执行 rebuildSelector 方法，进行 selector 重建，解决 cpu 占用 100%的 bug。rebuildSelector 方法先通过 openSelector 方法创建一个新的 selector。然后将 old selector 的selectionKey 执行 cancel。最后将 old selector 的 channel 重新注册到新的 selector 中。rebuild 后，需要重新执行方法 selectNow，检查是否有已 ready 的 selectionKey。 接下来调用 processSelectedKeys 方法（处理 I/O 任务），当 selectedKeys != null 时，调用processSelectedKeysOptimized 方法，迭代 selectedKeys 获取就绪的 IO 事件的 selectkey 存放在数组 selectedKeys 中, 然后为每个事件都调用 processSelectedKey 来处理它，processSelectedKey 中分别处理 OP_READ； OP_WRITE； OP_CONNECT 事件。 最后调用 runAllTasks 方法（非 IO 任务），该方法首先会调用 fetchFromScheduledTaskQueue方法，把 scheduledTaskQueue 中已经超过延迟执行时间的任务移到 taskQueue 中等待被执行，然后依次从 taskQueue 中取任务执行，每执行 64 个任务，进行耗时检查，如果已执行时间超过预先设定的执行时间，则停止执行非 IO 任务，避免非 IO 任务太多，影响 IO 任务的执行。 每个 NioEventLoop 对应一个线程和一个 Selector， NioServerSocketChannel 会主动注册到某一个 NioEventLoop 的 Selector 上， NioEventLoop 负责事件轮询。Outbound 事件都是请求事件, 发起者是 Channel，处理者是 unsafe，通过 Outbound 事件进行通知，传播方向是 tail 到 head。 Inbound 事件发起者是 unsafe，事件的处理者是Channel, 是通知事件，传播方向是从头到尾。 内存管理机制，首先会预申请一大块内存 Arena， Arena 由许多 Chunk 组成，而每个 Chunk默认由 2048 个 page 组成。 Chunk 通过 AVL 树的形式组织 Page，每个叶子节点表示一个Page，而中间节点表示内存区域，节点自己记录它在整个 Arena 中的偏移地址。当区域被分配出去后，中间节点上的标记位会被标记，这样就表示这个中间节点以下的所有节点都已被分配了。大于 8k 的内存分配在 poolChunkList 中，而 PoolSubpage 用于分配小于 8k 的内存，它会把一个 page 分割成多段，进行内存分配。 ByteBuf 的特点：支持自动扩容（ 4M），保证 put 方法不会抛出异常、通过内置的复合缓冲类型，实现零拷贝（ zero-copy）；不需要调用 flip()来切换读/写模式，读取和写入索引分开；方法链；引用计数基于 AtomicIntegerFieldUpdater 用于内存回收； PooledByteBuf 采用二叉树来实现一个内存池，集中管理内存的分配和释放，不用每次使用都新建一个缓冲区对象。 UnpooledHeapByteBuf 每次都会新建一个缓冲区对象。

### Mybatis

### JDBC

#### JDBC和ODBC之间有什么区别

1. jdbc是java通过网络访问db的url连接的方式；odbc是本地建立连接后再使用的方式。或者说：前者是数据库官方版本，后者是符合规范的通用版本。
2. 驱动不同：JDBC的驱动程序由数据库厂商提供，ODBC驱动程序由微软提供。
3. java中一般采用JDBC连接 或JDBC-ODBC桥连接；java不直接调用ODBC API的原因是 ODBC采用C语言编写， 在移植性、安全性方面有欠缺。
4. JDBC-ODBC桥连接 一般用于本地学习或者局域网内使用；而JDBC方式可实现跨平台移植，适用范围广。
5. JDBC-ODBC桥连接一般用在JDK 5 以前。由于在JDK 5 以前，服务器厂商没有提供JDBC驱动程序，只能采用ODBC桥连接。

### Guava

### Tomcat

### ShardingSphere

## 开发工具

### Maven

### Git

### IDEA

### Debugging有哪些快捷键

使用f7 调试的时候遇到方法体的时候会进入到方法体内部  每个方法依次执行

使用f8 调试的时候 遇到方法体不会进入方法内部 只会依次执行

使用f9 调试的时候 只会执行 打断点的地方 

### JMH微基准测试框架 Java Microbenchmark Harness

#### 应用场景

Java的基准测试需要注意的几个点：

- 测试前需要预热。
- 防止无用代码进入测试方法中。
- 并发测试。
- 测试结果呈现。

比较典型的使用场景：

1. 当你已经找出了热点函数，而需要对热点函数进行进一步的优化时，就可以使用 JMH 对优化的效果进行定量的分析。
2. 想定量地知道某个函数需要执行多长时间，以及执行时间和输入 n 的相关性
3. 一个函数有两种不同实现（例如JSON序列化/反序列化有Jackson和Gson实现），不知道哪种实现性能更好

#### 相关注解

- @BenchmarkMode
  
  > 基准测试类型。这里选择的是Throughput也就是吞吐量。根据源码点进去，每种类型后面都有对应的解释，比较好理解，吞吐量会得到单位时间内可以进行的操作数。
  > 
  > - Throughput: 整体吞吐量，例如”1秒内可以执行多少次调用”。
  > - AverageTime: 调用的平均时间，例如”每次调用平均耗时xxx毫秒”。
  > - SampleTime: 随机取样，最后输出取样结果的分布，例如”99%的调用在xxx毫秒以内，99.99%的调用在xxx毫秒以内”
  > - SingleShotTime: 以上模式都是默认一次 iteration 是 1s，唯有 SingleShotTime 是只运行一次。往往同时把 warmup 次数设为0，用于测试冷启动时的性能。
  > - All(“all”, “All benchmark modes”);

- @Warmup
  
  > 上面我们提到了，进行基准测试前需要进行预热。一般我们前几次进行程序测试的时候都会比较慢， 所以要让程序进行几轮预热，保证测试的准确性。其中的参数iterations也就非常好理解了，就是预热轮数。
  > 
  > 为什么需要预热？因为 JVM 的 JIT 机制的存在，如果某个函数被调用多次之后，JVM 会尝试将其编译成为机器码从而提高执行速度。所以为了让 benchmark 的结果更加接近真实情况就需要进行预热。

- @Measurement
  
  > 度量，其实就是一些基本的测试参数。
  > 
  > 1. iterations 进行测试的轮次
  > 2. time 每轮进行的时长
  > 3. timeUnit 时长单位
  > 
  > 都是一些基本的参数，可以根据具体情况调整。一般比较重的东西可以进行大量的测试，放到服务器上运行。

- @Threads
  
  > 每个进程中的测试线程，这个非常好理解，根据具体情况选择，一般为cpu乘以2。

- @Fork
  
  > 进行 fork 的次数。如果 fork 数是2的话，则 JMH 会 fork 出两个进程来进行测试。

- @OutputTimeUnit
  
  > 这个比较简单了，基准测试结果的时间类型。一般选择秒、毫秒、微秒。

- @Benchmark
  
  > 方法级注解，表示该方法是需要进行 benchmark 的对象，用法和 JUnit 的 @Test 类似。

- @Param
  
  > 属性级注解，@Param 可以用来指定某项参数的多种情况。特别适合用来测试一个函数在不同的参数输入的情况下的性能。

- @Setup
  
  > 方法级注解，这个注解的作用就是我们需要在测试之前进行一些准备工作，比如对一些数据的初始化之类的。

- @TearDown
  
  > 方法级注解，这个注解的作用就是我们需要在测试之后进行一些结束工作，比如关闭线程池，数据库连接等的，主要用于资源的回收等。

- @State
  
  > 当使用@Setup参数的时候，必须在类上加这个参数，不然会提示无法运行。
  > 
  > State 用于声明某个类是一个”状态”，然后接受一个 Scope 参数用来表示该状态的共享范围。 因为很多 benchmark 会需要一些表示状态的类，JMH 允许你把这些类以依赖注入的方式注入到 benchmark 函数里。Scope 主要分为三种。
  > 
  > 1. Thread: 该状态为每个线程独享。
  > 2. Group: 该状态为同一个组里面所有线程共享。
  > 3. Benchmark: 该状态在所有线程间共享。
  > 
  > 关于State的用法，官方的 code sample 里有比较好的[例子](http://hg.openjdk.java.net/code-tools/jmh/file/cb9aa824b55a/jmh-samples/src/main/java/org/openjdk/jmh/samples/JMHSample_03_States.java)。

#### 测试案例：自然数求和的串行和并行算法性能测试

```
 @BenchmarkMode(Mode.AverageTime)
 @OutputTimeUnit(TimeUnit.MICROSECONDS)
 @State(Scope.Benchmark)
 public class SecondBenchmark {
     @Param({"10000", "100000", "1000000"})
     private int length;
     private int[] numbers;
     private Calculator singleThreadCalc;
     private Calculator multiThreadCalc;
     public static void main(String[] args) throws Exception {
         Options opt = new OptionsBuilder()
                 .include(SecondBenchmark.class.getSimpleName())
                 .forks(1)
                 .warmupIterations(5)
                 .measurementIterations(2)
                 .build();
         Collection<RunResult> results =  new Runner(opt).run();
         ResultExporter.exportResult("单线程与多线程求和性能", results, "length", "微秒");
     }
     @Benchmark
     public long singleThreadBench() {
         return singleThreadCalc.sum(numbers);
     }
     @Benchmark
     public long multiThreadBench() {
         return multiThreadCalc.sum(numbers);
     }
     @Setup
     public void prepare() {
         numbers = IntStream.rangeClosed(1, length).toArray();
         singleThreadCalc = new SinglethreadCalculator();
         multiThreadCalc = new MultithreadCalculator(Runtime.getRuntime().availableProcessors());
     }
     @TearDown
     public void shutdown() {
         singleThreadCalc.shutdown();
         multiThreadCalc.shutdown();
     }
 }
```

#### 

