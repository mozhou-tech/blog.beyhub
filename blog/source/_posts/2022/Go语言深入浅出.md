---
title: Go语言深入浅出
tags:
  - Go
categories:
  - 后端开发
toc: true
date: 2022-04-13 09:15:21
---

## 背景知识

### Java和Go的语法区别

1. Go语言中函数是一等公民
2. 不支持Overload重载
3. 不支持@Override重写，因此math.Max(float64,float64) 不支持int

### 名词解释

| 名词 | 解释               |
| ---- | ------------------ |
| gc   | Go  compiler       |
| GOGC | Garbage Collection |

## 编译器

## 基本语法

### 命令行

#### go mod

| 命令         | 功能 |
| ------------ | ---- |
| go mod tidy  |      |
| go mod proxy |      |

#### go build

#### go install

#### go tool

| 命令          | 功能 |
| ------------- | ---- |
| go tool pprof |      |

### 变量声明

- 变量的作用域

  > 1. 花括号标识一个代码块，一般都存在作用域划分的作用（花括号内的局部变量互相屏蔽）
  > 2. 全局变量在代码块内部可以被覆盖声明，因此要避免重名（在开发规范中约定）

- 常量

  > ```go
  >  const MaxUint = ^uint(0) 
  > ```

- 变量

  > ```go
  > // 声明多个
  > var maxCount,base,count int
  > // 短式声明（只能在函数内使用）
  > v:=999
  > s:="hello world!"
  > // 多赋值
  > base, count,s := 1, 0,"hello world!"
  > ```

### 数据类型

#### 值类型和引用类型

- 值类型的特点是

  > 1. 变量直接存储值，内存通常在**栈中分配**
  > 2. 使用内置函数new(T)分配内存空间，并置为0值

- 引用类型的特点是

  > 1. 变量存储的是一个地址，这个地址对应的空间里才是真正存储的值，内存通常在**堆中分配**
  > 2. 使用内置函数make(T)分配内存空间：make( []Type, size, cap )
  > 3. 零值为nil

#### 值类型：数组

空接口可以标识任意类型（切片也有相同的特性）

```go
// will print [1,a]
func main() {
   a := make([]interface{},0) // 空接口可以标识任意类型
   a = append(a, 1)
   a = append(a, `a`)
   fmt.Printf("%+v", a)
}
```

#### 引用类型：切片

切片的底层是数组。添加成员时，容量是2的指数递增的，2，4，8，16，32。而且是在长度要超过容量时，才增加容量。cap(slice)查看容量，len(slice)查看。

```go
// 使用make初始化（推荐）make( []Type, size, cap )
a := make([]int, 5, 10)
// 使用字面量初始化
a = []int{1,2,3,4,5}
var a= new([]int)
// append
// copy
slice1 := []int{1, 2, 3, 4, 5}
slice2 := []int{5, 4, 3}
copy(slice2, slice1) // 只会复制slice1的前3个元素到slice2中
copy(slice1, slice2) // 只会复制slice2的3个元素到slice1的前3个位置
```

- 从切片和数组生成新的切片

  > 从连续内存区域生成切片是常见的操作，格式如下：slice [开始位置 : 结束位置]

#### 引用类型：Interface

接口定义了一组抽象方法的集合，但是没有实现。所有类型（包括自定义类型）都实现了空接口interface{}，所以空接口可以被当做任意类型的数值。interface的初始化零值为nil。

Go语言通过interface实现了面向对象的很多特性，这些接口通常只包含0-3个方法。

- 特点

> 1. 类型不用显示的声明实现了接口，只需要实现接口的所有方法，这样的隐式实现解耦了实现接口的包和定义接口的包；
> 2. 同一接口可以被多个不同类型实现；
> 3. 类型需要实现接口方法集中的所有方法。
> 4. 与Java和C++相比，Go中的接口有强大的灵活性
> 5. 一个接口可以包含一个或多个其它接口，但不能嵌入自身，也不能嵌入结构体

- 定义并实现接口示例

  > ```go
  > type A interface {
  > 	a()
  > }
  > type B interface {
  > 	A				// 内嵌 interface A
  > 	b()    // B的抽象方法
  > }
  > type C struct {
  > 	B      // 结构体C实现接口B
  > }
  > func (r *C) a() {	   // 具体实现
  > 	fmt.Println("a")
  > }
  > func (r *C) b()  {   // 具体实现
  > 	fmt.Println("b")
  > }
  > func main() {
  > 	c:=C{}
  > 	c.a()
  > 	c.b()
  > }
  > // print
  > // a
  > // b
  > ```

#### 引用类型：map字典

```go
// 从字典m删除键为k的元素
delete(m, k)
```

#### 引用类型：通道channel

channel是协程之间共享数据的通道（而非Java中的共享内存），可以通过内置的close()函数关闭

| 通道类型 | 阻塞条件                                            | 是否同步 |
| -------- | --------------------------------------------------- | -------- |
| 无缓冲区 | 发送和接收的协程没有同时准备好                      | 同步消息 |
| 有缓冲区 | 缓冲区满时发送方阻塞 / 通道中没有新的值时接收方阻塞 | 异步消息 |
| nil      | 总是阻塞                                            | -        |

通道关闭后，无法向通道继续发送数据。

#### 值类型：函数

函数中的return操作并不具备原子性，其可能被defer修改。

```go
var dfs func(*TreeNode) # 声明一个函数类型
```

- 递归：函数体内间接或直接的调用自身

- 回调：一个函数作为参数传入另一个参数，并在另一个函数中调用

- 匿名函数（闭包）：

> 闭包函数的作用域：可以捕获其所在代码块上下文中的变量的引用，而与实际使用时，表面的作用域无关。 

#### 引用类型：指针

#### 值类型：int系列

```golang
uint8  : 0 to 255 
uint16 : 0 to 65535 
uint32 : 0 to 4294967295 
uint64 : 0 to 18446744073709551615 
int8   : -128 to 127 
int16  : -32768 to 32767 
int32/int  : -2147483648 to 2147483647 
int64  : -9223372036854775808 to 9223372036854775807
```

#### 值类型：float系列

#### 值类型：结构体

特点

1. 结构体及其包含的数据在内存中是连续的，这带来很大的性能优势

2. 递归结构体，通过引用自身的指针来定义（二叉树和链表）

3. field的可见性：名称首字母的大小写

4. 结构体标签（tag）

   > ```go
   > type Student struct {
   > 	name string "学生名字"
   > 	Age  int    "学生年龄"
   > 	Room int    "json:Roomid"
   > }
   > func main() {
   > 	st := Student{"Li", 14, 102}
   > 	fmt.Println(reflect.TypeOf(st).Field(0).Tag)
   > 	fmt.Println(reflect.TypeOf(st).Field(1).Tag)
   > 	fmt.Println(reflect.TypeOf(st).Field(2).Tag)
   > }
   > ```

5. 匿名字段：没有显式的名字，类型就是字段（所以，每个结构体中同一类型只能有一个匿名字段）

   > ```go
   > type Person struct {
   >    name string "学生名字"
   >    Age  int    "学生年龄"
   > }
   > type Student struct {
   >    Person  // 匿名字段，只有类型
   >    Room int "json:Roomid"
   > }
   > ```

6. 嵌入与聚合：结构体中包含匿名（内嵌）字段叫做嵌入或者内嵌。如果结构体中字段包含了类型名和字段名，则叫做聚合。

   > ```go
   > type Human struct {
   > 	name string
   > }
   > type Person struct {
   > 	Human   		// 内嵌
   > }
   > type Person2 struct {
   > 	*Human			// 内嵌
   > }
   > type Person3 struct {
   > 	human Human			// 聚合
   > }
   > ```
   >
   > 嵌入方式：
   >
   > 1. 接口中嵌入接口：
   > 2. 接口中嵌入结构体：不合法，无法通过编译
   > 3. 结构体中内嵌接口：
   > 4. 结构体中嵌入结构体：不可嵌入自身的值类型（指针可以）

7. 方法

   > 通过接收器与结构体绑定的函数

#### 值类型：复数

```go
// 构造一个实部为1，虚部为2的复数
c := complex(-1, 2)
// 读取实部
r := real(c)
// 读取虚部
i := imag(c)
// cmplx包，复数操作函数包
cmplx.Abs(c)
```

### 控制语句

#### defer

后进先出

#### switch

在switch或select语句中，break的作用是跳过整个代码块，执行swith或select之后的代码。

Go语言中的break，fallthrough

#### select

#### if

#### for

### 异常处理

#### error

#### panic

表示严重且不可恢复的异常。

#### recover

从panic或error场景中恢复。

### 组合的方法集

golang中没有继承的概念，代码复用是通过组合的方式实现。

### CGO

## 设计模式

### 嵌入

### 聚合

## SDK核心包

### fmt

#### %v %+v %#v的区别

```go
// 打印数组
func main() {
    s := &student{"jiafu", 123456}
    fmt.Printf("%%v的方式  = %v\n", s)
    fmt.Printf("%%+v的方式 = %+v\n", s)
    fmt.Printf("%%#v的方式 = %#v\n", s)
}
// %v的方式  = &{jiafu 123456}
// %+v的方式 = &{name:jiafu id:123456}
// %#v的方式 = &main.student{name:"jiafu", id:123456}
// %v 只输出所有的值
// %+v 先输出字段类型，再输出该字段的值
// %#v 先输出结构体名字值，再输出结构体（字段类型+字段的值）
```

### math

### runtime

#### runtime/pprof （net/http/pprof）

用于监控Go的堆栈、CPU的耗时等性能信息。

### bytes

### strings

### utf8

### strconv

### unsafe

### atomic

提供了原子操作的方法，类似JDK juc包中的原子类。

### sync

#### 互斥锁 sync.Mutex（全局锁）

传统的并发程序通常使用互斥锁对共享资源进行访问，而Go提倡使用通道实现资源共享和通信。

Mutex只有两个方法：调用Lock()获得锁（同一个协程不能重复Lock），UnLock()释放锁。只允许一个协程的读或者写。

```go
var lck sync.Mutex // 定义一个互斥锁
func foo(){
  lck.Lock() // 会阻塞到获取锁
  defer lck.Unlock() // defer语句在函数返回时获取锁
}
```

#### 读写锁 sync.RWMutex

多读单写的互斥锁

#### sync.WaitGroup

主线程使用Add()方法设置等待的协程数量，并在完成后调用Done()方法。同时Wait方法可以阻塞主线程，直到所有协程完成后才会向下执行。

#### sync.Once.Do()

保证Do()方法只执行一次

```go
package main
import (
  "fmt"
  "sync"
  "time"
)
// 只会打印一次
func main() {
  var once sync.Once
  for i := 0; i < 5; i++ {
    go func(i int) {
      fun1 := func() {
        fmt.Printf("i:=%d\n", i)
      }
      once.Do(fun1)
    }(i)
  }
  time.Sleep(50 * time.Millisecond) // 为了防止主goroutine直接运行完了，啥都看不到
}
```

#### sync.Map

线程安全的字典。

### testing

*\_test.go

### reflect

### context

### os

### net

### http

### encoding

### json

### time

## 工程结构

### 环境变量与项目目录

- GOROOT 安装目录

- GOPATH 工程目录

> 1. GOPATH在项目管理中非常重要，创建项目必须确保目录在GOPATH中，多个项目用分号分隔
> 2. src 源代码
> 3. pkg 存放编译后生成的文件
> 4. bin 存放编译后生成的可执行文件

### 源代码管理

> 1. Go中使用package来结构化的组织代码
> 2. Init()函数常用于包的初始化，不能被其它函数调用，在main()方法之前自动执行
> 3. Init()函数有多个时，其执行顺序是无法确定的
> 4. import关键字将当前文件与package关联

#### WorkSpace

go语言中的workspace使你在不编辑mod.go的情况下（不需要单独编辑每个go.mod文件），维护工程目录下的多个module。在解决依赖时workspace会被作为root模块。

> go.work 文件包含的指令与go.mod类似
> go/use/replace

```shell
# 生产 go.work 文件
go work init
# 递归的将目录下包含go.mod的文件夹导入
go work use -r
# go.work中定义的依赖同步至go.mod
go work sync
# go.work命令行编辑
go work edit
```

go.work文件示例

```go
go 1.18
use (
		 path-to-your-mode
)
```

#### Module

```shell
go mod init
```

### 注释规范

在包中创建doc.go文件

```shell
// 启动本地文档服务
godoc -http=:6060 -play
```

### 命名规范

go中的变量和类型通过名称的首字母的大小写控制包外的可见性。

```go
// 包外可见
var Value1 int = 1
type DemoType {}
func (x *X) Set(i int) {
    x.a = i
}
// 包外不可见
var value2 int = 3
type fooType{}
```

### 基准测试

如果开发的是Web程序，可以引入包\_ "net/http/pprof"，在浏览器中访问 http://localhost:port/debug/pprof/

## 第三方库

### 基于OpenCV的跨平台GUI自动化库

https://github.com/go-vgo/robotgo

### Web框架

https://github.com/gin-gonic/gin

## 常见问题

### 函数

#### 函数的参数传递是值传递还是引用传递

#### 匿名函数的延时绑定问题

#### Go语言中有类吗？

在经典的面向对象语言中（Java、C++、C#等），将数据和方法封装为类，类中包含两者且不能剥离。而Go语言中，数据和方法是正交关系。

结构体可以看做类的简化形式。

### 数据类型

#### 切片的扩容规则

#### 什么是鸭子类型

#### Is Go an object-oriented language?

Yes and no. Although Go has types and methods and allows an object-oriented style of programming, there is no type hierarchy. The concept of “interface” in Go provides a different approach that we believe is easy to use and in some ways more general. There are also ways to embed types in other types to provide something analogous—but not identical—to subclassing. Moreover, methods in Go are more general than in C++ or Java: they can be defined for any sort of data, even built-in types such as plain, “unboxed” integers. They are not restricted to structs (classes).

Also, the lack of a type hierarchy makes “objects” in Go feel much more lightweight than in languages such as C++ or Java.

## 参考资料

1. https://go.dev/doc/

持续完善中....
