## Go编译器

### 交叉编译

#### 编译方式

```
# mac上编译linux和windows二进制
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build 
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build 

# linux上编译mac和windows二进制
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build 
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build

# windows上编译mac和linux二进制
SET CGO_ENABLED=0 SET GOOS=darwin SET GOARCH=amd64 go build main.go
SET CGO_ENABLED=0 SET GOOS=linux SET GOARCH=amd64 go build main.go
```

## 基本语法

### 基本理解

#### [Go 是传值还是传引用？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247489302&idx=1&sn=c787d1fa4546e12c7e55e880da73c91f&scene=21#wechat_redirect)

Go 语言中一切都是值传递，没有引用传递。不要直接把其他概念硬套上来，会犯先入为主的错误的。

传值，也叫做值传递（pass by value）。其**指的是在调用函数时将实际参数复制一份传递到函数中**，这样在函数中如果对参数进行修改，将不会影响到实际参数。

简单来讲，值传递，所传递的是该参数的副本，是复制了一份的，本质上不能认为是一个东西，指向的不是一个内存地址。

![图片](images/640-20211116203902365)

- [Go 面试官问我如何实现面向对象？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247489195&idx=1&sn=a39c9703021e130606b228119d535d4a&scene=21#wechat_redirect)
- [Go 结构体和结构体指针调用有什么区别吗？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487749&idx=1&sn=6add61c0404fd6f1bdc434eed347f559&scene=21#wechat_redirect)
- [Go new 和 make 是什么，差异在哪？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487140&idx=1&sn=36d12263308fd24c32e9f5327e73ba21&scene=21#wechat_redirect)
- [什么是协程，协程和线程的区别和联系？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247488604&idx=1&sn=83219ea874b1345debc65904cd7f025a&scene=21#wechat_redirect)

### 调度模型

- [GMP 模型，为什么要有 P？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487503&idx=1&sn=bfc20f81a1c6059ca489733b31a2c63c&scene=21#wechat_redirect)
- [Go 结构体是否可以比较，为什么？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487631&idx=1&sn=0c6d3e548573197e8281f622d8d5b0d7&scene=21#wechat_redirect)
- [单核 CPU，开两个 Goroutine，其中一个死循环，会怎么样？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487643&idx=1&sn=f81b18a12ab156feebb9fc9329e1c8f4&scene=21#wechat_redirect)
- [进程、线程都有 ID，为什么 Goroutine 没有 ID？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487486&idx=1&sn=aee9f99265fa8137e9d17e43c1ffb9ca&scene=21#wechat_redirect)
- [Goroutine 数量控制在多少合适，会影响 GC 和调度？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487250&idx=1&sn=3004324a9d2ba99233c4af48843dba64&scene=21#wechat_redirect)
- [详解 Go 程序的启动流程，你知道 g0，m0 是什么吗？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487902&idx=1&sn=5e4a09b18f87eee416238c1e75a2f5ea&scene=21#wechat_redirect)
- [Goroutine 泄露的情况有哪些？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487768&idx=1&sn=02ad5eb8619e1aa7a1835bb6b623caa4&scene=21#wechat_redirect)
- [Go 在什么时候会抢占 P？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247488491&idx=1&sn=ec14ff3f26e8aaa923c0e0da17ee426b&scene=21#wechat_redirect)
- [会诱发 Goroutine 挂起的 27 个原因](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247491708&idx=1&sn=172b6fd9a2eab7b6eb00ffa46395f904&scene=21#wechat_redirect)

### 数据结构

- [Go interface 的一个 “坑” 及原理分析](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487434&idx=1&sn=02dcfd4c0edc0fec867e93fb2bd69061&scene=21#wechat_redirect)
- [Go defer 万恶的闭包问题](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247487366&idx=1&sn=a0b2d5bfdb8ea5294094b1e7c59dd674&scene=21#wechat_redirect)
- [为什么 Go map 和 slice 是非线程安全的？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247489045&idx=1&sn=197bda427246e16907c7b471a5dc0572&scene=21#wechat_redirect)
- [Go sync.map 和原生 map 谁的性能好，为什么？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247489164&idx=1&sn=e56e5c9836cda40f3c95a39e2ba57dde&scene=21#wechat_redirect)

#### 为什么 Go map 的负载因子是 6.5？](https://mp.weixin.qq.com/s?__biz=MzUxMDI4MDc1NA==&mid=2247491866&idx=1&sn=e20ee68678ac7d99a94759cc6d80f662&scene=21#wechat_redirect)

Go 官方发现：**负载因子太大了，会有很多溢出的桶。太小了，就会浪费很多空间**（too large and we have lots of overflow buckets, too small and we waste a lot of space）。

![图片](images/640-20211116203902398)来自 Go 官方源码说明

根据这份测试结果和讨论，Go 官方把 Go 中的 map 的负载因子硬编码为 6.5，这就是 6.5 的选择缘由。

这意味着在 Go 语言中，**当 B（bucket）平均每个存储的元素大于或等于 6.5 时，就会触发扩容行为**，这是作为我们用户对这个数值最近的接触。

## 垃圾回收器

#### 介绍GO中垃圾回收机制

三色标记法

三色标记法因为多了一个白色的状态来存放不确定的对象，所以可以异步地执行。当然异步执行的代价是可能会造成一些遗漏，因为那些早先被标记为黑色的对象可能目前已经是不可达的了。所以三色标记法是一个 false negative（假阴性）的算法。

 