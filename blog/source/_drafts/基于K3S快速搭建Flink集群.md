---
title: 基于K3S快速搭建Flink集群
date: 2022-04-12 10:42:30
tags:
  - Flink
  - K3s
  - Kubernetes
  - Traefik
categories:
  - 大数据
toc: true
---

K3s 是一个轻量级的 Kubernetes 发行版，它针对边缘计算、物联网等场景进行了高度优化，并且可用于生产环境。Kubernetes 是一个 10 个字母的单词，简写为 K8s。所以，有 Kubernetes 一半大的东西就是一个 5 个字母的单词，简写为 K3s。K3s 没有全称，也没有官方的发音。因为公司开发需要，准备搭建一个Flink集群。

比较过Yarn和Native安装方法，都觉得后期运维比较麻烦Kubernetes相对来讲比较通用，可以方便迁移到公有云并创建1:1的运行环境。

<img src="images/image-20220414175321429.png" alt="image-20220414175321429" style="zoom:50%;" />

<!--more-->

在Kubernetes上运行Apache Flink将带来以下好处：

- **Scalability**: 按需弹性调整资源
- **Reliability**: 当Flink节点异常崩溃后，一个新的节点会被自动启动
- **Portability**: 适用于几乎所有的云设施及本地的测试环境
- **Cost-effectiveness**: 降低系统维护成本
- **Monitoring**: 设置专门的监控系统

## 准备K3S环境

### 安装K3S

systemctl restart k3s

### 安装Traefik

### 安装Kubernetes Dashboard

### 

## 部署Flink

Flink的部署支持Application、Cluster和Session Cluster三种模式，目前在K8s中仅支持Application Mode和Session Mode。

![image-20220415111205255](images/image-20220415111205255.png)

集群之间的区别在于：

- 集群的运行和资源是相互否隔离
- 应用的main方法在客户端或集群中是否被执行

### Application Mode



### Session Cluster Mode



## 其它方案

### Lyft提供的K8sOperator

https://github.com/lyft/flinkk8soperator

## 参考资料

1. https://nightlies.apache.org/flink/flink-docs-release-1.14/docs/deployment/resource-providers/native_kubernetes/
2. https://nightlies.apache.org/flink/flink-docs-master/zh/docs/deployment/config/
