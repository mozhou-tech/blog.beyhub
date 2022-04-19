---
title: Kubernetes必知必会
date: 2022-04-12 10:42:37
tags:
  - multipass
  - openwrt
categories:
  - 工作效率
toc: true

---

云原生本身甚至不能称为是一种架构，它首先是一种基础设施，运行在其上的应用称作云原生应用，只有符合云原生设计哲学的应用架构才叫云原生应用架构。

## 设计模式及使用

### 资源对象

#### Pod

```shell
# 查看Pod运行状态
kubectl get pod task-pv-pod
# 打开一个shell，进入Pod
kubectl exec -it task-pv-pod -- /bin/bash
# 清理Pod
kubectl delete pod task-pv-pod
# 查看Pod信息
kubectl describe pod
# 查看Pod所有信息（注解、 重启策略、端口和卷）
kubectl get pod nginx-deployment-1006230814-6winp -o yaml
```

> **Bare Pod**，所谓 Bare Pod 是指直接用 PodSpec 来创建的 Pod（即不在 ReplicaSet 或者 ReplicationController 的管理之下的 Pod）。这些 Pod 在 Node 重启后不会自动重启，但 Job 则会创建新的 Pod 继续任务。所以，推荐使用 Job 来替代 Bare Pod，即便是应用只需要一个 Pod。

- Pod文件拷贝

  > ```shell
  > # 这样可以把主机目录文件拷贝到容器内
  > kubectl cp /主机目录/文件路径 <namespace>/<podName>:examples/streaming/StateMachineExample.jar
  > # 这样可以把容器内文件cp到主机目录(相对于目前的WORKDIR)
  > kubectl cp <namespace>/<podName>:examples/streaming/StateMachineExample.jar ~/StateMachineExample.jar
  > ```

#### ReplicaSet

ReplicationController 用来确保容器应用的副本数始终保持在用户定义的副本数，即如果有容器异常退出，会自动创建新的 Pod 来替代；而如果异常多出来的容器也会自动回收。

在新版本的 Kubernetes 中建议使用 ReplicaSet 来取代 ReplicationController。ReplicaSet 跟 ReplicationController 没有本质的不同，只是名字不一样，并且 ReplicaSet 支持集合式的 selector。

虽然 ReplicaSet 可以独立使用，但一般还是建议使用 Deployment 来自动管理 ReplicaSet，这样就无需担心跟其他机制的不兼容问题（比如 ReplicaSet 不支持 rolling-update 但 Deployment 支持）。

#### ReplicationController [Deprecated]

#### Deployment

Deployment 为 Pod 和 ReplicaSet 提供了一个声明式定义（declarative）方法，用来替代以前的 ReplicationController 来方便的管理应用。典型的应用场景包括：

- 定义 Deployment 来创建 Pod 和 ReplicaSet
- 滚动升级和回滚应用
- 扩容和缩容
- 暂停和继续 Deployment

比如一个简单的 nginx 应用可以定义为：

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
        ports:
        - containerPort: 80
```

您只需要在 Deployment 中描述您想要的目标状态是什么，Deployment controller 就会帮您将 Pod 和 ReplicaSet 的实际状态改变到您的目标状态。您可以定义一个全新的 Deployment 来创建 ReplicaSet 或者删除已有的 Deployment 并创建一个新的来替换。

**注意**：您不该手动管理由 Deployment 创建的 ReplicaSet，否则您就篡越了 Deployment controller 的职责！下文罗列了 Deployment 对象中已经覆盖了所有的用例。如果未有覆盖您所有需要的用例，请直接在 Kubernetes 的代码库中提 issue。

典型的用例如下：

- 使用 Deployment 来创建 ReplicaSet。ReplicaSet 在后台创建 pod。检查启动状态，看它是成功还是失败。
- 然后，通过更新 Deployment 的 PodTemplateSpec 字段来声明 Pod 的新状态。这会创建一个新的 ReplicaSet，Deployment 会按照控制的速率将 pod 从旧的 ReplicaSet 移动到新的 ReplicaSet 中。
- 如果当前状态不稳定，回滚到之前的 Deployment revision。每次回滚都会更新 Deployment 的 revision。
- 扩容 Deployment 以满足更高的负载。
- 暂停 Deployment 来应用 PodTemplateSpec 的多个修复，然后恢复上线。
- 根据 Deployment 的状态判断上线是否 hang 住了。
- 清除旧的不必要的 ReplicaSet。

```shell
# 扩容
kubectl scale deployment nginx-deployment --replicas 10
# 如果集群支持 horizontal pod autoscaling 的话，还可以为 Deployment 设置自动扩展
kubectl autoscale deployment nginx-deployment --min=10 --max=15 --cpu-percent=80
# 更新镜像也比较简单
kubectl set image deployment/nginx-deployment nginx=nginx:1.9.1
# 回滚
kubectl rollout undo deployment/nginx-deployment
```

#### StatefulSet

StatefulSet是为了解决有状态服务的问题（对应Deployments和ReplicaSets是为无状态服务而设计），其应用场景包括：

- 稳定的持久化存储，即Pod重新调度后还是能访问到相同的持久化数据，基于PVC来实现
- 稳定的网络标志，即Pod重新调度后其PodName和HostName不变，基于Headless Service（即没有Cluster IP的Service）来实现
- 有序部署，有序扩展，即Pod是有顺序的，在部署或者扩展的时候要依据定义的顺序依次依次进行（即从0到N-1，在下一个Pod运行之前所有之前的Pod必须都是Running和Ready状态），基于init containers来实现
- 有序收缩，有序删除（即从N-1到0）

StatefulSet 适用于有以下某个或多个需求的应用：

- 稳定，唯一的网络标志。
- 稳定，持久化存储。
- 有序，优雅地部署和 scale。
- 有序，优雅地删除和终止。
- 有序，自动的滚动升级。

在上文中，稳定是 Pod （重新）调度中持久性的代名词。 如果应用程序不需要任何稳定的标识符、有序部署、删除和 scale，则应该使用提供一组无状态副本的 controller 来部署应用程序，例如 Deployment 或 ReplicaSet 可能更适合您的无状态需求。

#### DaemonSet

*DaemonSet* 确保全部（或者一些）Node 上运行一个 Pod 的副本。当有 Node 加入集群时，也会为他们新增一个 Pod 。当有 Node 从集群移除时，这些 Pod 也会被回收。删除 DaemonSet 将会删除它创建的所有 Pod。

使用 DaemonSet 的一些典型用法：

- 运行集群存储 daemon，例如在每个 Node 上运行 `glusterd`、`ceph`。
- 在每个 Node 上运行日志收集 daemon，例如`fluentd`、`logstash`。
- 在每个 Node 上运行监控 daemon，例如 Prometheus Node Exporter、collectd、Datadog 代理、New Relic 代理，或 Ganglia gmond。

一个简单的用法是，在所有的 Node 上都存在一个 DaemonSet，将被作为每种类型的 daemon 使用。 一个稍微复杂的用法可能是，对单独的每种类型的 daemon 使用多个 DaemonSet，但具有不同的标志，和/或对不同硬件类型具有不同的内存、CPU要求。

- DaemonSet Spec

  > - 必需字段
  >
  >   和其它所有 Kubernetes 配置一样，DaemonSet 需要 apiVersion、kind 和 metadata字段。有关配置文件的通用信息，详见文档 部署应用、配置容器 和资源管理。
  >
  >   DaemonSet 也需要一个 `.spec`配置段。
  >
  > - Pod 模板
  >
  >   `.spec` 唯一必需的字段是 `.spec.template`。
  >
  >   .spec.template 是一个 Pod 模板。 它与 Pod 具有相同的 schema，除了它是嵌套的，而且不具有 apiVersion 或 kind 字段。
  >
  >   Pod 除了必须字段外，在 DaemonSet 中的 Pod 模板必须指定合理的标签（查看 pod selector）。
  >
  >   在 DaemonSet 中的 Pod 模板必需具有一个值为 Always 的 RestartPolicy，或者未指定它的值，默认是 Always。
  >
  > - Pod Selector
  >
  >   .spec.selector 字段表示 Pod Selector，它与 Job 或其它资源的 .spec.selector 的原理是相同的。
  >
  >   `spec.selector` 表示一个对象，它由如下两个字段组成：
  >
  >   matchLabels - 与 ReplicationController 的 .spec.selector 的原理相同。
  >
  >   `matchExpressions` - 允许构建更加复杂的 Selector，可以通过指定 key、value 列表，以及与 key 和 value 列表的相关的操作符。
  >
  >   当上述两个字段都指定时，结果表示的是 AND 关系。
  >
  >   如果指定了 `.spec.selector`，必须与 `.spec.template.metadata.labels` 相匹配。如果没有指定，它们默认是等价的。如果与它们配置的不匹配，则会被 API 拒绝。
  >
  >   如果 Pod 的 label 与 selector 匹配，或者直接基于其它的 DaemonSet、或者 Controller（例如 ReplicationController），也不可以创建任何 Pod。 否则 DaemonSet Controller 将认为那些 Pod 是它创建的。Kubernetes 不会阻止这样做。一个场景是，可能希望在一个具有不同值的、用来测试用的 Node 上手动创建 Pod。
  >
  > - 仅在相同的 Node 上运行 Pod
  >
  >   如果指定了 .spec.template.spec.nodeSelector，DaemonSet Controller 将在能够匹配上 Node Selector 的 Node 上创建 Pod。 类似这种情况，可以指定 .spec.template.spec.affinity，然后 DaemonSet Controller 将在能够匹配上 Node Affinity 的 Node 上创建 Pod。 如果根本就没有指定，则 DaemonSet Controller 将在所有 Node 上创建 Pod。

#### Job

Job 负责批处理任务，即仅执行一次的任务，它保证批处理任务的一个或多个 Pod 成功结束。

- spec.template 格式同 Pod
- RestartPolicy 仅支持 Never 或 OnFailure
- 单个 Pod 时，默认 Pod 成功运行后 Job 即结束
- `spec.completions` 标志 Job 结束需要成功运行的 Pod 个数，默认为 1
- `spec.parallelism` 标志并行运行的 Pod 的个数，默认为 1
- `spec.activeDeadlineSeconds` 标志失败 Pod 的重试最大时间，超过这个时间不会继续重试

一个简单的例子：

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: pi
spec:
  template:
    metadata:
      name: pi
    spec:
      containers:
      - name: pi
        image: perl
        command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
      restartPolicy: Never
$ kubectl create -f ./job.yaml
job "pi" created
$ pods=$(kubectl get pods --selector=job-name=pi --output=jsonpath={.items..metadata.name})
$ kubectl logs $pods -c pi
3.141592653589793238462643383279502...
```

#### CronJob

*Cron Job* 管理基于时间的 [Job](https://kubernetes.io/docs/concepts/jobs/run-to-completion-finite-workloads/)，即：

- 在给定时间点只运行一次
- 周期性地在给定时间点运行

一个 CronJob 对象类似于 crontab （cron table）文件中的一行。它根据指定的预定计划周期性地运行一个 Job，格式可以参考 Cron 。

- CronJob Spec

> - `.spec.schedule`：**调度**，必需字段，指定任务运行周期，格式同 [Cron](https://en.wikipedia.org/wiki/Cron)
>
> - `.spec.jobTemplate`：**Job 模板**，必需字段，指定需要运行的任务，格式同 [Job](https://jimmysong.io/kubernetes-handbook/concepts/job.html)
>
> - `.spec.startingDeadlineSeconds` ：**启动 Job 的期限（秒级别）**，该字段是可选的。如果因为任何原因而错过了被调度的时间，那么错过执行时间的 Job 将被认为是失败的。如果没有指定，则没有期限
>
> - `.spec.concurrencyPolicy`：**并发策略**，该字段也是可选的。它指定了如何处理被 Cron Job 创建的 Job 的并发执行。只允许指定下面策略中的一种：
>
>   - `Allow`（默认）：允许并发运行 Job
>   - `Forbid`：禁止并发运行，如果前一个还没有完成，则直接跳过下一个
>   - `Replace`：取消当前正在运行的 Job，用一个新的来替换
>
>   注意，当前策略只能应用于同一个 Cron Job 创建的 Job。如果存在多个 Cron Job，它们创建的 Job 之间总是允许并发运行。
>
> - `.spec.suspend` ：**挂起**，该字段也是可选的。如果设置为 `true`，后续所有执行都会被挂起。它对已经开始执行的 Job 不起作用。默认值为 `false`。
>
> - `.spec.successfulJobsHistoryLimit` 和 `.spec.failedJobsHistoryLimit` ：**历史限制**，是可选的字段。它们指定了可以保留多少完成和失败的 Job。
>
>   默认情况下，它们分别设置为 `3` 和 `1`。设置限制的值为 `0`，相关类型的 Job 完成后将不会被保留。
>
> ```yaml
> apiVersion: batch/v1beta1
> kind: CronJob
> metadata:
>   name: hello
> spec:
>   schedule: "*/1 * * * *"
>   jobTemplate:
>     spec:
>       template:
>         spec:
>           containers:
>           - name: hello
>             image: busybox
>             args:
>             - /bin/sh
>             - -c
>             - date; echo Hello from the Kubernetes cluster
>           restartPolicy: OnFailure
> ```

- 操作

  > ```shell
  > # 删除Cron Job
  > kubectl delete cronjob hello
  > # 获取Job
  > kubectl get jobs
  > ```

#### HorizontalPodAutoscaler

### 配置对象

#### Node

Node 是 Kubernetes 集群的工作节点，可以是物理机也可以是虚拟机。

```bash
# 禁止 Pod 调度到该节点上。
kubectl cordon <node>
# 驱逐该节点上的所有 Pod。
kubectl drain <node>
```

- Node 包括如下状态信息

> - Address
>   - HostName：可以被 kubelet 中的 `--hostname-override` 参数替代。
>   - ExternalIP：可以被集群外部路由到的 IP 地址。
>   - InternalIP：集群内部使用的 IP，集群外部无法访问。
> - Condition
>   - OutOfDisk：磁盘空间不足时为 `True`
>   - Ready：Node controller 40 秒内没有收到 node 的状态报告为 `Unknown`，健康为 `True`，否则为 `False`。
>   - MemoryPressure：当 node 有内存压力时为 `True`，否则为 `False`。
>   - DiskPressure：当 node 有磁盘压力时为 `True`，否则为 `False`。
> - Capacity
>   - CPU
>   - 内存
>   - 可运行的最大 Pod 个数
> - Info：节点的一些版本信息，如 OS、kubernetes、docker 等

#### Namespace

namespace 提供独立的空间，实现部分的环境隔离。当你的项目和人员众多的时候可以考虑根据项目属性，例如生产、测试、开发划分不同的 namespace。

集群中默认会有 `default` 和 `kube-system` 这两个 namespace。在执行 `kubectl` 命令时可以使用 `-n` 指定操作的 namespace。

```shell
# 获取集群的命名空间
kubectl get ns
# 创建命名空间
kubectl create ns namespace
```

#### Service

#### Secret

#### ConfigMap

ConfigMap是用来存储配置文件的kubernetes资源对象，所有的配置内容都存储在etcd中。常规操作如下：

- 定义ConfigMap

  > ```yaml
  > kind: ConfigMap
  > apiVersion: v1
  > metadata:
  >   creationTimestamp: 2016-02-18T19:14:38Z
  >   name: example-config
  >   namespace: default
  > data:
  >     example.property.1: hello
  >     example.property.2: world
  >     flink-conf.yaml: |+
  >         jobmanager.rpc.address: flink-jobmanager-rpc
  >         taskmanager.numberOfTaskSlots: 4
  >         blob.server.port: 6124
  >         state.checkpoints.dir: /var/flink/checkpoints
  >         state.savepoints.dir: /var/flink/savepoints
  >         web.cancel.enable: true
  > ```

- 挂载ConfigMap

  > 方法1：在Deployment中挂载配置文件
  >
  > ```yaml
  > # deployment.yaml
  > .....
  > spec:
  >   containers:
  >   .....
  >     volumeMounts:
  >       - name: flink-config-volume
  >         mountPath: /opt/flink/conf/
  >   volumes:
  >     - name: flink-config-volume
  >       configMap:
  >         name: example-config # config-map名称
  >           items:
  >           - key: flink-conf.yaml
  >           path: flink-conf.yaml
  >           - key: log4j-console.properties
  >           path: log4j-console.properties
  > ```
  >
  > 方法2：在Pod中使用
  >
  > ```yaml
  > apiVersion: v1
  > kind: Pod
  > metadata:
  >   name: dapi-test-pod
  > spec:
  >   containers:
  >     - name: test-container
  >       image: gcr.io/google_containers/busybox
  >       command: [ "/bin/sh", "-c", "env" ]
  >       env:
  >         - name: SPECIAL_LEVEL_KEY
  >           valueFrom:
  >             configMapKeyRef:
  >               name: special-config
  >               key: special.how
  >         - name: SPECIAL_TYPE_KEY
  >           valueFrom:
  >             configMapKeyRef:
  >               name: special-config
  >               key: special.type
  >       envFrom:
  >         - configMapRef:
  >             name: env-config
  >   restartPolicy: Never
  > ```

- 使用该 ConfigMap 挂载的 Env **不会**同步更新

  > ENV 是在容器启动的时候注入的，启动之后 kubernetes 就不会再改变环境变量的值，且同一个 namespace 中的 pod 的环境变量是不断累加的

- 使用该 ConfigMap 挂载的 Volume 中的数据需要一段时间（实测大概10秒）才能同步更新

  > 更新 ConfigMap 目前并不会触发相关 Pod 的滚动更新，可以通过修改 pod annotations 的方式强制触发滚动更新。
  >
  > ```bash
  > $ kubectl patch deployment my-nginx --patch '{"spec": {"template": {"metadata": {"annotations": {"version/config": "20180411" }}}}}'
  > ```
  >
  > 这个例子里我们在 `.spec.template.metadata.annotations` 中添加 `version/config`，每次通过修改 `version/config` 来触发滚动更新。

#### Ingress

#### Label

Label 是附着到 object 上（例如 Pod）的键值对。可以在创建 object 的时候指定，也可以在 object 创建后随时指定。Labels 的值对系统本身并没有什么含义，只是对用户才有意义。

```json
"labels": {
  "key1" : "value1",
  "key2" : "value2"
}
```

Kubernetes 最终将对 labels 最终索引和反向索引用来优化查询和 watch，在 UI 和命令行中会对它们排序。不要在 label 中使用大型、非标识的结构化数据，记录这样的数据应该用 annotation。

- Label示例

  > Label 能够将组织架构映射到系统架构上（就像是康威定律），这样能够更便于微服务的管理，你可以给 object 打上如下类型的 label：
  >
  > - `"release" : "stable"`, `"release" : "canary"`
  > - `"environment" : "dev"`, `"environment" : "qa"`, `"environment" : "production"`
  > - `"tier" : "frontend"`, `"tier" : "backend"`, `"tier" : "cache"`
  > - `"partition" : "customerA"`, `"partition" : "customerB"`
  > - `"track" : "daily"`, `"track" : "weekly"`
  > - `"team" : "teamA"`,`"team:" : "teamB"`

- 在API Object中设置label selector

  > 在 `service`、`replicationcontroller` 等 object 中有对 pod 的 label selector，使用方法只能使用等于操作，例如：
  >
  > ```yaml
  > selector:
  >     component: redis
  > ```
  >
  > 在 `Job`、`Deployment`、`ReplicaSet` 和 `DaemonSet` 这些 object 中，支持 *set-based* 的过滤，例如：
  >
  > ```yaml
  > selector:
  >   matchLabels:
  >     component: redis
  >   matchExpressions:
  >     - {key: tier, operator: In, values: [cache]}
  >     - {key: environment, operator: NotIn, values: [dev]}
  > ```
  >
  > 如 Service 通过 label selector 将同一类型的 pod 作为一个服务 expose 出来。

#### Annotation

Label 和 Annotation 都可以将元数据关联到 Kubernetes 资源对象。Label 主要用于选择对象，可以挑选出满足特定条件的对象。相比之下，**annotation 不能用于标识及选择对象**。annotation 中的元数据可多可少，可以是结构化的或非结构化的，也可以包含 label 中不允许出现的字符。

Annotation 和 label 一样都是 key/value 键值对映射结构：

```
json"annotations": {"key1":"value1","key2":"value2"}
```

以下列出了一些可以记录在 annotation 中的对象信息：

- 声明配置层管理的字段。使用 annotation 关联这类字段可以用于区分以下几种配置来源：客户端或服务器设置的默认值，自动生成的字段或自动生成的 auto-scaling 和 auto-sizing 系统配置的字段。
- 创建信息、版本信息或镜像信息。例如时间戳、版本号、git 分支、PR 序号、镜像哈希值以及仓库地址。
- 记录日志、监控、分析或审计存储仓库的指针

- 可以用于 debug 的客户端（库或工具）信息，例如名称、版本和创建信息。
- 用户信息，以及工具或系统来源信息、例如来自非 Kubernetes 生态的相关对象的 URL 信息。
- 轻量级部署工具元数据，例如配置或检查点。
- 负责人的电话或联系方式，或能找到相关信息的目录条目信息，例如团队网站。

如果不使用 annotation，您也可以将以上类型的信息存放在外部数据库或目录中，但这样做不利于创建用于部署、管理、内部检查的共享工具和客户端库。

而ConfigMap更类似于一个分布式的配置中心，多个Pod可以通过ConfigMap共用配置信息。

#### CustomResourceDefinition

#### ServiceAccount

### 策略对象

#### SecurityContext

#### ResourceQuota

#### LimitRange

### 存储对象

#### Volume

- Kubernetes 支持以下类型的卷：

  > cephfs`/`csi/`downwardAPI`/`emptyDi/fc (fibre channel) / flocker / gcePersistentDisk/gitRepo/glusterfs`/`hostPath / iscsi / local / nfs / persistentVolumeClaim / projected / portworxVolume / quobyte / rbd / scaleIO / secret / storageos / vsphereVolume / ConfigMap

- emptyDir

  > 当 Pod 被分配给节点时，首先创建 `emptyDir` 卷，并且只要该 Pod 在该节点上运行，该卷就会存在。正如卷的名字所述，它最初是空的。Pod 中的容器可以读取和写入 `emptyDir` 卷中的相同文件，尽管该卷可以挂载到每个容器中的相同或不同路径上。当出于任何原因从节点中删除 Pod 时，`emptyDir` 中的数据将被永久删除。
  >
  > **注意**：容器崩溃不会从节点中移除 pod，因此 `emptyDir` 卷中的数据在容器崩溃时是安全的。
  >
  > `emptyDir` 的用法有：
  >
  > - 暂存空间，例如用于基于磁盘的合并排序
  > - 用作长时间计算崩溃恢复时的检查点
  > - Web服务器容器提供数据时，保存内容管理器容器提取的文件
  >
  > ```yaml
  > apiVersion: v1
  > kind: Pod
  > metadata:
  >   name: test-pd
  > spec:
  >   containers:
  >   - image: k8s.gcr.io/test-webserver
  >     name: test-container
  >     volumeMounts:
  >     - mountPath: /cache
  >       name: cache-volume
  >   volumes:
  >   - name: cache-volume
  >     emptyDir: {}
  > ```

- `persistentVolumeClaim` 

  > 卷用于将 PersistentVolume挂载到容器中。PersistentVolumes 是在用户不知道特定云环境的细节的情况下“声明”持久化存储（例如 GCE PersistentDisk 或 iSCSI 卷）的一种方式。

- hostPath卷：Pod直接挂载本地目录

  > `hostPath` 卷将主机节点的文件系统中的文件或目录挂载到集群中。该功能大多数 Pod 都用不到，但它为某些应用程序提供了一个强大的解决方法。
  >
  > 例如，`hostPath` 的用途如下：
  >
  > - 运行需要访问 Docker 内部的容器；使用 `/var/lib/docker` 的 `hostPath`
  > - 在容器中运行 cAdvisor；使用 `/dev/cgroups` 的 `hostPath`
  > - 允许 pod 指定给定的 hostPath 是否应该在 pod 运行之前存在，是否应该创建，以及它应该以什么形式存在
  >
  > 除了所需的 `path` 属性之外，用户还可以为 `hostPath` 卷指定 `type`。
  >
  > `type` 字段支持以下值：
  >
  > | 值                  | 行为                                                         |
  > | :------------------ | :----------------------------------------------------------- |
  > |                     | 空字符串（默认）用于向后兼容，这意味着在挂载 hostPath 卷之前不会执行任何检查。 |
  > | `DirectoryOrCreate` | 如果在给定的路径上没有任何东西存在，那么将根据需要在那里创建一个空目录，权限设置为 0755，与 Kubelet 具有相同的组和所有权。 |
  > | `Directory`         | 给定的路径下必须存在目录                                     |
  > | `FileOrCreate`      | 如果在给定的路径上没有任何东西存在，那么会根据需要创建一个空文件，权限设置为 0644，与 Kubelet 具有相同的组和所有权。 |
  > | `File`              | 给定的路径下必须存在文件                                     |
  > | `Socket`            | 给定的路径下必须存在 UNIX 套接字                             |
  > | `CharDevice`        | 给定的路径下必须存在字符设备                                 |
  > | `BlockDevice`       | 给定的路径下必须存在块设备                                   |
  >
  > 使用这种卷类型是请注意，因为：
  >
  > - 由于每个节点上的文件都不同，具有相同配置（例如从 podTemplate 创建的）的 pod 在不同节点上的行为可能会有所不同
  > - 当 Kubernetes 按照计划添加资源感知调度时，将无法考虑 `hostPath` 使用的资源
  > - 在底层主机上创建的文件或目录只能由 root 写入。您需要在特权容器中以 root 身份运行进程，或修改主机上的文件权限以便写入 `hostPath` 卷
  >
  > 示例：
  >
  > ```yaml
  > apiVersion: v1
  > kind: Pod
  > metadata:
  >   name: test-pd
  > spec:
  >   containers:
  >   - image: k8s.gcr.io/test-webserver
  >     name: test-container
  >     volumeMounts:
  >     - mountPath: /test-pd
  >       name: test-volume
  >   volumes:
  >   - name: test-volume
  >     hostPath: # 存储卷的类型
  >       # directory location on host
  >       path: /data
  >       # this field is optional
  >       type: Directory
  > ```

- projected

  > `projected` 卷将几个现有的卷源映射到同一个目录中。
  >
  > 目前，可以映射以下类型的卷来源：
  >
  > - [`secret`](https://jimmysong.io/kubernetes-handbook/concepts/volume.html#secret)
  > - [`downwardAPI`](https://jimmysong.io/kubernetes-handbook/concepts/volume.html#downwardapi)
  > - `configMap`
  >
  > 所有来源都必须在与 pod 相同的命名空间中。
  >
  > 带有 secret、downward API 和 configmap 的 pod
  >
  > ```yaml
  > apiVersion: v1
  > kind: Pod
  > metadata:
  >   name: volume-test
  > spec:
  >   containers:
  >   - name: container-test
  >     image: busybox
  >     volumeMounts:
  >     - name: all-in-one
  >       mountPath: "/projected-volume"
  >       readOnly: true
  >   volumes:
  >   - name: all-in-one
  >     projected:
  >       sources:
  >       - secret:
  >           name: mysecret
  >           items:
  >             - key: username
  >               path: my-group/my-username
  >       - downwardAPI:
  >           items:
  >             - path: "labels"
  >               fieldRef:
  >                 fieldPath: metadata.labels
  >             - path: "cpu_limit"
  >               resourceFieldRef:
  >                 containerName: container-test
  >                 resource: limits.cpu
  >       - configMap:
  >           name: myconfigmap
  >           items:
  >             - key: config
  >               path: my-group/my-config
  > ```
  >
  > #### 使用非默认权限模式设置多个 secret 的示例 pod
  >
  > ```yaml
  > apiVersion: v1
  > kind: Pod
  > metadata:
  >   name: volume-test
  > spec:
  >   containers:
  >   - name: container-test
  >     image: busybox
  >     volumeMounts:
  >     - name: all-in-one
  >       mountPath: "/projected-volume"
  >       readOnly: true
  >   volumes:
  >   - name: all-in-one
  >     projected:
  >       sources:
  >       - secret:
  >           name: mysecret
  >           items:
  >             - key: username
  >               path: my-group/my-username
  >       - secret:
  >           name: mysecret2
  >           items:
  >             - key: password
  >               path: my-group/my-password
  >               mode: 511
  > ```
  >
  > 每个映射的卷来源在 `sources` 下的规格中列出。除了以下两个例外，参数几乎相同：
  >
  > - 对于 secret，`secretName` 字段已经被更改为 `name` 以与 ConfigMap 命名一致。
  > - `defaultMode` 只能在映射级别指定，而不能针对每个卷源指定。但是，如上所述，您可以明确设置每个映射的 `mode`。

#### StorageClass

`StorageClass` 为管理员提供了描述存储 "class（类）" 的方法。 不同的 class 可能会映射到不同的服务质量等级或备份策略，或由群集管理员确定的任意策略。 Kubernetes 本身不清楚各种 class 代表的什么。这个概念在其他存储系统中有时被称为“配置文件”。

hostPath 类型的 PersistentVolume 使用节点上的文件或目录来模拟网络附加存储。已K3S为例，hostPath实际上为我们创建了一个本地目录用于存储文件：`/var/lib/rancher/k3s/storage/pvc-1b914241-aebf-416b-86e0-7371984775ad_devops_jenkins`。

- 存储分配器

  > Storage class 有一个分配器，用来决定使用哪个卷插件分配 PV。该字段必须指定。
  >
  > | Volume Plugin        | Internal Provisioner | Config Example                                               |
  > | -------------------- | -------------------- | ------------------------------------------------------------ |
  > | AWSElasticBlockStore | ✓                    | [AWS](https://kubernetes.io/docs/concepts/storage/storage-classes/#aws) |
  > | AzureFile            | ✓                    | [Azure File](https://kubernetes.io/docs/concepts/storage/storage-classes/#azure-file) |
  > | AzureDisk            | ✓                    | [Azure Disk](https://kubernetes.io/docs/concepts/storage/storage-classes/#azure-disk) |
  > | CephFS               | -                    | -                                                            |
  > | Cinder               | ✓                    | [OpenStack Cinder](https://kubernetes.io/docs/concepts/storage/storage-classes/#openstack-cinder) |
  > | FC                   | -                    | -                                                            |
  > | FlexVolume           | -                    | -                                                            |
  > | Flocker              | ✓                    | -                                                            |
  > | GCEPersistentDisk    | ✓                    | [GCE](https://kubernetes.io/docs/concepts/storage/storage-classes/#gce) |
  > | Glusterfs            | ✓                    | [Glusterfs](https://kubernetes.io/docs/concepts/storage/storage-classes/#glusterfs) |
  > | iSCSI                | -                    | -                                                            |
  > | PhotonPersistentDisk | ✓                    | -                                                            |
  > | Quobyte              | ✓                    | [Quobyte](https://kubernetes.io/docs/concepts/storage/storage-classes/#quobyte) |
  > | NFS                  | -                    | -                                                            |
  > | RBD                  | ✓                    | [Ceph RBD](https://kubernetes.io/docs/concepts/storage/storage-classes/#ceph-rbd) |
  > | VsphereVolume        | ✓                    | [vSphere](https://kubernetes.io/docs/concepts/storage/storage-classes/#vsphere) |
  > | PortworxVolume       | ✓                    | [Portworx Volume](https://kubernetes.io/docs/concepts/storage/storage-classes/#portworx-volume) |
  > | ScaleIO              | ✓                    | [ScaleIO](https://kubernetes.io/docs/concepts/storage/storage-classes/#scaleio) |
  > | StorageOS            | ✓                    | [StorageOS](https://kubernetes.io/docs/concepts/storage/storage-classes/#storageos) |

- 回收策略

  > Retain（保留）——手动回收
  >
  > Recycle（回收）——基本擦除（`rm -rf /thevolume/*`）
  >
  > Delete（删除）——关联的存储资产（例如 AWS EBS、GCE PD、Azure Disk 和 OpenStack Cinder 卷）将被删除

- StorageClass资源模板

```yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: standard
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp2
reclaimPolicy: Retain
mountOptions:
  - debug
```

#### PersistentVolume

`PersistentVolume`（PV）是由管理员设置的存储，它是**群集的一部分**。就像节点是集群中的资源一样，PV 也是集群中的资源。 PV 是 Volume 之类的卷插件，但具有独立于使用 PV 的 Pod 的生命周期。此 API 对象包含存储实现的细节，即 NFS、iSCSI 或特定于云供应商的存储系统。以下为PV资源模板：

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: task-pv-volume
  labels:
    type: local
spec:
  storageClassName: manual
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/mnt/data"
```

#### PersistentVolumeClaim

`PersistentVolumeClaim`（PVC）是用户存储的请求。它与 Pod 相似。Pod 消耗节点资源，PVC 消耗 PV 资源。Pod 可以请求特定级别的资源（CPU 和内存）。声明可以请求特定的大小和访问模式（例如，可以以读/写一次或 只读多次模式挂载）。

1. 创建PersistentVolumeClaim

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: task-pv-claim
spec:
  storageClassName: manual
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi
```

2. 在Pod中使用存储

注意 Pod 的配置文件指定了 PersistentVolumeClaim，但没有指定 PersistentVolume。 对 Pod 而言，PersistentVolumeClaim 就是一个存储卷。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: task-pv-pod
spec:
  volumes:
    - name: task-pv-storage
      persistentVolumeClaim:
        claimName: task-pv-claim
  containers:
    - name: task-pv-container
      image: nginx
      ports:
        - containerPort: 80
          name: "http-server"
      volumeMounts:
        - mountPath: "/usr/share/nginx/html"
          name: task-pv-storage
```

4. 两个地方挂载相同的pv

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test
spec:
  containers:
    - name: test
      image: nginx
      volumeMounts:
        # 网站数据挂载
        - name: config
          mountPath: /usr/share/nginx/html
          subPath: html
        # Nginx 配置挂载
        - name: config
          mountPath: /etc/nginx/nginx.conf
          subPath: nginx.conf # 注释使用subPath
  volumes:
    - name: config
      persistentVolumeClaim:
        claimName: test-nfs-claim
```

### 其它

#### 容器调度：Taint 和 Toleration

Taint（污点）和 Toleration（容忍）可以作用于 node 和 pod 上，其目的是**优化 pod 在集群间的调度**，这跟节点亲和性类似，只不过它们作用的方式相反，具有 taint 的 node 和 pod 是互斥关系，而具有节点亲和性关系的 node 和 pod 是相吸的。另外还有可以给 node 节点设置 label，通过给 pod 设置 `nodeSelector` 将 pod 调度到具有匹配标签的节点上。

Taint 和 toleration 相互配合，可以用来避免 pod 被分配到不合适的节点上。每个节点上都可以应用**一个或多个** taint ，这表示对于那些不能容忍这些 taint 的 pod，是不会被该节点接受的。如果将 toleration 应用于 pod 上，则表示这些 pod 可以（但不要求）被调度到具有相应 taint 的节点上。

- 为 node1 设置 taint

  > ```bash
  > kubectl taint nodes node1 key1=value1:NoSchedule
  > kubectl taint nodes node1 key1=value1:NoExecute
  > kubectl taint nodes node1 key2=value2:NoSchedule
  > ```
  >
  > 删除上面的 taint：
  >
  > ```bash
  > kubectl taint nodes node1 key1:NoSchedule-
  > kubectl taint nodes node1 key1:NoExecute-
  > kubectl taint nodes node1 key2:NoSchedule-
  > ```
  >
  > 查看 node1 上的 taint：
  >
  > ```bash
  > kubectl describe nodes node1
  > ```

- 为 pod 设置 toleration

  > 只要在 pod 的 spec 中设置 tolerations 字段即可，可以有多个 `key`，如下所示：
  >
  > ```yaml
  > tolerations:
  > - key: "key1"
  >   operator: "Equal"
  >   value: "value1"
  >   effect: "NoSchedule"
  > - key: "key1"
  >   operator: "Equal"
  >   value: "value1"
  >   effect: "NoExecute"
  > - key: "node.alpha.kubernetes.io/unreachable"
  >   operator: "Exists"
  >   effect: "NoExecute"
  >   tolerationSeconds: 6000
  > ```
  >
  > - `value` 的值可以为 `NoSchedule`、`PreferNoSchedule` 或 `NoExecute`。
  > - `tolerationSeconds` 是当 pod 需要被驱逐时，可以继续在 node 上运行的时间。

#### 垃圾回收

Kubernetes 垃圾收集器的角色是删除指定的对象，这些对象曾经有但以后不再拥有 Owner 了。

## 问题排查

### 获取集群事件

```shell
# 获取集群事件
kubectl get events -n namespace
```

## 参考资料

1. https://jimmysong.io/kubernetes-handbook/
2. https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/
3. https://artifacthub.io/