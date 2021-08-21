---
title: "一文看懂Zookeeper"
date: 2020-03-25T12:12:30+08:00
draft: false
categories:
  - "Java"
tags:
  - "zookeeper"
  - "分布式"
  - "大数据"
---
Apache ZooKeeper是Apache软件基金会的一个软件项目，它为大型分布式计算提供开源的分布式配置服务、同步服务和命名注册。 ZooKeeper曾经是Hadoop的一个子项目，但现在是一个独立的顶级项目。ZooKeeper的架构通过冗余服务实现高可用性（英语：High-availability cluster）。

因此，如果第一次无应答，客户端就可以询问另一台ZooKeeper主机。ZooKeeper节点将它们的数据存储于一个分层的命名空间，非常类似于一个文件系统或一个前缀树结构。客户端可以在节点读写，从而以这种方式拥有一个共享的配置服务。
<!--more-->

## 简介
1. 概述
1. 应用场景
目录服务
配置管理
同步
集群节点选举
消息队列
通知系统
1. 下载地址
1. 数据结构
文件系统+通知机制（观察者模式）

## 知识点

### 选举机制（重要）
1. 半数机制：集群中半数以上机器可用，集群可用。所以zookeeper适合奇数台服务器
2. Zookeeper虽然在配置文件中没有指定Master和Slave，但Zookeeper在工作时，有一个节点是Leader，其它节点为Follwer，Leader是通过内部选举机制产生的

### 监听器原理（重要）

> 常见的监听：1. 监听节点数据变化(get path watch) 2. 监听子节点增减的变化(ls path watch)

监听原理解析
1. 首先有一个main()线程
2. 在main线程创建zookeeper客户端，这时就会创建两个线程，一个负责网络通信(connet)，一个负责监听(listener)
3. 通过connect线程将注册的监听事件发送给zookeeper
4. 在Zookeeper的注册监听器列表中将注册的监听事件添加到列表中
5. Zookeeper监听到有数据或路径变化，就将会把这个消息发送给listener线程
6. listener线程内部调用了process()方法
![](/images/posts/2020/zk-listener原理.png)


### 节点类型
1. 持久(Persistent): 客户端和服务器断开连接后，创建节点不删除
2. 短暂(Ephemeral): 客户端和服务器断开连接后，创建的节点自己删除

### Stat结构体

### 写数据流程

1. client 向Zookeeper的server1上写数据，发送一个写请求
2. 如果server1不是Leader，则把请求转发给Leader，Leader再广播给Follwer
3. 当Leader收到大多数Server写成功了

![](/images/posts/2020/zk-写数据流程.png)

## 实战

### 分布式安装部署
1. 集群规划
2. 解压
3. 配置服务器编号
```bash
mkdir zkData
cd zkData
touch myid  # 集群的唯一标识
echo 1> myid  # myid为递增的数字
```

### 常用命令命令行

```bash
bin/zkCli.sh  # 进入客户端
ls # 查看节点
ls2 # 查看节点详细数据
create /sanguo "jinlian" # 创建节点（必须要写数据）
create /sanguo/shuguo "刘备" # 创建多级节点 
delete path # 删除当前path
rmr path # 递归删除所有下级路径
get path # 取出节点的数据
ls /sanguo
set path # 修改节点的数据
ls path watch # 监听子节点增减的变化
get path watch # 监听节点数据变化（注册一次，只生效一次）
stat path # 查看路径的详细信息

```
## FAQ
1. zookeeper的部署方式有几种？集群中有哪些角色？集群最少要几台机器
    * 部署方式：单机模式、集群模式
    * 集群中最少需要几台机器：3台
2. [跳转到github看examples](https://github.com/tenstone/spring-boot-zookeeper-examples)


Zookeeper是大数据框架中比较基础，也比较简单的一个，你已经掌握了吗？



