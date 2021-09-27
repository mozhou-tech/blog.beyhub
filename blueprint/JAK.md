自己查漏补缺

架构师知识体系【纲要】Java Architect Knowlegement

## 导读

- 架构师

  - 应用架构
  - 数据架构

- 架构思想

  - 思维方式
    - 抽象
    - 分层
    - 分治
    - 演化
  - 分布式
    - 需要考虑的问题
    - 具体方案
  - 微服务
    - 服务演化
    - 服务拆分
  - DDD
    - 聚合根
    - 领域模型
    - 代码示例

- 设计模式

  - GoF23
  - 其它模式

- 建模
  - UML
- 读书不会一肚子草
  - 《算法4》
  - 《我的第一本算法书》

## 算法

- 算法思想
  - 分治算法
  - 动态规划算法
  - 贪心算法
  - 二分法
  - 搜索算法
  - 回溯法
- 数据结构
  - 数组
  - 树
    - BST二叉搜索树
    - 2-3Tree
    - RBTree红黑树
    - AVL树
    - B树
    - Tire树（字典树）
  - 线性表（栈和队列）
    - 双向链表
    - 单向链表
  - 堆
    - 基于数组的实现
  - 队列
    - 优先队列
    - 有界队列
  - 图
  - Bitmap
- 常用算法
  - 分布式
    - SnowFlake ID生成
    - 负载均衡
    - 一致性Hash
    - Paxos
    - ZAB
    - Raft
    - 2PC/3PC
  - 搜索
    - 二分法搜索
  - 缓存
    - LRU
  - 排序
    - 冒泡排序
    - 插入排序
    - 堆排序
    - 桶排序
    - 快速排序
    - 希尔排序
    - 选择排序
- 数学模型
  - 自动机
  - 状态机
- 加密
  - 不可逆加密
    - bcrypt
    - MD5
  - 对称加密
    - DES
    - AES
  - 非对称加密
    - RSA

## 基础知识

- 操作系统
  - Linux基础
    - 常用发行版
    - 内核调优
  - Shell
    - awk提取日志
    - nohup命令
    - 编写脚本
  - 进程管理
    - top命令
    - pm2守护进程

- 云原生
  - K8s
  - Docker
  - Containered.io
  - MicroK8S
  - OpenShift

- 项目管理
  - Git
    - 分支管理
      - cherry-pick
      - pull request
  - 编码规范
  - 代码审查
    - Sonar
  - 管理工具
    - 禅道
    - JIRA

## 协议标准

- Java
  - CDI
  - JVM
    - 指令集
- 网络通信
  - TCP/IP
  - HTTP2
  - Protocol Buffers
  - MQTT
- 应用层
  - Json Schema
  - BPMN
  - OAuth2.0
- 工业协议
  - modbus
  - OPC UA

## 数据库

- 基本概念
  - ACID
  - JDBC
  - OLTP与OLAP
- Redis
  - 核心概念
    - Rehashing
  - 基本数据类型
  - 常用命令
  - 部署方式
    - 集群
    - 哨兵
- MySQL
  - 核心概念
    - 存储引擎（InnoDB）
    - TCP协议
    - 索引
  - 部署方式
    - 主从
    - 集群
  - 并发控制
    - MVCC
    - 锁（间隙锁、排他锁等）
  - 相关组件
    - canal
    - druid（为监控而生）
- MongoDB
  - 理论支持
  - 部署方式
- PostgreSQL
  - 常见用例
    - 索引BRIN
  - 插件库
  - TimescaleDB
- Elasticsearch
  - 数据结构
  - 常见用例
- Neo4j
  - 数据结构
- ClickHouse
  - MergeTree

## 数据智能

- 大数据框架
  
  - 布隆过滤器
  
  - Hadoop
    - Hive
    - HBase
  - Data Analysis
    - Spark
    - Flink
  - ETL
    - Flume
    - Kettle
  
- 大数据算法

  - 布隆过滤器

- 机器学习

  - NLP
    - word2vec
    - TextRank
    - TF-IDF
  - 回归模型
    - 逐步回归
    - Ridge Regression 岭回归
    - Lasso回归
    - ElasticNet回归
    - 多项式回归
    - 逻辑回归
    - 线性回归
  - 效果评估
    - ROC曲线
  - 决策树
    - GBDT-XGBoost
    - GBDT-Light-GBM
    - 随机森林
  - 聚类
    - DBSCAN
  - 十大经典算法
    - CART: 分类与回归树
    - AdaBoost
    - K-Means
    - SVM:支持向量机
    - The Apriori algorithm
    - EM：最大期望
    - PageRank
    - KNN: K近邻分类
    - Naive Bayes:朴素贝叶斯
    - C4.5决策树
  - 案例
    - 电影推荐

- 深度学习

  - DNN
  - RNN
  - CNN
  - LSTM

## 语言

### Java

- 版本特性
  - JDK8
  - JDK11
  - JDK16

- 构建工具
  - Maven
    - 命令大全
    - pom.xml
    - 依赖管理
    - 版本管理 mvn:versions
  - Gradle
- JVM
  - 概述
  - 内存技术
    - 分区
    - JMM
    - 类的加载
    - Object对象
    - GC
      - 理论基础
      - 分代收集
      - ZGC
      - GC优化
  - 执行引擎
    - 字节码技术
    - 指令集
    - rt.jar
  - JVM注解
  - 性能优化
- JDK
  - JUC
    - CopyOnWriteList
    - BlockingQueue
    - ForkJoin
    - ThreadLocal
    - Locksupport
    - Semaphore
    - CAS与volatile
  - 多线程
    - 
  - 集合
  - IO
  - 反射
  
- 核心概念
  - JMX
  - SPI
  - RMI
  - JNDI
  - javaagent
  - Unsafe
  - bytecode
    - javasist
    - asm
    - cglib
    - javaagent
- 会话管理
  - Session
  - Cookie
  - JWT
- 开发套件
  - Guava
    - 异步/同步事件
    - 
  - Goovy
  - Apache Commons
    - logging
    - Lang3
    - beanutils
    - lang3

- 工具
  - IDEA
  - Eclipse Spring Tools 4
  - Jrebel
  - lombok
  - Arthas

### Scala

### Groovy

### Python

- Jupyter Notebook

### Golang

### 前端

- Web
  - HTML/CSS
  - TypeScript
  - Vuejs
  - Reactjs
  - UI框架
    - AntDesign
  - 表单生成
    - Formily
- 小程序
  - TaroJs

## 框架

- Spring Framework
  - 核心概念
    - IoC
      1. Bean
      2. 自动装配
      3. 循环依赖
    - AOP
      1. Annotation与AbstractProcessor
  - Servlet
- Spring Boot
  - 第三方starter清单
  - 常用注解
    - @Transactional
    - @AdviceController&@AdviceRestController
  - 源码解析
  - 最佳实践
    - Bean验证器
- Spring Cloud
  - 常用组件
  - 幂等性设计
  - 事件总线
- RPC
  - 理论支持
  - Grpc
  - Dubbo
- 并发编程
  - 理论基础
    - Epoll/Select
    - Reactor模型
    - Corounting
  - Netty
    - 架构图
    - 核心概念
    - 源码解析
  - Akka
- ORM
  - Mybatis
  - JPA
- BPMN
  - Activiti
  - Flowable
  - Camunda
- 模板引擎
  - ThymeLeaf
  - Enjoin
- 集成框架
  - Apache Camel
  - Spring Integration

## 中间件

- 数据库
  - sharding-sphere
  - MyCat
- 缓存
  - Caffine
  - Ehcache
- 消息队列MQ
  - RabbitMQ
  - Kafka
  - RocketMQ
  - EMQX
- 存储
  - Minio
  - Ceph
- 网关&服务器
  - 流量网关
    - LVS
    - Kong
  - 业务网关
    - Tomcat
    - Nginx
      - 限流算法
      - 配置模板
      - luajit
    - Openresty
    - Spring Cloud Gateway
- 监控
  - Prometheus
  - Grafana

- 会话管理
  - KeyCloak
  - Apereo CAS
- 分布式
  - 分布式锁
    - Redis（AP锁）
    - MySQL
    - Zookeeper（CP锁）
  - 事务管理
    - 方案（AT、TCC、SAGA）
    - Seata
  - 协调组件
    - 理论支持（Paxos、Raft）
    - Zookeeper
    - Nacos
    - Consul

## 附录

- 测试
  - 压测
    - wrk
    - jMeter
  - Postman
  - Mock
    - Mock Server
    - Mocktio
- 持续集成
  - Jenkins CI/CD
- 网络优化
  - CDN
- 代码生成
  - 原理
- 云计算
  - 静态托管
  - 函数计算
- 玩玩硬件
  - 树莓派
  - 工控机
- 其它值得研究的项目
  - Keycloak
- 写作
  - Typora
  - pandoc
    - https://pandoc.org/index.html
- 推荐网站
  - http://data.biancheng.net/ （数据结构与算法教程）
  - https://www.biancheng.net/ (编程帮)