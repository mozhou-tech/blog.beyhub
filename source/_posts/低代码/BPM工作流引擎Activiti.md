---
title: "BPM工作流引擎Activiti"
date: 2020-04-11T11:11:52+08:00
categories: 
    - "Java"
tags:
    - "开源组件"     
---

Activiti 是一个业务流程管理的开源框架，支持BPMN2.0流程定义协议。其主要功能有流程定义、流程部署、流程执行、用户群组管理、历史记录查询等功能。越是复杂的业务越是需要流程管理的工具，activiti就是很好的选择，从oa系统的审批到电商系统的购物，这些复杂的业务场景都能看到Activiti的身影。硬编码复杂的业务时，每一步的流转判断充满了风险，稍有不慎就得不到想要的结果，而问题追踪起来也非常麻烦。而基于activiti编写复杂的业务时，按照规范画出流程定义文件，业务可见即可得一目了然，大大降低了复杂业务出错的概率，剩下的事情就交给activiti去执行，它会严格按照流程的定义去执行。

<!--more-->

## BPM（Business Process Management）

BPMN(Business Process Model and Notation)，业务流程建模和标注。 Notation是BPMN的核心，即使用图形来表达业务流程。另外，BPMN是由OMG组织维护的一个公开的标准，与任何特定商业组织或工具是没有关系，无需为此付费。BPMN和传统的流程图的区别如下：

* BPMN是一个正式的规范，各种图标、元件是有准确的含义和使用规范
* BPMN可以描述基于事件触发的行为，比如响应超时、外部系统无法提供服务等

下图为一个订单流程的描述：

![](/images/posts/2020/bpmn.png)

## 特点

1. actitvti支持BPMN2.0流程定义协议。
1. activiti与Spring集成非常方便，甚至实现了Starter，集成SpringBoot更为方便。
1. activiti的社区活跃，github提交记录频繁，不断的有开发者给他添砖加瓦。
1. activiti的提供的api非常丰富，能够满足绝大部分的业务场景。

## 核心API

activiti给使用者提供了大量的接口，这些接口能够完成从流程部署、流程运行以及历史流程记录查询的所有操作。主要的api有一下七个：

1. RepositoryService，部署流程定义文件，管理流程定义实例。
1. RuntimeService，启动流程，管理流程实例，设置获取流程变量。
1. TaskService，处理任务、设置任务候选人（组）、指定任务处理人（组）、设置附件等。
1. FormService，获取任务的表单数据、提交完成一个任务、启动流程。
1. HistoryService，查询流程历史记录、事件记录、变量记录。
1. IdentityService，创建用户、创建组、查询用户（组）。
1. ManagementService，执行自定义命令、查询底层实体、数据表、提供更多的扩展功能。

## 参考

1. 官方网站：https://www.activiti.org/
1. BPMN 官网：http://www.bpmn.org/

