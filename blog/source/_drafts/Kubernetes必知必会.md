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

Pod 是 Kubernetes 的原子对象。Pod 表示您的集群上一组正在运行的容器（containers）。 

通常创建 Pod 是为了运行单个主容器。Pod 还可以运行可选的边车（sidecar）容器，以添加诸如日志记录之类的补充特性。通常用 Deployment 来管理 Pod。

##### Pod Disruption Budget

亦称作:PDB
Pod 干扰预算（Pod Disruption Budget，PDB） 使应用所有者能够为多实例应用创建一个对象，来确保一定数量的具有指定标签的 Pod 在任何时候都不会被主动驱逐。 

##### Pod 优先级（Pod Priority）

Pod 优先级表示一个 Pod 相对于其他 Pod 的重要性。 

Pod 优先级 允许用户为 Pod 设置高于或低于其他 Pod 的优先级 -- 这对于生产集群 工作负载而言是一个重要的特性。

##### Pod 安全策略

为 Pod 的创建和更新操作启用细粒度的授权。 

Pod 安全策略是集群级别的资源，它控制着 Pod 规约中的安全性敏感的内容。 PodSecurityPolicy对象定义了一组条件以及相关字段的默认值，Pod 运行时必须满足这些条件。Pod 安全策略控制实现上体现为一个可选的准入控制器。

##### Pod 干扰

pod 干扰 是指节点上的 pod 被自愿或非自愿终止的过程。 

自愿干扰是由应用程序所有者或集群管理员有意启动的。非自愿干扰是无意的，可能由不可避免的问题触发，如节点耗尽资源或意外删除。

##### Pod 水平自动扩缩器（Horizontal Pod Autoscaler）

亦称作:HPA
Horizontal Pod Autoscaler（Pod 水平自动扩缩器）是一种 API 资源，它根据目标 CPU 利用率或自定义度量目标扩缩 Pod 副本的数量。 

HPA 通常用于 ReplicationControllers 、Deployments 或者 ReplicaSets 上。 HPA 不能用于不支持扩缩的对象，例如 DaemonSets。

##### Pod 生命周期

关于 Pod 在其生命周期中处于哪个阶段的更高层次概述。 

Pod 生命周期 是关于 Pod 处于哪个阶段的概述。包含了下面5种可能的的阶段: Running、Pending、Succeeded、 Failed、Unknown。关于 Pod 的阶段的更高级描述请查阅 PodStatus phase 字段。

##### 静态 Pod（Static Pod）

由特定节点上的 kubelet 守护进程直接管理的 pod，API 服务器不了解它的存在。

##### 驱逐

驱逐即终止节点上一个或多个 Pod 的过程。 驱逐的两种类型

- 节点压力驱逐
- API 发起的驱逐

##### Pod 常用操作

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

Pod文件拷贝

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

Kubernetes 中的工作机器称作节点。 

工作机器可以是虚拟机也可以是物理机，取决于集群的配置。 其上部署了运行 Pods 所必需的本地守护进程或服务， 并由主控组件来管理。 节点上的的守护进程包括 kubelet、 kube-proxy 以及一个 Docker 这种 实现了 CRI 的容器运行时。

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

Secret 用于存储敏感信息，如密码、 OAuth 令牌和 SSH 密钥。

Secret 允许用户对如何使用敏感信息进行更多的控制，并减少信息意外暴露的风险。 默认情况下，Secret 值被编码为 base64 字符串并以非加密的形式存储，但可以配置为 静态加密（Encrypt at rest）。 Pod 通过挂载卷中的文件的方式引用 Secret，或者通过 kubelet 为 pod 拉取镜像时引用。 Secret 非常适合机密数据使用，而 ConfigMaps 适用于非机密数据。

##### ServiceAccount

为在 Pod 中运行的进程提供标识。 

当 Pod 中的进程访问集群时，API 服务器将它们作为特定的服务帐户进行身份验证， 例如 default ，创建 Pod 时，如果你没有指定服务帐户，它将自动被赋予同一个 名字空间中的 default 服务账户。

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

申领持久卷（PersistentVolume）中定义的存储资源，以便可以将其挂载为容器（container）中的卷。 

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

## 其它词汇概念

#### API Group

Kubernetes API 中的一组相关路径。 

通过更改 API server 的配置，可以启用或禁用每个 API Group。 你还可以禁用或启用指向特定资源的路径。 API group 使扩展 Kubernetes API 更加的容易。 API group 在 REST 路径和序列化对象的 apiVersion 字段中指定。

- 阅读 API Group 了解更多信息。

#### API 发起的驱逐

API 发起的驱逐是一个先调用 Eviction API 创建 Eviction 对象，再由该对象体面地中止 Pod 的过程。 

你可以通过 kube-apiserver 的客户端，比如 kubectl drain 这样的命令，直接调用 Eviction API 发起驱逐。 当 Eviction 对象创建出来之后，该对象将驱动 API 服务器终止选定的Pod。

API 发起的驱逐不同于 节点压力引发的驱逐。

#### cAdvisor

cAdvisor (Container Advisor) 为容器用户提供对其运行中的容器 的资源用量和性能特征的知识。 

cAdvisor 是一个守护进程，负责收集、聚合、处理并输出运行中容器的信息。 具体而言，针对每个容器，该进程记录容器的资源隔离参数、历史资源用量、 完整历史资源用量和网络统计的直方图。这些数据可以按容器或按机器层面输出。

#### CIDR

CIDR (无类域间路由) 是一种描述 IP 地址块的符号，被广泛使用于各种网络配置中。CIDR 标记使用一个斜线/分隔符，后面跟一个十进制数值表示地址中网络部分所占的位数。例如，205.123.196.183/25 中的 25 表示地址中 25 位用于网络 ID，相应的掩码为 255.255.255.128。

在 Kubernetes 的上下文中，每个节点 以 CIDR 形式（含起始地址和子网掩码）获得一个 IP 地址段， 从而能够为每个 Pod 分配一个独一无二的 IP 地址。 虽然其概念最初源自 IPv4，CIDR 已经被扩展为涵盖 IPv6。

#### containerd

强调简单性、健壮性和可移植性的一种容器运行时 

containerd 是一种容器运行时，能在 Linux 或者 Windows 后台运行。 containerd 能取回、存储容器镜像，执行容器实例，提供网络访问等。

#### CRI-O

该工具可让你通过 Kubernetes CRI 使用 OCI 容器运行时。 

CRI-O 是 CRI 的一种实现， 使得你可以使用与开放容器倡议（Open Container Initiative，OCI） 运行时规范 兼容的容器。

部署 CRI-O 允许 Kubernetes 使用任何符合 OCI 要求的运行时作为容器运行时 去运行 Pods， 并从远程容器仓库获取 OCI 容器镜像。

#### CustomResourceDefinition

通过定制化的代码给您的 Kubernetes API 服务器增加资源对象，而无需编译完整的定制 API 服务器。 

当 Kubernetes 公开支持的 API 资源不能满足您的需要时，定制资源对象（Custom Resource Definitions）让您可以在您的环境上扩展 Kubernetes API。

#### Docker

Docker（这里特指 Docker 引擎） 是一种可以提供操作系统级别虚拟化（也称作容器）的软件技术。 

Docker 使用了 Linux 内核中的资源隔离特性（如 cgroup 和内核命名空间）以及支持联合文件系统（如 OverlayFS 和其他）， 允许多个相互独立的“容器”一起运行在同一 Linux 实例上，从而避免启动和维护虚拟机（VMs）的开销。

#### EndpointSlice

一种将网络端点与 Kubernetes 资源组合在一起的方法。 

#### etcd

etcd 是兼具一致性和高可用性的键值数据库，可以作为保存 Kubernetes 所有集群数据的后台数据库。 

您的 Kubernetes 集群的 etcd 数据库通常需要有个备份计划。javascript:void(0))

#### Finalizer

Finalizer 是带有命名空间的键，告诉 Kubernetes 等到特定的条件被满足后， 再完全删除被标记为删除的资源。 Finalizer 提醒控制器清理被删除的对象拥有的资源。

当你告诉 Kubernetes 删除一个指定了 Finalizer 的对象时， Kubernetes API 通过填充 .metadata.deletionTimestamp 来标记要删除的对象， 并返回202状态码 (HTTP "已接受") 使其进入只读状态。 此时控制平面或其他组件会采取 Finalizer 所定义的行动， 而目标对象仍然处于终止中（Terminating）的状态。 这些行动完成后，控制器会删除目标对象相关的 Finalizer。 当 metadata.finalizers 字段为空时，Kubernetes 认为删除已完成。

#### FlexVolume

FlexVolume 是一个已弃用的接口，用于创建树外卷插件。 容器存储接口（CSI） 是比 Flexvolume 更新的接口，它解决了 Flexvolume 的一些问题。 

Flexvolume 允许用户编写自己的驱动程序，并在 Kubernetes 中加入对用户自己的数据卷的支持。 FlexVolume 驱动程序的二进制文件和依赖项必须安装在主机上。 这需要 root 权限。如果可能的话，SIG Storage 建议实现 CSI 驱动程序， 因为它解决了 Flexvolumes 的限制。

- Kubernetes 文档中的 Flexvolume
- 更多关于 Flexvolumes 的信息
- 存储供应商的卷插件 FAQ

#### Helm Chart

Helm Chart 是一组预先配置的 Kubernetes 资源所构成的包，可以使用 Helm 工具对其进行管理。 

Chart 提供了一种可重现的用来创建和共享 Kubernetes 应用的方法。 单个 Chart 可用来部署简单的系统（例如一个 memcached Pod）， 也可以用来部署复杂的系统（例如包含 HTTP 服务器、数据库、缓存等组件的完整 Web 应用堆栈）。

#### HostAliases

主机别名 (HostAliases) 是一组 IP 地址和主机名的映射，用于注入到 Pod 内的 hosts 文件。 

HostAliases 是一个包含主机名和 IP 地址的可选列表，配置后将被注入到 Pod 内的 hosts 文件中。 该选项仅适用于没有配置 hostNetwork 的 Pod.

#### Istio

Istio 是个开放平台（非 Kubernetes 特有），提供了一种统一的方式来集成微服务、管理流量、实施策略和汇总度量数据。 

添加 Istio 时不需要修改应用代码。它是基础设施的一层，介于服务和网络之间。 当它和服务的 Deployment 相结合时，就构成了通常所谓的服务网格（Service Mesh）。 Istio 的控制面抽象掉了底层的集群管理平台，这一集群管理平台可以是 Kubernetes、Mesosphere 等。

#### Kops

kops 是一个命令行工具，可以帮助您创建、销毁、升级和维护生产级，高可用性的 Kubernetes 集群。 

注意：官方仅支持 AWS，GCE 和 VMware vSphere 的支持还处于 alpha* 阶段。

kops 为您的集群提供了：

- 全自动化安装
- 基于 DNS 的集群标识
- 自愈功能：所有组件都在自动伸缩组（Auto-Scaling Groups）中运行
- 有限的操作系统支持 (推荐使用 Debian，支持 Ubuntu 16.04，试验性支持 CentOS & RHEL)
- 高可用 (HA) 支持
- 直接提供或者生成 Terraform 清单文件的能力

您也可以将自己的集群作为一个构造块，使用 Kubeadm 构造集群。kops 是建立在 kubeadm 之上的。

#### kube-apiserver

API 服务器是 Kubernetes 控制面的组件， 该组件公开了 Kubernetes API。 API 服务器是 Kubernetes 控制面的前端。 

Kubernetes API 服务器的主要实现是 kube-apiserver。 kube-apiserver 设计上考虑了水平伸缩，也就是说，它可通过部署多个实例进行伸缩。 你可以运行 kube-apiserver 的多个实例，并在这些实例之间平衡流量。

#### kube-controller-manager

运行控制器进程的控制平面组件。 

从逻辑上讲，每个控制器都是一个单独的进程， 但是为了降低复杂性，它们都被编译到同一个可执行文件，并在一个进程中运行。

#### kube-proxy

kube-proxy 是集群中每个节点上运行的网络代理， 实现 Kubernetes 服务（Service） 概念的一部分。 

kube-proxy 维护节点上的网络规则。这些网络规则允许从集群内部或外部的网络会话与 Pod 进行网络通信。

如果操作系统提供了数据包过滤层并可用的话，kube-proxy 会通过它来实现网络规则。否则， kube-proxy 仅转发流量本身。

#### kube-scheduler

控制平面组件，负责监视新创建的、未指定运行节点（node）的 Pods，选择节点让 Pod 在上面运行。 

调度决策考虑的因素包括单个 Pod 和 Pod 集合的资源需求、硬件/软件/策略约束、亲和性和反亲和性规范、数据位置、工作负载间的干扰和最后时限。

#### Kubeadm

用来快速安装 Kubernetes 并搭建安全稳定的集群的工具。 

你可以使用 kubeadm 安装控制面和 工作节点 组件。|

#### Kubectl

亦称作:kubectl
kubectl 是使用 Kubernetes API 与 Kubernetes 集群的控制面进行通信的命令行工具。 

你可以使用 kubectl 创建、检视、更新和删除 Kubernetes 对象。

#### Kubelet

一个在集群中每个节点（node）上运行的代理。 它保证容器（containers）都 运行在 Pod 中。 

kubelet 接收一组通过各类机制提供给它的 PodSpecs，确保这些 PodSpecs 中描述的容器处于运行状态且健康。 kubelet 不会管理不是由 Kubernetes 创建的容器。

#### Kubernetes API

Kubernetes API 是通过 RESTful 接口提供 Kubernetes 功能服务并负责集群状态存储的应用程序。 

Kubernetes 资源和"意向记录"都是作为 API 对象储存的，并可以通过调用 RESTful 风格的 API 进行修改。 API 允许以声明方式管理配置。 用户可以直接和 Kubernetes API 交互，也可以通过 kubectl 这样的工具进行交互。 核心的 Kubernetes API 是很灵活的，可以扩展以支持定制资源。

#### LimitRange

提供约束来限制命名空间中每个 容器（Containers） 或 Pod 的资源消耗。 

LimitRange 按照类型来限制命名空间中对象能够创建的数量，以及单个 容器（Containers） 或 Pod 可以请求/使用的计算资源量。

#### Master

遗留术语，作为运行 控制平面 的 节点 的同义词使用。 

该术语仍被一些配置工具使用，如 kubeadm 以及托管的服务，为 节点（nodes） 添加 kubernetes.io/role 的 标签（label），以及管理控制平面 Pod 的调度。

#### Minikube

Minikube 是用来在本地运行 Kubernetes 的一种工具。 

Minikube 在用户计算机上的一个虚拟机内运行单节点 Kubernetes 集群。 你可以使用 Minikube 在学习环境中尝试 Kubernetes.

#### Operator 模式

operator 模式 是一种系统设计, 将 控制器（Controller） 关联到一个或多个自定义资源。 

除了使用作为 Kubernetes 自身一部分的内置控制器之外，你还可以通过 将控制器添加到集群中来扩展 Kubernetes。

如果正在运行的应用程序能够充当控制器并通过 API 访问的方式来执行任务操控 那些在控制平面中定义的自定义资源，这就是一个 operator 模式的示例。

#### QoS 类（QoS Class）

QoS Class（Quality of Service Class）为 Kubernetes 提供了一种将集群中的 Pod 分为几个类型并做出有关调度和驱逐决策的方法。 

Pod 的 QoS 类是基于 Pod 在创建时配置的计算资源请求和限制。QoS 类用于制定有关 Pod 调度和逐出的决策。 Kubernetes 可以为 Pod 分配以下 QoS 类：Guaranteed，Burstable 或者 BestEffort。

#### UID

Kubernetes 系统生成的字符串，唯一标识对象。 

在 Kubernetes 集群的整个生命周期中创建的每个对象都有一个不同的 uid，它旨在区分类似实体的历史事件。

#### 上游（Uptream）

可能指的是：核心 Kubernetes 仓库或作为当前仓库派生来源的仓库。 

- 在 Kubernetes社区：对话中通常使用 upstream 来表示核心 Kubernetes 代码库，也就是更广泛的 kubernetes 生态系统、其他代码或第三方工具所依赖的仓库。 例如，社区成员可能会建议将某个功能特性贡献到 upstream，使其位于核心代码库中，而不是维护于插件或第三方工具中。
- 在 GitHub 或 git 中：约定是将源仓库称为 upstream，而派生的仓库则被视为 downstream。

#### 下游（Downstream）

可以指：Kubernetes 生态系统中依赖于核心 Kubernetes 代码库或分支代码库的代码。 

- 在 Kubernetes 社区中：下游(downstream) 在人们交流中常用来表示那些依赖核心 Kubernetes 代码库的生态系统、代码或者第三方工具。例如，Kubernete 的一个新特性可以被下游(downstream) 应用采用，以提升它们的功能性。
- 在 GitHub 或 git 中：约定用下游(downstream) 表示分支代码库，源代码库被认为是上游(upstream)。

#### 临时容器（Ephemeral Container）

您可以在 Pod 中临时运行的一种 容器（Container） 类型。 

如果想要调查运行中有问题的 Pod，可以向该 Pod 添加一个临时容器并进行诊断。 临时容器没有资源或调度保证，因此不应该使用它们来运行任何部分的工作负荷本身。

#### 事件（Event）

每个 Event 是集群中某处发生的事件的报告。 它通常用来表述系统中的某种状态变化。 

事件的保留时间有限，随着时间推进，其触发方式和消息都可能发生变化。 事件用户不应该对带有给定原因（反映下层触发源）的时间特征有任何依赖， 也不要寄希望于对应该原因的事件会一直存在。

事件应该被视为一种告知性质的、尽力而为的、补充性质的数据。

在 Kubernetes 中，审计 机制会生成一种不同种类的 Event 记录（API 组为 audit.k8s.io）。

#### 云供应商（Cloud Provider）

亦称作:云服务供应商（Cloud Service Provider）
一个提供云计算平台的商业机构或其他组织。 

云供应商，有时也称作云服务供应商（CSPs）提供云计算平台或服务。

很多云供应商提供托管的基础设施（也称作基础设施即服务或 IaaS）。 针对托管的基础设施，云供应商负责服务器、存储和网络，而用户（你） 负责管理其上运行的各层软件，例如运行一个 Kubernetes 集群。

你也会看到 Kubernetes 被作为托管服务提供；有时也称作平台即服务或 PaaS。 针对托管的 Kubernetes，你的云供应商负责 Kubernetes 的控制面以及 节点 及他们所依赖的基础设施： 网络、存储以及其他一些诸如负载均衡器之类的元素。

#### 云原生计算基金会（CNCF）

云原生计算基金会（CNCF）建立了可持续的生态系统，并在围绕着 项目 建立一个社区，将容器编排微服务架构的一部分。 Kubernetes 是一个云原生计算基金会项目. 

云原生计算基金会（CNCF）是 Linux 基金会 的下属基金会。它的使命是让云原生计算无处不在。

#### 云控制器管理器（Cloud Controller Manager）

云控制器管理器是指嵌入特定云的控制逻辑的 控制平面组件。 云控制器管理器使得你可以将你的集群连接到云提供商的 API 之上， 并将与该云平台交互的组件同与你的集群交互的组件分离开来。 

通过分离 Kubernetes 和底层云基础设置之间的互操作性逻辑， 云控制器管理器组件使云提供商能够以不同于 Kubernetes 主项目的 步调发布新特征。

#### 亲和性（Affinity）

在 Kubernetes 中，亲和性（affinity）是一组规则，它们为调度程序提供在何处放置 Pods 提示信息。 

亲和性有两种：

- 节点亲和性
- Pod 间亲和性

这些规则是使用 Kubernetes 标签（label） 和 pods 中指定的 选择算符定义的， 这些规则可以是必需的或首选的，这取决于你希望调度程序执行它们的严格程度。

#### 代理（Proxy）

在计算机领域，代理指的是充当远程服务中介的服务器。 

客户端与代理进行交互；代理将客户端的数据复制到实际服务器；实际服务器回复代理；代理将实际服务器的回复发送给客户端。

kube-proxy 是集群中每个节点上运行的网络代理，实现了部分 Kubernetes 服务（Service） 概念。

你可以将 kube-proxy 作为普通的用户态代理服务运行。 如果你的操作系统支持，则可以在混合模式下运行 kube-proxy；该模式使用较少的系统资源即可达到相同的总体效果。

准入控制器（Admission Controller）

在对象持久化之前拦截 Kubernetes Api 服务器请求的一段代码 

- 

  初始化容器（Init Container）

  应用容器运行前必须先运行完成的一个或多个初始化容器。 

- 

  副本控制器（Replication Controller）

  一种工作管理多副本应用的负载资源，能够确保特定个数的 Pod 实例处于运行状态。 

- 

  动态卷供应（Dynamic Volume Provisioning）

  允许用户请求自动创建存储 卷。 

- 

  卷插件（Volume Plugin）

  卷插件可以让 Pod 集成存储。 

#### 垃圾收集

垃圾收集是 Kubernetes 用于清理集群资源的各种机制的统称。 

Kubernetes 使用垃圾收集机制来清理资源，例如： 未使用的容器和镜像、 失败的 Pod、 目标资源拥有的对象、 已完成的 Job、 过期或出错的资源。

#### 基于角色的访问控制（RBAC）

管理授权决策，允许管理员通过 Kubernetes API 动态配置访问策略。 

#### 安全上下文（Security Context）

securityContext 字段定义 Pod 或 容器的特权和访问控制设置。 

在一个 securityContext 字段中，你可以设置进程所属用户和用户组、权限相关设置。你也可以设置安全策略（例如：SELinux、AppArmor、seccomp）。

PodSpec.securityContext 字段配置会应用到一个 Pod 中的所有的 container 。

#### 容器存储接口（Container Storage Interface，CSI）

容器存储接口 （CSI） 定义了存储系统暴露给容器的标准接口。 

CSI 允许存储驱动提供商为 Kubernetes 创建定制化的存储插件， 而无需将这些插件的代码添加到 Kubernetes 代码仓库（外部插件）。 要使用某个存储提供商的 CSI 驱动，你首先要 将它部署到你的集群上。 然后你才能创建使用该 CSI 驱动的 Storage Class 。

- Kubernetes 文档中关于 CSI 的描述
- 可用的 CSI 驱动列表

#### 容器环境变量（Container Environment Variables）

容器环境变量提供了 name=value 形式的、在 pod 中运行的容器所必须的一些重要信息。 

容器环境变量为运行中的容器化应用提供必要的信息，同时还提供与 容器 重要资源相关的其他信息，例如：文件系统信息、容器自身的信息以及其他像服务端点（Service endpoints）这样的集群资源信息。javascript:void(0))

#### 容器生命周期钩子（Container Lifecycle Hooks）

生命周期钩子暴露容器管理生命周期中的事件，允许用户在事件发生时运行代码。 

#### 容器网络接口（CNI）

容器网络接口 (CNI) 插件是遵循 appc/CNI 协议的一类网络插件。 

#### 容器运行时接口（CRI）

容器运行时接口 (CRI) 是一组与节点上 kubelet 集成的容器运行时 API 

#### 容器运行时（Container Runtime）

容器运行环境是负责运行容器的软件。 

#### 容器（Container）

容器是可移植、可执行的轻量级的镜像，包含其中的软件及其相关依赖。 

#### 容忍度（Toleration）

一个核心对象，由三个必需的属性组成：key、value 和 effect。 容忍度允许将 Pod 调度到具有对应污点 的节点或节点组上。 

#### 对象（Object）

Kubernetes 系统中的实体。Kubernetes API 用这些实体表示集群的状态。 

#### 工作组（Working Group，WG）

工作组是为了方便讨论和（或）推进执行一些短周期、窄范围、或者从委员会和 SIG 分离出来的项目、以及跨 SIG 的活动。 

#### 工作负载（Workload）

工作负载是在 Kubernetes 上运行的应用程序。 

#### 干扰（Disruption）

干扰是指导致一个或者多个 Pod 服务停止的事件。 干扰会影响工作负载资源，比如 Deployment 这种依赖于受影响 Pod 的资源。 

#### 应用开发者（Application Developer）

编写可以在 Kubernetes 集群上运行的应用的人。 

各种容器化应用运行所在的层。

#### 抢占（Preemption）

Kubernetes 中的抢占逻辑通过驱逐节点（Node） 上的低优先级Pod 来帮助悬决的 Pod 找到合适的节点。 

#### 控制器（Controller）

在 Kubernetes 中，控制器通过监控集群 的公共状态，并致力于将当前状态转变为期望的状态。 

控制器（控制平面的一部分） 通过 apiserver 监控你的集群中的公共状态。

其中一些控制器是运行在控制平面内部的，对 Kubernetes 来说，他们提供核心控制操作。 比如：部署控制器（deployment controller）、守护控制器（daemonset controller）、 命名空间控制器（namespace controller）、持久化数据卷控制器（persistent volume controller）（等）都是运行在 kube-controller-manager 中的。

#### 控制平面（Control Plane）

控制平面（Control Plane）是指容器编排层，它暴露 API 和接口来定义、 部署容器和管理容器的生命周期。 

这个编排层是由多个不同的组件组成，例如以下（但不限于）几种：

- etcd
- API 服务器
- 调度器
- 控制器管理器
- 云控制器管理器

这些组件可以以传统的系统服务运行也可以以容器的形式运行.运行这些组件的主机过去称为 master 节点。

#### 控制组（cgroup）

一组具有可选资源隔离、审计和限制的 Linux 进程。 

Cgroup 是一个 Linux 内核特性，对一组进程的资源使用（CPU、内存、磁盘 I/O 和网络等）进行限制、审计和隔离。

#### 数据平面（Data Plane）

提供诸如 CPU，内存，网络和存储的能力，以便容器可以运行并连接到网络。 

#### 日志（Logging）

日志是 集群（cluster） 或应用程序记录的事件列表。 

应用程序和系统日志可以帮助您了解集群内部发生的情况。日志对于调试问题和监视集群活动非常有用。

#### 服务代理（Service Broker）

由第三方提供并维护的一组托管服务的访问端点。 

#### 服务目录（Service Catalog）

服务目录是一种扩展 API，它能让 Kubernetes 集群中运行的应用易于使用外部托管的的软件服务，例如云供应商提供的数据仓库服务。 

#### 污点（Taint）

污点是一种一个核心对象，包含三个必需的属性：key、value 和 effect。 污点会阻止在节点 或节点组上调度 Pods。 

污点和容忍度一起工作， 以确保不会将 Pod 调度到不适合的节点上。 同一节点上可标记一个或多个污点。 节点应该仅调度那些带着能与污点相匹配容忍度的 Pod。

#### 混排切片（Shuffle Sharding）

混排切片（Shuffle Sharding）是指一种将请求指派给队列的技术，其隔离性好过对队列个数哈希取模的方式。 

我们通常会关心不同的请求序列间的相互隔离问题，目的是为了确保密度较高的 请求序列不会湮没密度较低的序列。 将请求放入不同队列的一种简单方法是对请求的某些特征值执行哈希函数， 将结果对队列的个数取模，从而得到要使用的队列的索引。 这一哈希函数使用请求的与其序列相对应的特征作为其输入。例如，在因特网上， 这一特征通常指的是由源地址、目标地址、协议、源端口和目标端口所组成的 五元组。

这种简单的基于哈希的模式有一种特性，高密度的请求序列（流）会湮没那些被 哈希到同一队列的其他低密度请求序列（流）。 为大量的序列提供较好的隔离性需要提供大量的队列，因此是有问题的。 混排切片是一种更为灵活的机制，能够更好地将低密度序列与高密度序列隔离。 混排切片的术语采用了对一叠扑克牌进行洗牌的类比，每个队列可类比成一张牌。 混排切片技术首先对请求的特定于所在序列的特征执行哈希计算，生成一个长度 为十几个二进制位或更长的哈希值。 接下来，用该哈希值作为信息熵的来源，对一叠牌来混排，并对整个一手牌（队列）来洗牌。 最后，对所有处理过的队列进行检查，选择长度最短的已检查队列作为请求的目标队列。 在队列数量适中的时候，检查所有已处理的牌的计算量并不大，对于任一给定的 低密度的请求序列而言，有相当的概率能够消除给定高密度序列的湮没效应。 当队列数量较大时，检查所有已处理队列的操作会比较耗时，低密度请求序列 消除一组高密度请求序列的湮没效应的机会也随之降低。因此，选择队列数目 时要颇为谨慎。

#### 清单（Manifest）

JSON 或 YAML 格式的 Kubernetes API 对象规范。 

清单指定了在应用该清单时 kubernetes 将维护的对象的期望状态。每个配置文件可包含多个清单。

#### 特别兴趣小组（SIG）

共同管理大范畴 Kubernetes 开源项目中某组件或方面的一组社区成员。 

SIG 中的成员对推进某个领域（如体系结构、API 机制构件或者文档）具有相同的兴趣。 SIGs 必须遵从 governance guidelines 的规定， 不过可以有自己的贡献策略以及通信渠道（方式）。

更多的详细信息可参阅 kubernetes/community 仓库以及 SIGs 和工作组（Working Groups）的最新列表。

#### 用户名字空间

用来模拟 root 用户的内核功能特性。用来支持“Rootless 容器”。 

用户名字空间（User Namespace）是一种 Linux 内核功能特性，允许非 root 用户 模拟超级用户（"root"）的特权，例如用来运行容器却不必成为容器之外的超级用户。

用户名字空间对于缓解因潜在的容器逃逸攻击而言是有效的。

在用户名字空间语境中，名字空间是 Linux 内核的功能特性而不是 Kubernetes 意义上的 名字空间概念。

#### 端点（Endpoints）

端点负责记录与服务的选择器相匹配的 Pods 的 IP 地址。 

端点可以手动配置到服务（Service）上，而不必指定选择器标识。

EndpointSlice提供了一种可伸缩、可扩展的替代方案。

#### 网络策略

网络策略是一种规范，规定了允许 Pod 组之间、Pod 与其他网络端点之间以怎样的方式进行通信。 

网络策略帮助您声明式地配置允许哪些 Pod 之间接、哪些命名空间之间允许进行通信，并具体配置了哪些端口号来执行各个策略。NetworkPolicy 资源使用标签来选择 Pod，并定义了所选 Pod 可以接受什么样的流量。网络策略由网络提供商提供的并被 Kubernetes 支持的网络插件实现。请注意，当没有控制器实现网络资源时，创建网络资源将不会生效。

#### 聚合层（Aggregation Layer）

聚合层允许您在自己的集群上安装额外的 Kubernetes 风格的 API。 

当您配置了 Kubernetes API Server 来 支持额外的 API，您就可以在 Kubernetes API 中增加 APIService 对象来 "申领（Claim）" 一个 URL 路径。

#### 节点压力驱逐

亦称作:kubelet eviction
节点压力驱逐是 kubelet 主动终止 Pod 以回收节点上资源的过程。 

kubelet 监控集群节点上的 CPU、内存、磁盘空间和文件系统 inode 等资源。 当这些资源中的一个或多个达到特定消耗水平时， kubelet 可以主动使节点上的一个或多个 Pod 失效，以回收资源并防止饥饿。

节点压力驱逐不用于 API 发起的驱逐。

#### 设备插件（Device Plugin）

设备插件工作在节点主机上，给 Pods 提供访问资源的权限，比如特定厂商初始化或者安装的本地硬件。 

设备插件将资源告知 kubelet ，以便相关节点上运行的工作负载Pod可以访问硬件功能。

更多信息请查阅设备插件

#### 证书（Certificate）

证书是个安全加密文件，用来确认对 Kubernetes 集群访问的合法性。 

证书可以让 Kubernetes 集群中运行的应用程序安全的访问 Kubernetes API。证书可以确认客户端是否被允许访问 API。

#### 资源配额（Resource Quotas）

资源配额提供了限制每个 命名空间 的资源消耗总和的约束。 

限制了命名空间中每种对象可以创建的数量，也限制了项目中可被资源对象利用的计算资源总数。

#### 选择算符（Selector）

选择算符允许用户通过标签（labels）对一组资源对象进行筛选过滤。 

在查询资源列表时，选择算符可以通过标签对资源进行过滤筛选。

#### 量纲（Quantity）

使用全数字来表示较小数值或使用 SI 后缀表示较大数值的表示法。 

量纲是使用紧凑的全数字表示法来表示小数值或带有国际计量单位制（SI） 的大数值的表示法。 小数用 milli 单位表示，而大数用 kilo、mega 或 giga 单位表示。

例如，数字 1.5 表示为 1500m， 而数字 1000 表示为 1k，1000000 表示为 1M。 你还可以指定二进制表示法后缀；数字 2048 可以写成 2Ki。

公认的十进制（10 的幂数）单位是 m（milli）、k（kilo，有意小写）、 M（mega）、G（giga）、T（terra）、P（peta）、E（exa）。

公认的二进制（2 的幂数）单位是 Ki (kibi)、Mi (mebi)、Gi (gibi)、 Ti (tebi)、 Pi (pebi)、 Ei (exbi)

#### 镜像（Image）

镜像是保存的容器实例，它打包了应用运行所需的一组软件。 

镜像是软件打包的一种方式，可以将镜像存储在容器镜像仓库、拉取到本地系统并作为应用来运行。 镜像中包含的元数据指明了运行什么可执行程序、是由谁构建的以及其他信息。javascript:void(0))

安装附加组件 阐释了更多关于如何在集群内使用附加组件，并列出了一些流行的附加组件。

#### 集群（Cluster）

集群由一组被称作节点的机器组成。这些节点上运行 Kubernetes 所管理的容器化应用。集群具有至少一个工作节点。 

工作节点托管作为应用负载的组件的 Pod 。控制平面管理集群中的工作节点和 Pod 。 为集群提供故障转移和高可用性，这些控制平面一般跨多主机运行，集群跨多个节点运行。

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