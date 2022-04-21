---
title: Flink必知必会（万字长文）
tags:
  - Flink
  - 流计算
categories:
  - 大数据
toc: true
date: 2022-04-13 15:11:05

---

## 应用开发

### 基本概念

Flink提供了不同的抽象级别以开发流式或者批处理应用程序

<img src="images/levels_of_abstraction.svg" alt="Programming levels of abstraction" style="zoom:67%;" />

- **Stateful Stream Processing** 最低级的抽象接口是状态化的数据流接口（stateful streaming）。这个接口是通过 ProcessFunction 集成到 DataStream API 中的。该接口允许用户自由的处理来自一个或多个流中的事件，并使用一致的容错状态。另外，用户也可以通过注册 event time 和 processing time 处理回调函数的方法来实现复杂的计算

- **DataStream/DataSet API** DataStream / DataSet API 是 Flink 提供的核心 API ，DataSet 处理有界的数据集，DataStream 处理有界或者无界的数据流。用户可以通过各种方法（map / flatmap / window / keyby / sum / max / min / avg / join 等）将数据进行转换 / 计算

- **Table API**  Table API 提供了例如 select、project、join、group-by、aggregate 等操作，使用起来却更加简洁,可以在表与 **DataStream/DataSet 之间无缝切换**，也允许程序将 Table API 与 DataStream 以及 DataSet 混合使用
- **SQL** Flink 提供的最高层级的抽象是 SQL 。这一层抽象在语法与表达能力上与 Table API 类似。SQL 抽象与 Table API 交互密切，同时 SQL 查询可以直接在 Table API 定义的表上执行

### DataStream API

#### 执行模式（流/批）

##### 如何选择

> 说明：表中的边界是输入数据源的属性，StateBackend用于控制状态的存储方式和检查点的工作方式
>
> | 执行模式 | 场景                                     | StateBackend | 网络 Shuffle | 滚动操作          |
> | -------- | ---------------------------------------- | ------------ | ------------ | ----------------- |
> | 流       | 既可用于有边界任务，也可用于无边界任务。 | 有           | 流水线式     | 是                |
> | 批       | 只能执行无边界任务                       | 无           | 分成三个任务 | 否 sum() reduce() |

##### 如何配置

> 执行模式可以通过 `execute.runtime-mode` 设置来配置。有三种可选的值：
>
> - `STREAMING`: 经典 DataStream 执行模式（默认)
> - `BATCH`: 在 DataStream API 上进行批量式执行
> - `AUTOMATIC`: 让系统根据数据源的边界性来决定
>
> 下面是如何通过命令行配置执行模式（建议使用，更加灵活）：
>
> ```bash
> $ bin/flink run -Dexecution.runtime-mode=BATCH examples/streaming/WordCount.jar
> ```
>
> 这个例子展示了如何在代码中配置执行模式：
>
> ```java
> StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
> env.setRuntimeMode(RuntimeExecutionMode.BATCH);
> ```

##### 修改并行度

以下四种设置并行度的方式，按优先级依次递减

1. 在算子上设置

   ```
   val wordStream = initStream.flatMap(_.split(" ")).setParallelism(2)
   ```

2. 在上下文环境中设置

   ```
   val env = StreamExecutionEnvironment.getExecutionEnvironment
   env.setParallelism(1)
   ```

3. client提交Job时设置

   ```
   flink run -c com.msb.stream.WordCount -p 3 StudyFlink-1.0-SNAPSHOT.jar
   ```

4. 在flink-conf.yaml配置文件中设置

   ```
   parallelism.default: 1
   ```

   

#### Time

![img](images/times_clocks.svg)

##### IngestionTime

数据进入Flink的时间，记录被Source节点观察到的系统时间

##### EventTime

当使用的是EventTime时，和输入数据的速度没有关系，只和实验中指定的时间戳大小有关。

> ```scala
> object window_eventtime {
>   def main(args: Array[String]): Unit = {
>     val env = StreamExecutionEnvironment.getExecutionEnvironment
>     env.setParallelism(1)
>     env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime)
>     val inputStream = env.socketTextStream("localhost",7777)
>     val resultStream = inputStream
>       .map(data =>{
>         val arr = data.split(",")
>         sensorReading(arr(0),arr(1).toLong,arr(2).toDouble)
>       })
>       .assignAscendingTimestamps(_.timestamp * 1000)
>       .assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor
>                                      [sensorReading](Time.seconds(3)) {
>         override def extractTimestamp(element: sensorReading): Long = element.timestamp * 1000L
>       } )
>       .keyBy(_.id)
>       .timeWindow(Time.seconds(15))
>       .reduce((data1,data2)
>               =>sensorReading(data1.id,data2.timestamp,data1.temperature.min(data2.temperature)))
>       .map(data =>(data,new Date().getTime))
>     resultStream.print()
>     env.execute("window_eventtime test")
>   }
> ```

##### ProcessingTime

当使用的是ProcessingTime时，在同一个window里有多少条数据，和测试代码时在该window的时间内输入的代码条数有关，最后一列的时间戳可看出窗口大小15秒。

> ```scala
> object window_processingtime {
>   def main(args: Array[String]): Unit = {
>     val env = StreamExecutionEnvironment.getExecutionEnvironment
>     env.setParallelism(1)
>     val inputStream = env.socketTextStream("localhost",7777)
>     val resultStream = inputStream
>       .map(data =>{
>         val arr = data.split(",")
>         sensorReading(arr(0),arr(1).toLong,arr(2).toDouble)
>       })
>       .keyBy(_.id)
>       .timeWindow(Time.seconds(15))
>       .reduce((data1,data2)
>               =>sensorReading(data1.id,data2.timestamp,data1.temperature.min(data2.temperature)))
>       .map(data =>(data,new Date().getTime))
>     resultStream.print()
>     env.execute("window_processingtime test")
>   }
> }
> ```

##### WatermarkStrategy

为了使EventTime正常工作，Flink需要从数据流中提取时间戳作为EventTime，

> ```java
> final StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
> DataStream<MyEvent> stream = env.readFile(
>         myFormat, myFilePath, FileProcessingMode.PROCESS_CONTINUOUSLY, 100,
>         FilePathFilter.createDefaultFilter(), typeInfo);
> DataStream<MyEvent> withTimestampsAndWatermarks = stream
>         .filter(event -> event.severity() == WARNING)
>         .assignTimestampsAndWatermarks(WatermarkStrategy
>         			.<Tuple2<Long, String>>forBoundedOutOfOrderness(Duration.ofSeconds(20))                       
>               .withIdleness(Duration.ofMinutes(1))           // 如果没有数据时的               
>         			.withTimestampAssigner((event, timestamp) -> event.f0); // 指定字段
>          );
> withTimestampsAndWatermarks
>         .keyBy( (event) -> event.getGroup() )
>         .window(TumblingEventTimeWindows.of(Time.seconds(10)))
>         .reduce( (a, b) -> a.add(b) )
>         .addSink(...);
> ```

内置Watermark生成策略：

> ```java
> // 单调递增时间分配器
> WatermarkStrategy.forMonotonousTimestamps();
> // Fixed Amount of Lateness
> WatermarkStrategy.forBoundedOutOfOrderness(Duration.ofSeconds(10));
> ```

##### AllowedLateness

基于Event-Time的窗口处理流式数据，虽然提供了Watermark机制，却只能在一定程度上解决了数据乱序的问题。但在某些情况下数据可能延时会非常严重，即使通过Watermark机制也无法等到数据全部进入窗口再进行处理。Flink中默认会将这些迟到的数据做丢弃处理，但是有些时候用户希望即使数据延迟并不是很严重的情况下，也能继续窗口计算，不希望对于数据延迟比较严重的数据混入正常的计算流程中，此时就需要使用Allowed Lateness机制来对迟到的数据进行额外的处理。

举例：

例如用户大屏数据展示系统，即使正常的窗口中没有将迟到的数据进行统计，但为了保证页面数据显示的连续性，后来接入到系统中迟到比较严重的数据所统计出来的结果不希望显示在屏幕上，而是将延时数据和结果存储到数据库中，便于后期对延时数据进行分析。对于这种情况需要借助Side Output来处理，通过使用sideOutputLateData（OutputTag）来标记迟到数据计算的结果，然后使用getSideOutput（lateOutputTag）从窗口结果中获取lateOutputTag标签对应的数据，之后转成独立的DataStream数据集进行处理，创建late-data的OutputTag，再通过该标签从窗口结果中将迟到数据筛选出来

Flink默认当窗口计算完毕后，窗口元素数据及状态会被清空，但是使用AllowedLateness，可以延迟清除窗口元素数据及状态，以便于当延迟数据到来的时候，能够重新计算当前窗口

Watermark 2s    AllowedLateness 3s

```
10000 hello
11000 spark
14000 flink
15000 hadoop 此时窗口并不会计算，因为Watermark设为2s  此时的watermark是13000  窗口范围10000-15000
17000 sqoop  此时窗口会被计算  默认：窗口计算完毕，窗口数据全部会被清空
12000 flume  此时窗口重新计算（10000-15000），因为开启了AllowedLateness 3s，当watermark>=window end+ AllowedLateness 3s 窗口数据及状态才会被清除掉，此时的watermark是15000
20000 scala  此时上一个窗口（10000-15000）的数据及状态会被清空
12000 hdfs   此时窗口不会重新计算，因为现在watermark是18000>=15000+3000,12000数据是迟到非常严重的数据，会被放入到侧输出流中

本来10000-15000的窗口，在15000的时候会计算，但是由于Watermark 的原因，等待了2s  17000的时候才会计算，又因为AllowedLateness 3s的原因，10000-15000的窗口会被保存3s（注意这是eventtime时间语义），直到20000出现，才会被删除，所以在20000没有出现之前，凡是事件时间在10000-15000的数据都会重新进行窗口计算

超过5s的数据，称之为迟到非常严重的数据，放入到侧输出流
5s以内的数据，称之为迟到不严重的数据，窗口重新计算
```

```scala
import org.apache.flink.streaming.api.TimeCharacteristic
import org.apache.flink.streaming.api.functions.ProcessFunction
import org.apache.flink.streaming.api.functions.timestamps.BoundedOutOfOrdernessTimestampExtractor
import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.api.scala.function.ProcessAllWindowFunction
import org.apache.flink.streaming.api.windowing.time.Time
import org.apache.flink.streaming.api.windowing.windows.TimeWindow
import org.apache.flink.util.Collector

object Allowlatest {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment
    env.setStreamTimeCharacteristic(TimeCharacteristic.EventTime)
    env.setParallelism(1)
    val stream = env.socketTextStream("node01",8888)
    var lateTag =new OutputTag[(Long,String)]("late")
    val value = stream.map(x => {
      val strings = x.split(" ")
      (strings(0).toLong, strings(1))
    }).assignTimestampsAndWatermarks(new BoundedOutOfOrdernessTimestampExtractor[(Long, String)](Time.seconds(2)) {
      override def extractTimestamp(element: (Long, String)): Long = element._1
    }).timeWindowAll(Time.seconds(5))
      .allowedLateness(Time.seconds(3))
      .sideOutputLateData(lateTag)
      .process(new ProcessAllWindowFunction[(Long, String), (Long, String), TimeWindow] {
        override def process(context: Context, elements: Iterable[(Long, String)], out: Collector[(Long, String)]): Unit = {
          println(context.window.getStart + "---" + context.window.getEnd)
          for (elem <- elements) {
            out.collect(elem)
          }
        }
      })
    value.print("main")
    value.getSideOutput(lateTag).print("late")
    env.execute()
  }
}
```

问题1：使用AllowedLateness 方法是不是会降低flink计算的吞吐量？ 

> 是的

问题2：直接watermark设置为5 不是也可以代替这一通操作嘛？ 

> 不能代替，watermark设置为5的话，允许延迟5s，每次处理过去5s的窗口数据，延迟比较高，如果使用这通操作，每次处理过去2s的数据，实时性比较高，当有新的延迟数据，即时计算，对于计算实时性比较高的场景还得使用这一通操作

问题3：watermark（5s）+滑动窗口（滑动间隔2s）能够实现这通计算？ 不行

> 案例：每隔5s统计各个卡口最近5s的车流量（滑动窗口），计算实时性小于2（ps：当10s的数据来了，8s之前的数据必须处理完），允许数据延迟5s，数据延迟超过5s的数据放入到侧输出流中

问题4：延时后如果仍有数据超时收到该如何处理？

> 使用旁路输出手工处理

#### 状态及容错

##### 状态处理

- Keyed DataStream

> Keyed DataStream需要指定一个字段对DataStream进行partition
>
> ```java
> // some ordinary POJO
> public class WC {
>   public String word;
>   public int count;
>   public String getWord() { return word; }
> }
> DataStream<WC> words = // [...]
> KeyedStream<WC> keyed = words.keyBy(WC::getWord);
> ```

- Keyed DataStream 的使用

  > The available state primitives are:
  >
  > - `ValueState<T>`: This keeps a value that can be updated and retrieved (scoped to key of the input element as mentioned above, so there will possibly be one value for each key that the operation sees). The value can be set using `update(T)` and retrieved using `T value()`.
  > - `ListState<T>`: This keeps a list of elements. You can append elements and retrieve an `Iterable` over all currently stored elements. Elements are added using `add(T)` or `addAll(List<T>)`, the Iterable can be retrieved using `Iterable<T> get()`. You can also override the existing list with `update(List<T>)`
  > - `ReducingState<T>`: This keeps a single value that represents the aggregation of all values added to the state. The interface is similar to `ListState` but elements added using `add(T)` are reduced to an aggregate using a specified `ReduceFunction`.
  > - `AggregatingState<IN, OUT>`: This keeps a single value that represents the aggregation of all values added to the state. Contrary to `ReducingState`, the aggregate type may be different from the type of elements that are added to the state. The interface is the same as for `ListState` but elements added using `add(IN)` are aggregated using a specified `AggregateFunction`.
  > - `MapState<UK, UV>`: This keeps a list of mappings. You can put key-value pairs into the state and retrieve an `Iterable` over all currently stored mappings. Mappings are added using `put(UK, UV)` or `putAll(Map<UK, UV>)`. The value associated with a user key can be retrieved using `get(UK)`. The iterable views for mappings, keys and values can be retrieved using `entries()`, `keys()` and `values()` respectively. You can also use `isEmpty()` to check whether this map contains any key-value mappings.
  >
  > ```java
  > public class CountWindowAverage extends RichFlatMapFunction<Tuple2<Long, Long>, Tuple2<Long, Long>> {
  >     /**
  >      * The ValueState handle. The first field is the count, the second field a running sum.
  >      */
  >     private transient ValueState<Tuple2<Long, Long>> sum;
  >     @Override
  >     public void flatMap(Tuple2<Long, Long> input, Collector<Tuple2<Long, Long>> out)  {
  >         // access the state value
  >         Tuple2<Long, Long> currentSum = sum.value();
  >         // update the count
  >         currentSum.f0 += 1;
  >         // add the second field of the input value
  >         currentSum.f1 += input.f1;
  >         // update the state
  >         sum.update(currentSum);
  >         // if the count reaches 2, emit the average and clear the state
  >         if (currentSum.f0 >= 2) {
  >             out.collect(new Tuple2<>(input.f0, currentSum.f1 / currentSum.f0));
  >             sum.clear();
  >         }
  >     }
  >     @Override
  >     public void open(Configuration config) {
  >         ValueStateDescriptor<Tuple2<Long, Long>> descriptor =
  >                 new ValueStateDescriptor<>(
  >                         "average", // the state name
  >           							 // type information
  >                         TypeInformation.of(new TypeHint<Tuple2<Long, Long>>() {}), 
  >                         Tuple2.of(0L, 0L)); // default value of the state, if nothing was set
  >         sum = getRuntimeContext().getState(descriptor);
  >     }
  > }
  > // this can be used in a streaming program like this (assuming we have a StreamExecutionEnvironment env)
  > env.fromElements(Tuple2.of(1L, 3L), Tuple2.of(1L, 5L), Tuple2.of(1L, 7L), Tuple2.of(1L, 4L), Tuple2.of(1L, 2L))
  >         .keyBy(value -> value.f0)
  >         .flatMap(new CountWindowAverage())
  >         .print();
  > // the printed output will be (1,4) and (1,5)
  > ```

##### 状态的生存期

A *time-to-live* (TTL) can be assigned to the keyed state of any type. If a TTL is configured and a state value has expired, the stored value will be cleaned up on a best effort basis which is discussed in more detail below.

All state collection types support per-entry TTLs. This means that list elements and map entries expire independently.

In order to use state TTL one must first build a `StateTtlConfig` configuration object. The TTL functionality can then be enabled in any state descriptor by passing the configuration:

> ```java
> StateTtlConfig ttlConfig = StateTtlConfig
>     .newBuilder(Time.seconds(1))
>     .setUpdateType(StateTtlConfig.UpdateType.OnCreateAndWrite)
>     .setStateVisibility(StateTtlConfig.StateVisibility.NeverReturnExpired)
>     .build();
>     
> ValueStateDescriptor<String> stateDescriptor = new ValueStateDescriptor<>("text state", String.class);
> stateDescriptor.enableTimeToLive(ttlConfig);
> ```

#### DataSource

##### 概念介绍

一些比较基本的 Source 和 Sink 已经内置在 Flink 里。 预定义 data sources 支持从文件、目录、socket，以及 collections 和 iterators 中读取数据。 预定义 data sinks 支持把数据写入文件、标准输出（stdout）、标准错误输出（stderr）和 socket。

更多Connectors：https://nightlies.apache.org/flink/flink-docs-release-1.14/zh/docs/connectors/datastream/overview/

##### File Source

- 通过读取本地、HDFS文件创建一个数据源

如果读取的是HDFS上的文件，那么需要导入Hadoop依赖

```xml
<dependency>
	<groupId>org.apache.hadoop</groupId>
	<artifactId>hadoop-client</artifactId>
	<version>2.6.5</version>
</dependency>
```

代码：

```scala
import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
//在算子转换的时候，会将数据转换成Flink内置的数据类型，所以需要将隐式转换导入进来，才能自动进行类型转换
import org.apache.flink.streaming.api.scala._

object FileSource {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment
    val textStream = env.readTextFile("hdfs://node01:9000/flink/data/wc")
    textStream.flatMap(_.split(" ")).map((_,1)).keyBy(0).sum(1).print()
    //读完就停止
    env.execute()
  }
}
```

- 每隔10s中读取HDFS指定目录下的新增文件内容，并且进行WordCount

  业务场景：在企业中一般都会做实时的ETL，当Flume采集来新的数据，那么基于Flink实时做ETL入仓

```scala
import org.apache.flink.api.java.io.TextInputFormat
import org.apache.flink.core.fs.Path
import org.apache.flink.streaming.api.functions.source.FileProcessingMode
import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
//在算子转换的时候，会将数据转换成Flink内置的数据类型，所以需要将隐式转换导入进来，才能自动进行类型转换
import org.apache.flink.streaming.api.scala._

object FileSource {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment
    //读取hdfs文件
    val filePath = "hdfs://node01:9000/flink/data/"
    val textInputFormat = new TextInputFormat(new Path(filePath))
    //每隔10s中读取 hdfs上新增文件内容
    val textStream = env.readFile(textInputFormat,filePath,FileProcessingMode.PROCESS_CONTINUOUSLY,10)
//    val textStream = env.readTextFile("hdfs://node01:9000/flink/data/wc")
    textStream.flatMap(_.split(" ")).map((_,1)).keyBy(0).sum(1).print()
    env.execute()
  }
}
```

**readTextFile底层调用的就是readFile方法，readFile是一个更加底层的方式，使用起来会更加的灵活**

##### Collection Source

基于本地集合的数据源，一般用于测试场景，没有太大意义

```scala
import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
import org.apache.flink.streaming.api.scala._

object CollectionSource {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment
    val stream = env.fromCollection(List("hello flink msb","hello msb msb"))
    stream.flatMap(_.split(" ")).map((_,1)).keyBy(0).sum(1).print()
    env.execute()
  }
}
```

##### Socket Source

接受Socket Server中的数据，已经讲过

```scala
val initStream:DataStream[String] = env.socketTextStream("node01",8888)
```

##### Kafka Source

Flink接受Kafka中的数据，首先先配置flink与kafka的连接器依赖

官网地址：https://ci.apache.org/projects/flink/flink-docs-release-1.9/dev/connectors/kafka.html

maven依赖

```xml
<dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-connector-kafka_2.11</artifactId>
  <version>1.9.2</version>
</dependency>
```

代码：

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
    val prop = new Properties()
    prop.setProperty("bootstrap.servers","node01:9092,node02:9092,node03:9092")
    prop.setProperty("group.id","flink-kafka-id001")
    prop.setProperty("key.deserializer",classOf[StringDeserializer].getName)
    prop.setProperty("value.deserializer",classOf[StringDeserializer].getName)
    /**
      * earliest:从头开始消费，旧数据会频繁消费
      * latest:从最近的数据开始消费，不再消费旧数据
      */
    prop.setProperty("auto.offset.reset","latest")

    val kafkaStream = env.addSource(new FlinkKafkaConsumer[(String, String)]("flink-kafka", new KafkaDeserializationSchema[(String, String)] {
      override def isEndOfStream(t: (String, String)): Boolean = false

      override def deserialize(consumerRecord: ConsumerRecord[Array[Byte], Array[Byte]]): (String, String) = {
        val key = new String(consumerRecord.key(), "UTF-8")
        val value = new String(consumerRecord.value(), "UTF-8")
        (key, value)
      }
      //指定返回数据类型
      override def getProducedType: TypeInformation[(String, String)] =
        createTuple2TypeInformation(createTypeInformation[String], createTypeInformation[String])
    }, prop))
    kafkaStream.print()
    env.execute()
```

kafka命令消费key value值

kafka-console-consumer.sh --zookeeper node01:2181 --topic flink-kafka --property print.key=true

默认只是消费value值

KafkaDeserializationSchema：读取kafka中key、value

SimpleStringSchema：读取kafka中value

##### Custom Source

Sources are where your program reads its input from. You can attach a source to your program by using `StreamExecutionEnvironment.addSource(sourceFunction)`. Flink comes with a number of pre-implemented source functions, but you can always write your own custom sources by implementing the `SourceFunction` for non-parallel sources, or by implementing the `ParallelSourceFunction` interface or extending the `RichParallelSourceFunction` for parallel sources.

- 基于SourceFunction接口实现单并行度数据源

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
    //source的并行度为1 单并行度source源
    val stream = env.addSource(new SourceFunction[String] {
      var flag = true
      override def run(ctx: SourceFunction.SourceContext[String]): Unit = {
        val random = new Random()
        while (flag) {
          ctx.collect("hello" + random.nextInt(1000))
          Thread.sleep(200)
        }
      }
      //停止产生数据
      override def cancel(): Unit = flag = false
    })
    stream.print()
    env.execute()
```

基于ParallelSourceFunction接口实现多并行度数据源

  ```scala
public interface ParallelSourceFunction<OUT> extends SourceFunction<OUT> {}
  ```

  ```scala
public abstract class RichParallelSourceFunction<OUT> extends AbstractRichFunction
		implements ParallelSourceFunction<OUT> {
	private static final long serialVersionUID = 1L;
}
  ```

实现ParallelSourceFunction接口=继承RichParallelSourceFunction

```scala
    val env = StreamExecutionEnvironment.getExecutionEnvironment
    val sourceStream = env.addSource(new ParallelSourceFunction[String] {
      var flag = true

      override def run(ctx: SourceFunction.SourceContext[String]): Unit = {
        val random = new Random()
        while (flag) {
          ctx.collect("hello" + random.nextInt(1000))
          Thread.sleep(500)
        }
      }

      override def cancel(): Unit = {
        flag = false
      }
    }).setParallelism(2)
```

数据源可以设置为多并行度

#### Transformation

Transformations算子可以将一个或者多个算子转换成一个新的数据流，使用Transformations算子组合可以进行复杂的业务处理

##### Map

DataStream → DataStream

遍历数据流中的每一个元素，产生一个新的元素

##### FlatMap

DataStream → DataStream

遍历数据流中的每一个元素，产生N个元素 N=0，1，2,......

##### Filter

DataStream → DataStream

过滤算子，根据数据流的元素计算出一个boolean类型的值，true代表保留，false代表过滤掉

##### KeyBy

DataStream → KeyedStream

根据数据流中指定的字段来分区，相同指定字段值的数据一定是在同一个分区中，内部分区使用的是HashPartitioner

指定分区字段的方式有三种：

```scala
1、根据索引号指定
2、通过匿名函数来指定
3、通过实现KeySelector接口  指定分区字段

	val env = StreamExecutionEnvironment.getExecutionEnvironment
    val stream = env.generateSequence(1, 100)
    stream
      .map(x => (x % 3, 1))
      //根据索引号来指定分区字段
      //      .keyBy(0)
      //通过传入匿名函数 指定分区字段
      //      .keyBy(x=>x._1)
      //通过实现KeySelector接口  指定分区字段
      .keyBy(new KeySelector[(Long, Int), Long] {
      override def getKey(value: (Long, Int)): Long = value._1
    })
      .sum(1)
      .print()
    env.execute()
```

##### Reduce

KeyedStream：根据key分组 → DataStream

注意，reduce是基于分区后的流对象进行聚合，也就是说，DataStream类型的对象无法调用reduce方法

```scala
.reduce((v1,v2) => (v1._1,v1._2 + v2._2))
```

demo01：读取kafka数据，实时统计各个卡口下的车流量

- 实现kafka生产者，读取卡口数据并且往kafka中生产数据

```scala
 	val prop = new Properties()
    prop.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    prop.setProperty("key.serializer", classOf[StringSerializer].getName)
    prop.setProperty("value.serializer", classOf[StringSerializer].getName)

    val producer = new KafkaProducer[String, String](prop)

    val iterator = Source.fromFile("data/carFlow_all_column_test.txt", "UTF-8").getLines()
    for (i <- 1 to 100) {
      for (line <- iterator) {
        //将需要的字段值 生产到kafka集群  car_id monitor_id event-time speed
        //车牌号 卡口号 车辆通过时间 通过速度
        val splits = line.split(",")
        val monitorID = splits(0).replace("'","")
        val car_id = splits(2).replace("'","")
        val eventTime = splits(4).replace("'","")
        val speed = splits(6).replace("'","")
        if (!"00000000".equals(car_id)) {
          val event = new StringBuilder
          event.append(monitorID + "\t").append(car_id+"\t").append(eventTime + "\t").append(speed)
          producer.send(new ProducerRecord[String, String]("flink-kafka", event.toString()))
        }

        Thread.sleep(500)
      }
    }
```

- 实现代码

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
    val props = new Properties()
    props.setProperty("bootstrap.servers","node01:9092,node02:9092,node03:9092")
    props.setProperty("key.deserializer",classOf[StringDeserializer].getName)
    props.setProperty("value.deserializer",classOf[StringDeserializer].getName)
    props.setProperty("group.id","flink001")
    props.getProperty("auto.offset.reset","latest")

    val stream = env.addSource(new FlinkKafkaConsumer[String]("flink-kafka", new SimpleStringSchema(),props))
    stream.map(data => {
      val splits = data.split("\t")
      val carFlow = CarFlow(splits(0),splits(1),splits(2),splits(3).toDouble)
      (carFlow,1)
    }).keyBy(_._1.monitorId)
        .sum(1)
        .print()
    env.execute()
```

##### Aggregations

KeyedStream → DataStream

Aggregations代表的是一类聚合算子，具体算子如下：

```scala
keyedStream.sum(0)
keyedStream.sum("key")
keyedStream.min(0)
keyedStream.min("key")
keyedStream.max(0)
keyedStream.max("key")
keyedStream.minBy(0)
keyedStream.minBy("key")
keyedStream.maxBy(0)
keyedStream.maxBy("key")
```

demo02：实时统计各个卡口最先通过的汽车的信息

```scala
val stream = env.addSource(new FlinkKafkaConsumer[String]("flink-kafka", new SimpleStringSchema(),props))
    stream.map(data => {
      val splits = data.split("\t")
      val carFlow = CarFlow(splits(0),splits(1),splits(2),splits(3).toDouble)
      val eventTime = carFlow.eventTime
      val format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
      val date = format.parse(eventTime)
      (carFlow,date.getTime)
    }).keyBy(_._1.monitorId)
        .min(1)
        .map(_._1)
        .print()
    env.execute()
```

##### Union 真合并

**DataStream*** → DataStream

Union of two or more data streams creating a new stream containing all the elements from all the streams

合并两个或者更多的数据流产生一个新的数据流，这个新的数据流中包含了所合并的数据流的元素

注意：需要保证数据流中元素类型一致

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
    val ds1 = env.fromCollection(List(("a",1),("b",2),("c",3)))
    val ds2 = env.fromCollection(List(("d",4),("e",5),("f",6)))
    val ds3 = env.fromCollection(List(("g",7),("h",8)))
//    val ds3 = env.fromCollection(List((1,1),(2,2)))
    val unionStream = ds1.union(ds2,ds3)
    unionStream.print()
    env.execute()
```

##### Connect 假合并

DataStream,DataStream → ConnectedStreams

合并两个数据流并且保留两个数据流的数据类型，能够共享两个流的状态

```scala
val ds1 = env.socketTextStream("node01", 8888)
val ds2 = env.socketTextStream("node01", 9999)
val wcStream1 = ds1.flatMap(_.split(" ")).map((_, 1)).keyBy(0).sum(1)
val wcStream2 = ds2.flatMap(_.split(" ")).map((_, 1)).keyBy(0).sum(1)
val restStream: ConnectedStreams[(String, Int), (String, Int)] = wcStream2.connect(wcStream1)
```

##### CoMap & CoFlatMap

ConnectedStreams → DataStream

CoMap, CoFlatMap并不是具体算子名字，而是一类操作名称

凡是基于ConnectedStreams数据流做map遍历，这类操作叫做CoMap

凡是基于ConnectedStreams数据流做flatMap遍历，这类操作叫做CoFlatMap

**CoMap第一种实现方式：**

```scala
restStream.map(new CoMapFunction[(String,Int),(String,Int),(String,Int)] {
      //对第一个数据流做计算
      override def map1(value: (String, Int)): (String, Int) = {
        (value._1+":first",value._2+100)
      }
      //对第二个数据流做计算
      override def map2(value: (String, Int)): (String, Int) = {
        (value._1+":second",value._2*100)
      }
    }).print()
```

**CoMap第二种实现方式：**

```scala
restStream.map(
      //对第一个数据流做计算
      x=>{(x._1+":first",x._2+100)}
      //对第二个数据流做计算
      ,y=>{(y._1+":second",y._2*100)}
    ).print()
```

**CoFlatMap第一种实现方式：**

```scala
ds1.connect(ds2).flatMap((x,c:Collector[String])=>{
      //对第一个数据流做计算
      x.split(" ").foreach(w=>{
        c.collect(w)
      })

    }
      //对第二个数据流做计算
      ,(y,c:Collector[String])=>{
      y.split(" ").foreach(d=>{
        c.collect(d)
      })
    }).print
```

**CoFlatMap第二种实现方式：**

```scala
 ds1.connect(ds2).flatMap(
      //对第一个数据流做计算
      x=>{
      x.split(" ")
    }
      //对第二个数据流做计算
      ,y=>{
        y.split(" ")
      }).print()
```

**CoFlatMap第三种实现方式：**

```scala
ds1.connect(ds2).flatMap(new CoFlatMapFunction[String,String,(String,Int)] {
    //对第一个数据流做计算 
    override def flatMap1(value: String, out: Collector[(String, Int)]): Unit = {
        val words = value.split(" ")
        words.foreach(x=>{
          out.collect((x,1))
        })
      }

    //对第二个数据流做计算
    override def flatMap2(value: String, out: Collector[(String, Int)]): Unit = {
        val words = value.split(" ")
        words.foreach(x=>{
          out.collect((x,1))
        })
      }
    }).print()
```

demo03：现有一个配置文件存储车牌号与车主的真实姓名，通过数据流中的车牌号实时匹配出对应的车主姓名（注意：配置文件可能实时改变）

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
env.setParallelism(1)
val filePath = "data/carId2Name"
val carId2NameStream = env.readFile(new TextInputFormat(new Path(filePath)),filePath,FileProcessingMode.PROCESS_CONTINUOUSLY,10)
val dataStream = env.socketTextStream("node01",8888)
dataStream.connect(carId2NameStream).map(new CoMapFunction[String,String,String] {
    private val hashMap = new mutable.HashMap[String,String]()
    override def map1(value: String): String = {
        hashMap.getOrElse(value,"not found name")
    }

    override def map2(value: String): String = {
        val splits = value.split(" ")
        hashMap.put(splits(0),splits(1))
        value + "加载完毕..."
    }
}).print()
env.execute()
此demo仅限深度理解connect算子和CoMap操作，后期还需使用广播流优化
```

##### Split

DataStream → SplitStream

根据条件将一个流分成两个或者更多的流

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
val stream = env.generateSequence(1,100)
val splitStream = stream.split(
    d => {
        d % 2 match {
            case 0 => List("even")
            case 1 => List("odd")
        }
    }
)
splitStream.select("even").print()
env.execute()
```

```
@deprecated Please use side output instead
```

##### Select

SplitStream → DataStream

从SplitStream中选择一个或者多个数据流

```scala
splitStream.select("even").print()
```

##### Side Output侧输出流

流计算过程，可能遇到根据不同的条件来分隔数据流。filter分割造成不必要的数据复制

```scala
	val env = StreamExecutionEnvironment.getExecutionEnvironment
    val stream = env.socketTextStream("node01",8888)
    val gtTag = new OutputTag[String]("gt")
    val processStream = stream.process(new ProcessFunction[String, String] {
      override def processElement(value: String, ctx: ProcessFunction[String, String]#Context, out: Collector[String]): Unit = {
        try {
          val longVar = value.toLong
          if (longVar > 100) {
            out.collect(value)
          } else {
            ctx.output(gtTag, value)
          }
        } catch {
          case e => e.getMessage
            ctx.output(gtTag, value)
        }
      }
    })
    val sideStream = processStream.getSideOutput(gtTag)
    sideStream.print("sideStream")
    processStream.print("mainStream")
    env.execute()
```

##### IterateStream【重要】

DataStream → IterativeStream → DataStream

Iterate算子提供了对数据流迭代的支持

迭代由两部分组成：迭代体、终止迭代条件

不满足终止迭代条件的数据流会返回到stream流中，进行下一次迭代

满足终止迭代条件的数据流继续往下游发送

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
val initStream = env.socketTextStream("node01",8888)
val stream = initStream.map(_.toLong)
stream.iterate {
    iteration => {
        //定义迭代逻辑
        val iterationBody = iteration.map (x => {
            println(x)
            if(x > 0) x - 1
            else x
        } )
        //> 0  大于0的值继续返回到stream流中,当 <= 0 继续往下游发送
        (iterationBody.filter(_ > 0), iterationBody.filter(_ <= 0))
    }
}.print()
env.execute()
```

##### 函数类和富函数类

在使用Flink算子的时候，可以通过传入匿名函数和函数类对象 例如：

函数类分为：普通函数类、富函数类**（自行划分）**

富函数类相比于普通的函数，可以获取运行环境的上下文（Context），拥有一些生命周期方法，管理状态，可以实现更加复杂的功能

| 普通函数类      | 富函数类            |
| :-------------- | ------------------- |
| MapFunction     | RichMapFunction     |
| FlatMapFunction | RichFlatMapFunction |
| FilterFunction  | RichFilterFunction  |
| ......          | ......              |

- 使用普通函数类过滤掉车速高于100的车辆信息

```scala
	val env = StreamExecutionEnvironment.getExecutionEnvironment
    val stream = env.readTextFile("./data/carFlow_all_column_test.txt")
    stream.filter(new FilterFunction[String] {
      override def filter(value: String): Boolean = {
        if (value != null && !"".equals(value)) {
          val speed = value.split(",")(6).replace("'", "").toLong
          if (speed > 100)
            false
          else
            true
        }else
          false
      }
    }).print()
    env.execute()

```

- 使用富函数类，将车牌号转化成车主真实姓名，映射表存储在Redis中

```java
@Public
public abstract class RichMapFunction<IN, OUT> extends AbstractRichFunction implements MapFunction<IN, OUT> {

	private static final long serialVersionUID = 1L;

	@Override
	public abstract OUT map(IN value) throws Exception;
}

public abstract class AbstractRichFunction implements RichFunction, Serializable {
    @Override
	public void open(Configuration parameters) throws Exception {}

	@Override
	public void close() throws Exception {}
}
```



**abstract class RichMapFunction实现MapFunction接口**

map函数是抽象方法，需要实现

添加redis依赖

wordcount数据写入到redis

```
<dependency>
		<groupId>redis.clients</groupId>
		<artifactId>jedis</artifactId>
		<version>${redis.version}</version>
</dependency>
```

```scala
	val env = StreamExecutionEnvironment.getExecutionEnvironment
    val stream = env.socketTextStream("node01", 8888)
    stream.map(new RichMapFunction[String, String] {

      private var jedis: Jedis = _

      //初始化函数  在每一个thread启动的时候（处理元素的时候，会调用一次）
      //在open中可以创建连接redis的连接
      override def open(parameters: Configuration): Unit = {
        //getRuntimeContext可以获取flink运行的上下文环境  AbstractRichFunction抽象类提供的
        val taskName = getRuntimeContext.getTaskName
        val subtasks = getRuntimeContext.getTaskNameWithSubtasks
        println("=========open======"+"taskName:" + taskName + "\tsubtasks:"+subtasks)
        jedis = new Jedis("node01", 6379)
        jedis.select(3)
      }

      //每处理一个元素，就会调用一次
      override def map(value: String): String = {
        val name = jedis.get(value)
        if(name == null){
          "not found name"
        }else
          name
      }

      //元素处理完毕后，会调用close方法
      //关闭redis连接
      override def close(): Unit = {
        jedis.close()
      }
    }).setParallelism(2).print()

    env.execute()
```

##### 底层API(ProcessFunctionAPI)

属于低层次的API，我们前面讲的map、filter、flatMap等算子都是基于这层高层封装出来的

越低层次的API，功能越强大，用户能够获取的信息越多，比如可以拿到元素状态信息、事件时间、设置定时器等

- 监控每辆汽车，车速超过100迈，5s钟后发出超速的警告通知

  ```scala
  object MonitorOverSpeed02 {
    case class CarInfo(carId:String,speed:Long)
    def main(args: Array[String]): Unit = {
      val env = StreamExecutionEnvironment.getExecutionEnvironment
      val stream = env.socketTextStream("node01",8888)
      stream.map(data => {
        val splits = data.split(" ")
        val carId = splits(0)
        val speed = splits(1).toLong
        CarInfo(carId,speed)
      }).keyBy(_.carId)
        //KeyedStream调用process需要传入KeyedProcessFunction
        //DataStream调用process需要传入ProcessFunction
        .process(new KeyedProcessFunction[String,CarInfo,String] {
  
        override def processElement(value: CarInfo, ctx: KeyedProcessFunction[String, CarInfo, String]#Context, out: Collector[String]): Unit = {
          val currentTime = ctx.timerService().currentProcessingTime()
          if(value.speed > 100 ){
            val timerTime = currentTime + 2 * 1000
            ctx.timerService().registerProcessingTimeTimer(timerTime)
          }
        }
  
        override def onTimer(timestamp: Long, ctx: KeyedProcessFunction[String, CarInfo, String]#OnTimerContext, out: Collector[String]): Unit = {
          var warnMsg = "warn... time:" + timestamp + "  carID:" + ctx.getCurrentKey
          out.collect(warnMsg)
        }
      }).print()
  
      env.execute()
    }
  }
  ```

##### 总结

使用Map Filter....算子的适合，可以直接传入一个匿名函数、普通函数类对象(MapFuncation FilterFunction)

富函数类对象（RichMapFunction、RichFilterFunction）

传入的富函数类对象：可以拿到任务执行的上下文，生命周期方法、管理状态.....

如果业务比较复杂，通过Flink提供这些算子无法满足我们的需求，通过process算子直接使用比较底层API（使用这套API   上下文、生命周期方法、测输出流、时间服务）

KeyedDataStream调用process     KeyedProcessFunction 

DataStream调用process     ProcessFunction 

#### Window

##### Window窗口分类

Window窗口在无界流中设置起始位置和终止位置的方式可以有两种：

- 根据时间设置
- 根据窗口数据量（count）设置

根据窗口的类型划分：

- 滚动窗口
- 滑动窗口

根据数据流类型划分：

- Keyed Window：基于分组后的数据流之上做窗口操作

- Global Window：基于未分组的数据流之上做窗口操作

根据不同的组合方式，可以组合出来8种窗口类型：

1. 基于分组后的数据流上的时间滚动窗口
2. 基于分组后的数据流上的时间滑动窗口
3. 基于分组后的数据流上的count滚动窗口
4. 基于分组后的数据流上的count滑动窗口
5. 基于未分组的数据流上的时间滚动窗口
6. 基于未分组的数据流上的时间滑动窗口
7. 基于未分组的数据流上的count滚动窗口
8. 基于未分组的数据流上的count滑动窗口

当然我们也可以根据实际业务场景自定义Window，这就是Flink最大的优势：Window种类多，灵活

- Time Window（基于时间的窗口）

  - Tumbling Window：滚动窗口，窗口之间没有数据重叠

    ![img](images/tumbling-windows.svg)

  - Sliding Window：滑动窗口，窗口内的数据有重叠

    在定义滑动窗口的时候，不只是要定义窗口大小，还要定义窗口的滑动间隔时间（每隔多久滑动一次），如果滑动间隔时间=窗口大小=滚动窗口

    ![img](images/sliding-windows.svg)

##### 窗口聚合函数

窗口函数定义了针对窗口内元素的计算逻辑，窗口函数大概分为两类：

1. 增量聚合函数，聚合原理：窗口内保存一个中间聚合结果，随着新元素的加入，不断对该值进行更新

   这类函数通常非常节省空间  ReduceFunction、AggregateFunction属于增量聚合函数

2. 全量聚合函数，聚合原理：收集窗口内的所有元素，并且在执行的时候对他们进行遍历，这种聚合函数通常需要占用更多的空间（收集一段时间的数据并且保存），但是它可以支持更复杂的逻辑 ProcessWindowFunction、WindowFunction属于全量窗口函数

   注意：这两类函数可以组合搭配使用

##### 增量聚合函数

案例1：使用增量聚合函数统计最近20s内，各个卡口的车流量

```scala
import java.util.Properties

import org.apache.flink.api.common.functions.AggregateFunction
import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.streaming.api.scala.function.ProcessWindowFunction
import org.apache.flink.streaming.api.scala.{StreamExecutionEnvironment, createTypeInformation}
import org.apache.flink.streaming.api.windowing.time.Time
import org.apache.flink.streaming.api.windowing.windows.TimeWindow
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer
import org.apache.flink.util.Collector
import org.apache.kafka.common.serialization.StringSerializer

/**
  * 使用增量聚合函数统计最近20s内，各个卡口的车流量
  */
object Demo01StatisCarFlow {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment

    //设置连接kafka的配置信息
    val props = new Properties()
    //注意   sparkstreaming + kafka（0.10之前版本） receiver模式  zookeeper url（元数据）
    props.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    props.setProperty("group.id", "flink-kafka-001")
    props.setProperty("key.deserializer", classOf[StringSerializer].getName)
    props.setProperty("value.deserializer", classOf[StringSerializer].getName)

    val stream = env.addSource(new FlinkKafkaConsumer[String]("flink-kafka", new SimpleStringSchema(), props))

    //monitorId + "\t").append(carId + "\t").append(timestamp + "\t").append(speed)
    stream.map(data => {
      val arr = data.split("\t")
      val monitorID = arr(0)
      (monitorID, 1)
    }).keyBy(_._1)
      .timeWindow(Time.seconds(10))
      //      .reduce(new ReduceFunction[(String, Int)] {
      //        override def reduce(value1: (String, Int), value2: (String, Int)): (String, Int) = {
      //          (value1._1, value1._2 + value2._2)
      //        }
      //      }).print()
      .aggregate(new AggregateFunction[(String, Int), Int, Int] {
      override def createAccumulator(): Int = 0

      override def add(value: (String, Int), acc: Int): Int = acc + value._2

      override def getResult(acc: Int): Int = acc

      override def merge(a: Int, b: Int): Int = a + b
    },
//      new WindowFunction[Int, (String, Int), String, TimeWindow] {
//      override def apply(key: String, window: TimeWindow, input: Iterable[Int], out: Collector[(String, Int)]): Unit = {
//        for (elem <- input) {
//          out.collect((key, elem))
//        }
//      }
//    }
    new ProcessWindowFunction[Int, (String, Int), String, TimeWindow] {
      override def process(key: String, context: Context, elements: Iterable[Int], out: Collector[(String, Int)]): Unit = {
        for (elem <- elements) {
          out.collect((key,elem))
        }
      }
    }
    ).print()
    env.execute()
  }
}
```

ProcessWindowFunction、WindowFunction区别在于ProcessWindowFunction可以获取Flink执行的上下文，可以拿到当前的数据更多信息，比如窗口状态、窗口起始与终止时间、当前水印、时间戳等

案例2：每隔10s统计每辆汽车的平均速度

```scala
import java.util.Properties

import org.apache.flink.api.common.functions.AggregateFunction
import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.api.windowing.time.Time
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer
import org.apache.kafka.common.serialization.StringSerializer

object Demo03SpeedAVG {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment

    //设置连接kafka的配置信息
    val props = new Properties()
    //注意   sparkstreaming + kafka（0.10之前版本） receiver模式  zookeeper url（元数据）
    props.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    props.setProperty("group.id", "flink-kafka-001")
    props.setProperty("key.deserializer", classOf[StringSerializer].getName)
    props.setProperty("value.deserializer", classOf[StringSerializer].getName)

    val stream = env.addSource(new FlinkKafkaConsumer[String]("flink-kafka", new SimpleStringSchema(), props))

    stream.map(data => {
      val splits = data.split("\t")
      (splits(1),splits(3).toInt)
    }).keyBy(_._1)
      .timeWindow(Time.seconds(10))
      .aggregate(new AggregateFunction[(String,Int),(String,Int,Int),(String,Double)] {
        override def createAccumulator(): (String, Int, Int) = ("",0,0)

        override def add(value: (String, Int), accumulator: (String, Int, Int)): (String, Int, Int) = {
          (value._1,value._2+accumulator._2,accumulator._3+1)
        }

        override def getResult(accumulator: (String, Int, Int)): (String, Double) = {
          (accumulator._1,accumulator._2.toDouble/accumulator._3)
        }

        override def merge(a: (String, Int, Int), b: (String, Int, Int)): (String, Int, Int) = {
          (a._1,a._2+b._2,a._3+b._3)
        }
      }).print()

    env.execute()
  }
}
```

##### 全量聚合函数

案例3：每隔10s对窗口内所有汽车的车速进行排序

```scala
import java.util.Properties

import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.streaming.api.scala.{StreamExecutionEnvironment, _}
import org.apache.flink.streaming.api.scala.function.ProcessAllWindowFunction
import org.apache.flink.streaming.api.windowing.time.Time
import org.apache.flink.streaming.api.windowing.windows.TimeWindow
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer
import org.apache.flink.util.Collector
import org.apache.kafka.common.serialization.StringSerializer

object Demo02SortSpeed {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment

    //设置连接kafka的配置信息
    val props = new Properties()
    //注意   sparkstreaming + kafka（0.10之前版本） receiver模式  zookeeper url（元数据）
    props.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    props.setProperty("group.id", "flink-kafka-001")
    props.setProperty("key.deserializer", classOf[StringSerializer].getName)
    props.setProperty("value.deserializer", classOf[StringSerializer].getName)

    val stream = env.addSource(new FlinkKafkaConsumer[String]("flink-kafka", new SimpleStringSchema(), props))

    stream.map(data => {
      val splits = data.split("\t")
      (splits(1),splits(3).toInt)
    }).timeWindowAll(Time.seconds(10))
      //注意：想要全局排序并行度需要设置为1
      .process(new ProcessAllWindowFunction[(String,Int),String,TimeWindow] {
        override def process(context: Context, elements: Iterable[(String, Int)], out: Collector[String]): Unit = {
          val sortList = elements.toList.sortBy(_._2)
          for (elem <- sortList) {
            out.collect(elem._1+" speed:" + elem._2)
          }
        }
      }).print()
    env.execute()
  }
}
```

案例4：每隔10s统计出窗口内所有车辆的最大及最小速度

```scala
import java.util.Properties

import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer
import org.apache.kafka.common.serialization.StringSerializer
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.api.scala.function.ProcessAllWindowFunction
import org.apache.flink.streaming.api.windowing.time.Time
import org.apache.flink.streaming.api.windowing.windows.TimeWindow
import org.apache.flink.util.Collector


object Demo04MaxMinSpeed {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment
    //设置连接kafka的配置信息
    val props = new Properties()
    //注意   sparkstreaming + kafka（0.10之前版本） receiver模式  zookeeper url（元数据）
    props.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    props.setProperty("group.id", "flink-kafka-001")
    props.setProperty("key.deserializer", classOf[StringSerializer].getName)
    props.setProperty("value.deserializer", classOf[StringSerializer].getName)

    val stream = env.addSource(new FlinkKafkaConsumer[String]("flink-kafka", new SimpleStringSchema(), props))
    stream.map(data =>{
      val arr = data.split("\t")
      (arr(1),arr(3).toInt)
    }).timeWindowAll(Time.seconds(20))
      .process(new ProcessAllWindowFunction[(String,Int),String,TimeWindow] {
        override def process(context: Context, elements: Iterable[(String, Int)], out: Collector[String]): Unit = {
          val sortList = elements.toList.sortBy(_._2)
          println(sortList)
          val minSpeedInfo = sortList.head
          val maxSpeedInfo = sortList.last
          val startWindowTime = context.window.getStart
          val endWindowTime = context.window.getEnd
          out.collect(
          "窗口起始时间："+startWindowTime  + "结束时间："+ endWindowTime +" 最小车辆速度车牌号：" + minSpeedInfo._1 + " 车速："+minSpeedInfo._2 + "\t最大车辆速度车牌号：" + maxSpeedInfo._1 + " 车速：" + maxSpeedInfo._2
          )
        }
      }).print()
    env.execute()
  }
}
```

#### Partition

##### shuffle  

场景：增大分区、提高并行度，解决数据倾斜

DataStream → DataStream

分区元素随机均匀分发到下游分区，网络开销比较大

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
val stream = env.generateSequence(1,10).setParallelism(1)
println(stream.getParallelism)
stream.shuffle.print()
env.execute()
```

console result: 上游数据比较随意的分发到下游

```scala
2> 1
1> 4
7> 10
4> 6
6> 3
5> 7
8> 2
1> 5
1> 8
1> 9
```

##### rebalance 

场景：增大分区、提高并行度，解决数据倾斜

DataStream → DataStream

轮询分区元素，均匀的将元素分发到下游分区，下游每个分区的数据比较均匀，在发生数据倾斜时非常有用，网络开销比较大

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
env.setParallelism(3)
val stream = env.generateSequence(1,100)
val shuffleStream = stream.rebalance
shuffleStream.print()
env.execute()
```

console result:上游数据比较均匀的分发到下游

```scala
8> 6
3> 1
5> 3
7> 5
1> 7
2> 8
6> 4
4> 2
3> 9
4> 10
```

##### rescale

场景：减少分区  防止发生大量的网络传输   不会发生全量的重分区

DataStream → DataStream

通过轮询分区元素，将一个元素集合从上游分区发送给下游分区，发送单位是集合，而不是一个个元素

注意：rescale发生的是本地数据传输，而不需要通过网络传输数据，比如taskmanager的槽数。简单来说，上游的数据只会发送给本TaskManager中的下游

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
val stream = env.generateSequence(1,10).setParallelism(2)
stream.writeAsText("./data/stream1").setParallelism(2)
stream.rescale.writeAsText("./data/stream2").setParallelism(4)
env.execute()
```

console result：stream1:1内容 分发给stream2:1和stream2:2

stream1:1

```scala
1
3
5
7
9
```

stream1:2

```scala
2
4
6
8
10
```

stream2:1

```scala
1
5
9
```

stream2:2

```scala
3
7
```

stream2:3

```scala
2
6
10
```

stream2:4

```scala
4
8
```

##### broadcast

场景：需要使用映射表、并且映射表会经常发生变动的场景

DataStream → DataStream

上游中每一个元素内容广播到下游每一个分区中

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
val stream = env.generateSequence(1,10).setParallelism(2)
stream.writeAsText("./data/stream1").setParallelism(2)
stream.broadcast.writeAsText("./data/stream2").setParallelism(4)
env.execute()
```

console result：stream1:1、2内容广播到了下游每个分区中

stream1:1

```scala
1
3
5
7
9
```

stream1:2

```scala
2
4
6
8
10
```

stream2:1

```scala
1
3
5
7
9
2
4
6
8
10
```

##### global

场景：并行度降为1

DataStream → DataStream

上游分区的数据只分发给下游的第一个分区

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
val stream = env.generateSequence(1,10).setParallelism(2)
stream.writeAsText("./data/stream1").setParallelism(2)
stream.global.writeAsText("./data/stream2").setParallelism(4)
env.execute()
```

console result：stream1:1、2内容只分发给了stream2:1

stream1:1

```scala
1
3
5
7
9
```

stream1:2

```scala
2
4
6
8
10
```

stream2:1

```scala
1
3
5
7
9
2
4
6
8
10
```

##### forward

场景：一对一的数据分发，map、flatMap、filter 等都是这种分区策略

DataStream → DataStream

上游分区数据分发到下游对应分区中

partition1->partition1

partition2->partition2

注意：必须保证上下游分区数（并行度）一致，不然会有如下异常:

```scala
Forward partitioning does not allow change of parallelism
* Upstream operation: Source: Sequence Source-1 parallelism: 2,
* downstream operation: Sink: Unnamed-4 parallelism: 4
* stream.forward.writeAsText("./data/stream2").setParallelism(4)
```

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
val stream = env.generateSequence(1,10).setParallelism(2)
stream.writeAsText("./data/stream1").setParallelism(2)
stream.forward.writeAsText("./data/stream2").setParallelism(2)
env.execute()
```

console result：stream1:1->stream2:1、stream1:2->stream2:2

stream1:1

```scala
1
3
5
7
9
```

stream1:2

```scala
2
4
6
8
10
```

stream2:1

```scala
1
3
5
7
9
```

stream2:2

```scala
2
4
6
8
10
```

##### keyBy

场景：与业务场景匹配

DataStream → DataStream

根据上游分区元素的Hash值与下游分区数取模计算出，将当前元素分发到下游哪一个分区

```scala
MathUtils.murmurHash(keyHash)（每个元素的Hash值） % maxParallelism（下游分区数）
```

```scala
val env = StreamExecutionEnvironment.getExecutionEnvironment
val stream = env.generateSequence(1,10).setParallelism(2)
stream.writeAsText("./data/stream1").setParallelism(2)
stream.keyBy(0).writeAsText("./data/stream2").setParallelism(2)
env.execute()
```

console result：根据元素Hash值分发到下游分区中

##### PartitionCustom

DataStream → DataStream

通过自定义的分区器，来决定元素是如何从上游分区分发到下游分区

```scala
object ShuffleOperator {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment
    env.setParallelism(2)
    val stream = env.generateSequence(1,10).map((_,1))
    stream.writeAsText("./data/stream1")
    stream.partitionCustom(new customPartitioner(),0)
      .writeAsText("./data/stream2").setParallelism(4)
    env.execute()
  }
  class customPartitioner extends Partitioner[Long]{
    override def partition(key: Long, numPartitions: Int): Int = {
      key.toInt % numPartitions
    }
  }
}
```

#### Sink

Flink内置了大量sink，可以将Flink处理后的数据输出到HDFS、kafka、Redis、ES、MySQL等等

工程场景中，会经常消费kafka中数据，处理结果存储到Redis或者MySQL中

##### Redis Sink

Flink处理的数据可以存储到Redis中，以便实时查询

Flink内嵌连接Redis的连接器，只需要导入连接Redis的依赖就可以

```xml
		<dependency>
            <groupId>org.apache.bahir</groupId>
            <artifactId>flink-connector-redis_2.11</artifactId>
            <version>1.0</version>
        </dependency>
```

WordCount写入到Redis中，选择的是HSET数据类型

代码如下：

```scala
	val env = StreamExecutionEnvironment.getExecutionEnvironment
    val stream = env.socketTextStream("node01",8888)
    val result = stream.flatMap(_.split(" "))
      .map((_, 1))
      .keyBy(0)
      .sum(1)

    //若redis是单机
    val config = new FlinkJedisPoolConfig.Builder().setDatabase(3).setHost("node01").setPort(6379).build()
    //如果是 redis集群
    /*val addresses = new util.HashSet[InetSocketAddress]()
    addresses.add(new InetSocketAddress("node01",6379))
    addresses.add(new InetSocketAddress("node01",6379))
   val clusterConfig = new FlinkJedisClusterConfig.Builder().setNodes(addresses).build()*/

    result.addSink(new RedisSink[(String,Int)](config,new RedisMapper[(String,Int)] {

      override def getCommandDescription: RedisCommandDescription = {
        new RedisCommandDescription(RedisCommand.HSET,"wc")
      }

      override def getKeyFromData(t: (String, Int))  = {
        t._1
      }

      override def getValueFromData(t: (String, Int))  = {
        t._2 + ""
      }
    }))
    env.execute()
```

##### Kafka Sink

处理结果写入到kafka topic中，Flink也是默认支持，需要添加连接器依赖，跟读取kafka数据用的连接器依赖相同

之前添加过就不需要再次添加了

```xml
		<dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-kafka_2.11</artifactId>
            <version>${flink-version}</version>
        </dependency>
```

```scala
import java.lang
import java.util.Properties

import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.connectors.kafka.{FlinkKafkaProducer, KafkaSerializationSchema}
import org.apache.kafka.clients.producer.ProducerRecord
import org.apache.kafka.common.serialization.StringSerializer

object KafkaSink {
  def main(args: Array[String]): Unit = {

    val env = StreamExecutionEnvironment.getExecutionEnvironment
    val stream = env.socketTextStream("node01",8888)
    val result = stream.flatMap(_.split(" "))
      .map((_, 1))
      .keyBy(0)
      .sum(1)

    val props = new Properties()
    props.setProperty("bootstrap.servers","node01:9092,node02:9092,node03:9092")
//    props.setProperty("key.serializer",classOf[StringSerializer].getName)
//    props.setProperty("value.serializer",classOf[StringSerializer].getName)


    /**
    public FlinkKafkaProducer(
     FlinkKafkaProducer(defaultTopic: String, serializationSchema: KafkaSerializationSchema[IN], producerConfig: Properties, semantic: FlinkKafkaProducer.Semantic)
      */
    result.addSink(new FlinkKafkaProducer[(String,Int)]("wc",new KafkaSerializationSchema[(String, Int)] {
      override def serialize(element: (String, Int), timestamp: lang.Long): ProducerRecord[Array[Byte], Array[Byte]] = {
        new ProducerRecord("wc",element._1.getBytes(),(element._2+"").getBytes())
      }
    },props,FlinkKafkaProducer.Semantic.EXACTLY_ONCE))

    env.execute()
  }
}
```

##### MySQL Sink（幂等性）

Flink处理结果写入到MySQL中，这并不是Flink默认支持的，需要添加MySQL的驱动依赖

```xml
		<dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>5.1.44</version>
        </dependency>
```

因为不是内嵌支持的，所以需要基于RichSinkFunction自定义sink

不要基于SinkFunction自定义sink  why？看源码

消费kafka中数据，统计各个卡口的流量，并且存入到MySQL中

注意点：需要去重，操作MySQL需要幂等性

```scala
import java.sql.{Connection, DriverManager, PreparedStatement}
import java.util.Properties

import org.apache.flink.api.common.functions.ReduceFunction
import org.apache.flink.api.common.typeinfo.TypeInformation
import org.apache.flink.configuration.Configuration
import org.apache.flink.streaming.api.functions.sink.{RichSinkFunction, SinkFunction}
import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.connectors.kafka.{FlinkKafkaConsumer, KafkaDeserializationSchema}
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.common.serialization.StringSerializer

object MySQLSink {

  case class CarInfo(monitorId: String, carId: String, eventTime: String, Speed: Long)

  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment

    //设置连接kafka的配置信息
    val props = new Properties()
    //注意   sparkstreaming + kafka（0.10之前版本） receiver模式  zookeeper url（元数据）
    props.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    props.setProperty("group.id", "flink-kafka-001")
    props.setProperty("key.deserializer", classOf[StringSerializer].getName)
    props.setProperty("value.deserializer", classOf[StringSerializer].getName)

    //第一个参数 ： 消费的topic名
    val stream = env.addSource(new FlinkKafkaConsumer[(String, String)]("flink-kafka", new KafkaDeserializationSchema[(String, String)] {
      //什么时候停止，停止条件是什么
      override def isEndOfStream(t: (String, String)): Boolean = false

      //要进行序列化的字节流
      override def deserialize(consumerRecord: ConsumerRecord[Array[Byte], Array[Byte]]): (String, String) = {
        val key = new String(consumerRecord.key(), "UTF-8")
        val value = new String(consumerRecord.value(), "UTF-8")
        (key, value)
      }

      //指定一下返回的数据类型  Flink提供的类型
      override def getProducedType: TypeInformation[(String, String)] = {
        createTuple2TypeInformation(createTypeInformation[String], createTypeInformation[String])
      }
    }, props))

    stream.map(data => {
      val value = data._2
      val splits = value.split("\t")
      val monitorId = splits(0)
      (monitorId, 1)
    }).keyBy(_._1)
      .reduce(new ReduceFunction[(String, Int)] {
        //t1:上次聚合完的结果  t2:当前的数据
        override def reduce(t1: (String, Int), t2: (String, Int)): (String, Int) = {
          (t1._1, t1._2 + t2._2)
        }
      }).addSink(new MySQLCustomSink)

    env.execute()
  }

  //幂等性写入外部数据库MySQL
  class MySQLCustomSink extends RichSinkFunction[(String, Int)] {
    var conn: Connection = _
    var insertPst: PreparedStatement = _
    var updatePst: PreparedStatement = _

    //每来一个元素都会调用一次
    override def invoke(value: (String, Int), context: SinkFunction.Context[_]): Unit = {
      println(value)
      updatePst.setInt(1, value._2)
      updatePst.setString(2, value._1)
      updatePst.execute()
      println(updatePst.getUpdateCount)
      if(updatePst.getUpdateCount == 0){
        println("insert")
        insertPst.setString(1, value._1)
        insertPst.setInt(2, value._2)
        insertPst.execute()
      }
    }

    //thread初始化的时候执行一次
    override def open(parameters: Configuration): Unit = {
      conn = DriverManager.getConnection("jdbc:mysql://node01:3306/test", "root", "123123")
      insertPst = conn.prepareStatement("INSERT INTO car_flow(monitorId,count) VALUES(?,?)")
      updatePst = conn.prepareStatement("UPDATE car_flow SET count = ? WHERE monitorId = ?")
    }

    //thread关闭的时候 执行一次
    override def close(): Unit = {
      insertPst.close()
      updatePst.close()
      conn.close()
    }
  }

}
```

##### Socket Sink

Flink处理结果发送到套接字（Socket）

基于RichSinkFunction自定义sink

```scala
import java.io.PrintStream
import java.net.{InetAddress, Socket}
import java.util.Properties

import org.apache.flink.api.common.functions.ReduceFunction
import org.apache.flink.api.common.typeinfo.TypeInformation
import org.apache.flink.configuration.Configuration
import org.apache.flink.streaming.api.functions.sink.{RichSinkFunction, SinkFunction}
import org.apache.flink.streaming.api.scala.{StreamExecutionEnvironment, createTuple2TypeInformation, createTypeInformation}
import org.apache.flink.streaming.connectors.kafka.{FlinkKafkaConsumer, KafkaDeserializationSchema}
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.common.serialization.StringSerializer

//sink 到 套接字 socket
object SocketSink {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment

    //设置连接kafka的配置信息
    val props = new Properties()
    //注意   sparkstreaming + kafka（0.10之前版本） receiver模式  zookeeper url（元数据）
    props.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    props.setProperty("group.id", "flink-kafka-001")
    props.setProperty("key.deserializer", classOf[StringSerializer].getName)
    props.setProperty("value.deserializer", classOf[StringSerializer].getName)

    //第一个参数 ： 消费的topic名
    val stream = env.addSource(new FlinkKafkaConsumer[(String, String)]("flink-kafka", new KafkaDeserializationSchema[(String, String)] {
      //什么时候停止，停止条件是什么
      override def isEndOfStream(t: (String, String)): Boolean = false

      //要进行序列化的字节流
      override def deserialize(consumerRecord: ConsumerRecord[Array[Byte], Array[Byte]]): (String, String) = {
        val key = new String(consumerRecord.key(), "UTF-8")
        val value = new String(consumerRecord.value(), "UTF-8")
        (key, value)
      }

      //指定一下返回的数据类型  Flink提供的类型
      override def getProducedType: TypeInformation[(String, String)] = {
        createTuple2TypeInformation(createTypeInformation[String], createTypeInformation[String])
      }
    }, props))

    stream.map(data => {
      val value = data._2
      val splits = value.split("\t")
      val monitorId = splits(0)
      (monitorId, 1)
    }).keyBy(_._1)
      .reduce(new ReduceFunction[(String, Int)] {
        //t1:上次聚合完的结果  t2:当前的数据
        override def reduce(t1: (String, Int), t2: (String, Int)): (String, Int) = {
          (t1._1, t1._2 + t2._2)
        }
      }).addSink(new SocketCustomSink("node01",8888))

    env.execute()
  }

  class SocketCustomSink(host:String,port:Int) extends RichSinkFunction[(String,Int)]{
    var socket: Socket  = _
    var writer:PrintStream = _

    override def open(parameters: Configuration): Unit = {
      socket = new Socket(InetAddress.getByName(host), port)
      writer = new PrintStream(socket.getOutputStream)
    }

    override def invoke(value: (String, Int), context: SinkFunction.Context[_]): Unit = {
      writer.println(value._1 + "\t" +value._2)
      writer.flush()
    }

    override def close(): Unit = {
      writer.close()
      socket.close()
    }
  }
}
```

##### File Sink

Flink处理的结果保存到文件，这种使用方式不是很常见

支持分桶写入，每一个桶就是一个目录，默认每隔一个小时会产生一个分桶，每个桶下面会存储每一个Thread的处理结果，可以设置一些文件滚动的策略（文件打开、文件大小等），防止出现大量的小文件，代码中详解

Flink默认支持，导入连接文件的连接器依赖

```xml
 		<dependency>
            <groupId>org.apache.flink</groupId>
            <artifactId>flink-connector-filesystem_2.11</artifactId>
            <version>1.9.2</version>
        </dependency>
```

```scala
import org.apache.flink.api.common.functions.ReduceFunction
import org.apache.flink.api.common.serialization.SimpleStringEncoder
import org.apache.flink.api.common.typeinfo.TypeInformation
import org.apache.flink.core.fs.Path
import org.apache.flink.streaming.api.functions.sink.filesystem.StreamingFileSink
import org.apache.flink.streaming.api.functions.sink.filesystem.rollingpolicies.DefaultRollingPolicy
import org.apache.flink.streaming.api.scala.{StreamExecutionEnvironment, createTuple2TypeInformation, createTypeInformation}
import org.apache.flink.streaming.connectors.kafka.{FlinkKafkaConsumer, KafkaDeserializationSchema}
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.common.serialization.StringSerializer

object FileSink {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment

    //设置连接kafka的配置信息
    val props = new Properties()
    //注意   sparkstreaming + kafka（0.10之前版本） receiver模式  zookeeper url（元数据）
    props.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    props.setProperty("group.id", "flink-kafka-001")
    props.setProperty("key.deserializer", classOf[StringSerializer].getName)
    props.setProperty("value.deserializer", classOf[StringSerializer].getName)

    //第一个参数 ： 消费的topic名
    val stream = env.addSource(new FlinkKafkaConsumer[(String, String)]("flink-kafka", new KafkaDeserializationSchema[(String, String)] {
      //什么时候停止，停止条件是什么
      override def isEndOfStream(t: (String, String)): Boolean = false

      //要进行序列化的字节流
      override def deserialize(consumerRecord: ConsumerRecord[Array[Byte], Array[Byte]]): (String, String) = {
        val key = new String(consumerRecord.key(), "UTF-8")
        val value = new String(consumerRecord.value(), "UTF-8")
        (key, value)
      }

      //指定一下返回的数据类型  Flink提供的类型
      override def getProducedType: TypeInformation[(String, String)] = {
        createTuple2TypeInformation(createTypeInformation[String], createTypeInformation[String])
      }
    }, props))

    val restStream = stream.map(data => {
      val value = data._2
      val splits = value.split("\t")
      val monitorId = splits(0)
      (monitorId, 1)
    }).keyBy(_._1)
      .reduce(new ReduceFunction[(String, Int)] {
        //t1:上次聚合完的结果  t2:当前的数据
        override def reduce(t1: (String, Int), t2: (String, Int)): (String, Int) = {
          (t1._1, t1._2 + t2._2)
        }
      }).map(x=>x._1 + "\t" + x._2)

      //设置文件滚动策略
    val rolling:DefaultRollingPolicy[String,String] = DefaultRollingPolicy.create()
      //当文件超过2s没有写入新数据，则滚动产生一个小文件
      .withInactivityInterval(2000)
      //文件打开时间超过2s 则滚动产生一个小文件  每隔2s产生一个小文件
      .withRolloverInterval(2000)
      //当文件大小超过256 则滚动产生一个小文件
      .withMaxPartSize(256*1024*1024)
      .build()

    /**
      * 默认：
      * 每一个小时对应一个桶（文件夹），每一个thread处理的结果对应桶下面的一个小文件
      * 当小文件大小超过128M或者小文件打开时间超过60s,滚动产生第二个小文件
      */
     val sink: StreamingFileSink[String] = StreamingFileSink.forRowFormat(
      new Path("d:/data/rests"),
      new SimpleStringEncoder[String]("UTF-8"))
         .withBucketCheckInterval(1000)
         .withRollingPolicy(rolling)
         .build()

//    val sink = StreamingFileSink.forBulkFormat(
//      new Path("./data/rest"),
//      ParquetAvroWriters.forSpecificRecord(classOf[String])
//    ).build()

    restStream.addSink(sink)
    env.execute()
  }
}
```

##### HBase Sink

计算结果写入sink 两种实现方式：

1. map算子写入   频繁创建hbase连接
2. process写入    适合批量写入hbase

导入HBase依赖包

```xml
		<dependency>
            <groupId>org.apache.hbase</groupId>
            <artifactId>hbase-client</artifactId>
            <version>${hbase.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hbase</groupId>
            <artifactId>hbase-common</artifactId>
            <version>${hbase.version}</version>
        </dependency>
        <dependency>
            <groupId>org.apache.hbase</groupId>
            <artifactId>hbase-server</artifactId>
            <version>${hbase.version}</version>
        </dependency>
```

读取kafka数据，统计卡口流量保存至HBase数据库中

1. HBase中创建对应的表

```
create 'car_flow',{NAME => 'count', VERSIONS => 1}
```

2. 实现代码

```scala
import java.util.{Date, Properties}

import com.msb.stream.util.{DateUtils, HBaseUtil}
import org.apache.flink.api.common.serialization.SimpleStringSchema
import org.apache.flink.configuration.Configuration
import org.apache.flink.streaming.api.functions.ProcessFunction
import org.apache.flink.streaming.api.scala.StreamExecutionEnvironment
import org.apache.flink.streaming.api.scala._
import org.apache.flink.streaming.connectors.kafka.FlinkKafkaConsumer
import org.apache.flink.util.Collector
import org.apache.hadoop.hbase.HBaseConfiguration
import org.apache.hadoop.hbase.client.{HTable, Put}
import org.apache.hadoop.hbase.util.Bytes
import org.apache.kafka.common.serialization.StringSerializer


object HBaseSinkTest {
  def main(args: Array[String]): Unit = {
    val env = StreamExecutionEnvironment.getExecutionEnvironment

    //设置连接kafka的配置信息
    val props = new Properties()
    //注意   sparkstreaming + kafka（0.10之前版本） receiver模式  zookeeper url（元数据）
    props.setProperty("bootstrap.servers", "node01:9092,node02:9092,node03:9092")
    props.setProperty("group.id", "flink-kafka-001")
    props.setProperty("key.deserializer", classOf[StringSerializer].getName)
    props.setProperty("value.deserializer", classOf[StringSerializer].getName)

    val stream = env.addSource(new FlinkKafkaConsumer[String]("flink-kafka", new SimpleStringSchema(), props))


    stream.map(row => {
      val arr = row.split("\t")
      (arr(0), 1)
    }).keyBy(_._1)
      .reduce((v1: (String, Int), v2: (String, Int)) => {
        (v1._1, v1._2 + v2._2)
      }).process(new ProcessFunction[(String, Int), (String, Int)] {

      var htab: HTable = _

      override def open(parameters: Configuration): Unit = {
        val conf = HBaseConfiguration.create()
        conf.set("hbase.zookeeper.quorum", "node01:2181,node02:2181,node03:2181")
        val hbaseName = "car_flow"
        htab = new HTable(conf, hbaseName)
      }

      override def close(): Unit = {
        htab.close()
      }

      override def processElement(value: (String, Int), ctx: ProcessFunction[(String, Int), (String, Int)]#Context, out: Collector[(String, Int)]): Unit = {
        // rowkey:monitorid   时间戳（分钟） value：车流量
        val min = DateUtils.getMin(new Date())
        val put = new Put(Bytes.toBytes(value._1))
        put.addColumn(Bytes.toBytes("count"), Bytes.toBytes(min), Bytes.toBytes(value._2))
        htab.put(put)
      }
    })
    env.execute()
  }
}
```

##### Custom Sink

#### State Backends

##### 基本概念

状态可以位于 Java 的堆或堆外内存。取决于你的 state backend，Flink 也可以自己管理应用程序的状态。 为了让应用程序可以维护非常大的状态，Flink 可以自己管理内存（如果有必要可以溢写到磁盘）。 默认情况下，所有 Flink Job 会使用配置文件 *flink-conf.yaml* 中指定的 state backend。

但是，配置文件中指定的默认 state backend 会被 Job 中指定的 state backend 覆盖，如下所示。

```java
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.setStateBackend(...);
```

在Flink中提供了StateBackend来存储和管理状态数据

Flink一共实现了三种类型的状态管理器：MemoryStateBackend、FsStateBackend、RocksDBStateBackend

##### Checkpointing

In order to make state fault tolerant, Flink needs to **checkpoint** the state. Checkpoints allow Flink to recover state and positions in the streams to give the application the same semantics as a failure-free execution.

- 状态快照的定义

> - *Snapshot* – a generic term referring to a global, consistent image of the state of a Flink job. A snapshot includes a pointer into each of the data sources (e.g., an offset into a file or Kafka partition), as well as a copy of the state from each of the job’s stateful operators that resulted from having processed all of the events up to those positions in the sources.
> - *Checkpoint* – a snapshot taken automatically by Flink for the purpose of being able to recover from faults. Checkpoints can be incremental, and are optimized for being restored quickly.
> - *Externalized Checkpoint* – normally checkpoints are not intended to be manipulated by users. Flink retains only the *n*-most-recent checkpoints (*n* being configurable) while a job is running, and deletes them when a job is cancelled. But you can configure them to be retained instead, in which case you can manually resume from them.
> - *Savepoint* – a snapshot triggered manually by a user (or an API call) for some operational purpose, such as a stateful redeploy/upgrade/rescaling operation. Savepoints are always complete, and are optimized for operational flexibility.

- 配置快照

  > ```java
  > StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
  > // start a checkpoint every 1000 ms
  > env.enableCheckpointing(1000);
  > // advanced options:
  > // set mode to exactly-once (this is the default)
  > env.getCheckpointConfig().setCheckpointingMode(CheckpointingMode.EXACTLY_ONCE);
  > // make sure 500 ms of progress happen between checkpoints
  > env.getCheckpointConfig().setMinPauseBetweenCheckpoints(500);
  > // checkpoints have to complete within one minute, or are discarded
  > env.getCheckpointConfig().setCheckpointTimeout(60000);
  > // only two consecutive checkpoint failures are tolerated
  > env.getCheckpointConfig().setTolerableCheckpointFailureNumber(2);
  > // allow only one checkpoint to be in progress at the same time
  > env.getCheckpointConfig().setMaxConcurrentCheckpoints(1);
  > // enable externalized checkpoints which are retained
  > // after job cancellation
  > env.getCheckpointConfig().enableExternalizedCheckpoints(ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION);
  > // enables the unaligned checkpoints
  > env.getCheckpointConfig().enableUnalignedCheckpoints();
  > // sets the checkpoint storage where checkpoint snapshots will be written
  > env.getCheckpointConfig().setCheckpointStorage("hdfs:///my/checkpoint/dir")
  > // enable checkpointing with finished tasks
  > Configuration config = new Configuration();
  > config.set(ExecutionCheckpointingOptions.ENABLE_CHECKPOINTS_AFTER_TASKS_FINISH, true);
  > env.configure(config);
  > ```

https://nightlies.apache.org/flink/flink-docs-release-1.14/docs/learn-flink/fault_tolerance/

##### MemoryStateBackend

基于内存的状态管理器将状态数据全部存储在JVM堆内存中。基于内存的状态管理具有非常快速和高效的特点，但也具有非常多的限制，最主要的就是内存的容量限制，一旦存储的状态数据过多就会导致系统内存溢出等问题，从而影响整个应用的正常运行。同时如果机器出现问题，整个主机内存中的状态数据都会丢失，进而无法恢复任务中的状态数据。因此从数据安全的角度建议用户尽可能地避免在生产环境中使用MemoryStateBackend

Flink将MemoryStateBackend作为默认状态后端管理器

```scala
env.setStateBackend(new MemoryStateBackend(100*1024*1024))
```

注意：聚合类算子的状态会同步到JobManager内存中，因此对于聚合类算子比较多的应用会对JobManager的内存造成一定的压力，进而影响集群

##### FsStateBackend

和MemoryStateBackend有所不同，FsStateBackend是基于文件系统的一种状态管理器，这里的文件系统可以是本地文件系统，也可以是HDFS分布式文件系统

```
env.setStateBackend(new FsStateBackend("path",true))
```

如果path是本地文件路径，其格式：file:///

如果path是HDFS文件路径，格式为：hdfs://

第二个参数代表是否异步保存状态数据到HDFS，异步方式能够尽可能避免checkpoint的过程中影响流式计算任务。

FsStateBackend更适合任务量比较大的应用，例如：包含了时间范围非常长的窗口计算，或者状态比较大的场景

##### RocksDBStateBackend

RocksDBStateBackend是Flink中内置的第三方状态管理器，和前面的状态管理器不同，RocksDBStateBackend需要单独引入相关的依赖包到工程中

```maven
 <dependency>
  <groupId>org.apache.flink</groupId>
  <artifactId>flink-statebackend-rocksdb_2.11</artifactId>
  <version>1.9.2</version>
</dependency>
```

```scala
env.setStateBackend(new RocksDBStateBackend("hdfs://"))
```

RocksDBStateBackend采用异步的方式进行状态数据的Snapshot，任务中的状态数据首先被写入本地RockDB中，这样在RockDB仅会存储正在进行计算的热数据，而需要进行CheckPoint的时候，会把本地的数据直接复制到远端的FileSystem中。

与FsStateBackend相比，RocksDBStateBackend在性能上要比FsStateBackend高一些，主要是因为借助于RocksDB在本地存储了最新热数据，然后通过异步的方式再同步到文件系统中，但RocksDBStateBackend和MemoryStateBackend相比性能就会较弱一些。RocksDB克服了State受内存限制的缺点，同时又能够持久化到远端文件系统中，推荐在生产中使用

##### StateBackends【集群】

全局配置需要需改集群中的配置文件，修改flink-conf.yaml

- 配置FsStateBackend

  > ```properties
  > state.backend: filesystem
  > state.checkpoints.dir: hdfs://namenode-host:port/flink-checkpoints
  > ```
  >
  > - [ ] FsStateBackend:filesystem
  > - [ ] MemoryStateBackend:jobmanager
  > - [ ] RocksDBStateBackend:rocksdb

- 配置MemoryStateBackend

  > ```state.backend: jobmanager```

- 配置RocksDBStateBackend

  ```properties
  state.backend.rocksdb.checkpoint.transfer.thread.num: 1 # 同时操作RocksDB的线程数
  state.backend.rocksdb.localdir: 本地path   # RocksDB存储状态数据的本地文件路径
  ```

### Table API

#### TableEnvironment

在 Flink 1.9 中，Table 模块迎来了核心架构的升级，引入了阿里巴巴Blink团队贡献的诸多功能，取名叫： Blink Planner。在使用Table API和SQL开发Flink应用之前，通过添加Maven的依赖配置到项目中，在本地工程中引入相应的依赖库，库中包含了Table API和SQL接口。

```xml
	<dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-table-planner_2.11</artifactId>
        <version>1.9.1</version>
    </dependency>
    <dependency>
        <groupId>org.apache.flink</groupId>
        <artifactId>flink-table-api-scala-bridge_2.11</artifactId>
        <version>1.9.1</version>
    </dependency>
```

和DataStream API一样，Table API和SQL中具有相同的基本编程模型。首先需要构建对应的TableEnviroment创建关系型编程环境，才能够在程序中使用Table API和SQL来编写应用程序，另外Table API和SQL接口可以在应用中同时使用，Flink SQL基于Apache Calcite框架实现了SQL标准协议，是构建在Table API之上的更高级接口。

首先需要在环境中创建TableEnvironment对象，TableEnvironment中提供了注册内部表、执行Flink SQL语句、注册自定义函数等功能。根据应用类型的不同，TableEnvironment创建方式也有所不同，但是都是通过调用create()方法创建

流计算环境下创建TableEnviroment：

```scala
//创建流式计算的上下文环境
val env = StreamExecutionEnvironment.getExecutionEnvironment
//创建Table API的上下文环境
val tableEvn =StreamTableEnvironment.create(env)
```

#### 创建Table

在Flink中创建一张表有两种方法：

- 从一个文件中导入表结构（Structure）（常用于批计算）（静态）

- 从DataStream或者DataSet转换成Table  （动态）

Table API中已经提供了TableSource从外部系统获取数据，例如常见的数据库、文件系统和Kafka消息队列等外部系统。

1. 从文件中创建Table（静态表）

   Flink允许用户从本地或者分布式文件系统中读取和写入数据，在Table API中可以通过CsvTableSource类来创建，只需指定相应的参数即可。但是文件格式必须是CSV格式的。其他文件格式也支持（在Flink还有Connector的来支持其他格式或者自定义TableSource）

   ```scala
       //创建流式计算的上下文环境
       val env = StreamExecutionEnvironment.getExecutionEnvironment
       //创建Table API的上下文环境
       val tableEvn = StreamTableEnvironment.create(env)
   
   
       val source = new CsvTableSource("D:\\code\\StudyFlink\\data\\tableexamples"
         , Array[String]("id", "name", "score")
         , Array(Types.INT, Types.STRING, Types.DOUBLE)
       )
       //将source注册成一张表  别名：exampleTab
       tableEvn.registerTableSource("exampleTab",source)
       tableEvn.scan("exampleTab").printSchema()
   ```

   代码最后不需要env.execute()，这并不是一个流式计算任务

2. 从DataStream中创建Table（动态表）

   前面已经知道Table API是构建在DataStream API和DataSet API之上的一层更高级的抽象，因此用户可以灵活地使用Table API将Table转换成DataStream或DataSet数据集，也可以将DataSteam或DataSet数据集转换成Table，这和Spark中的DataFrame和RDD的关系类似

#### 修改Table中字段名

​	Flink支持把自定义POJOs类的所有case类的属性名字变成字段名，也可以通过基于字段偏移位置和字段名称两种方式重新修改：

```scala
    //导入table库中的隐式转换
    import org.apache.flink.table.api.scala._ 
    // 基于位置重新指定字段名称为"field1", "field2", "field3"
    val table = tStreamEnv.fromDataStream(stream, 'field1, 'field2, 'field3)
    // 将DataStream转换成Table,并且将字段名称重新成别名
    val table: Table = tStreamEnv.fromDataStream(stream, 'rowtime as 'newTime, 'id as 'newId,'variable as 'newVariable)
```

**注意：要导入隐式转换。如果使用as 修改字段，必须修改表中所有的字段。**

#### 查询和过滤

​	在Table对象上使用select操作符查询需要获取的指定字段，也可以使用filter或where方法过滤字段和检索条件，将需要的数据检索出来。	

```scala
object TableAPITest {

  def main(args: Array[String]): Unit = {
    val streamEnv: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
    streamEnv.setParallelism(1)
    //初始化Table API的上下文环境
    val tableEvn =StreamTableEnvironment.create(streamEnv)
    //导入隐式转换，建议写在这里，可以防止IDEA代码提示出错的问题
    import org.apache.flink.streaming.api.scala._
    import org.apache.flink.table.api.scala._
    val data = streamEnv.socketTextStream("hadoop101",8888)
          .map(line=>{
            var arr =line.split(",")
            new StationLog(arr(0).trim,arr(1).trim,arr(2).trim,arr(3).trim,arr(4).trim.toLong,arr(5).trim.toLong)
          })

    val table: Table = tableEvn.fromDataStream(data)
    //查询
    tableEvn.toAppendStream[Row](
      table.select('sid,'callType as 'type,'callTime,'callOut))
      .print()
    //过滤查询
    tableEvn.toAppendStream[Row](
      table.filter('callType==="success") //filter
        .where('callType==="success"))    //where
      .print()
    tableEvn.execute("sql")
  }
```

其中toAppendStream函数是吧Table对象转换成DataStream对象。

#### 分组聚合

​	举例：我们统计每个基站的日志数量。

```scala
val table: Table = tableEvn.fromDataStream(data)
    tableEvn.toRetractStream[Row](
      table.groupBy('sid).select('sid, 'sid.count as 'logCount))
      .filter(_._1==true) //返回的如果是true才是Insert的数据
      .print()
```

​	在代码中可以看出，使用toAppendStream和toRetractStream方法将Table转换为DataStream[T]数据集，T可以是Flink自定义的数据格式类型Row，也可以是用户指定的数据格式类型。在使用toRetractStream方法时，返回的数据类型结果为DataStream[(Boolean,T)]，Boolean类型代表数据更新类型，True对应INSERT操作更新的数据，False对应DELETE操作更新的数据。

#### UDF自定义的函数

用户可以在Table API中自定义函数类，常见的抽象类和接口是：

- ScalarFunction 
- TableFunction
- AggregateFunction
- TableAggregateFunction

案例：使用Table完成基于流的WordCount

```scala
object TableAPITest2 {

  def main(args: Array[String]): Unit = {
    val streamEnv: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
        streamEnv.setParallelism(1)
    //初始化Table API的上下文环境
    val tableEvn =StreamTableEnvironment.create(streamEnv)
    //导入隐式转换，建议写在这里，可以防止IDEA代码提示出错的问题
    import org.apache.flink.streaming.api.scala._
    import org.apache.flink.table.api.scala._

    val stream: DataStream[String] = streamEnv.socketTextStream("hadoop101",8888)
    val table: Table = tableEvn.fromDataStream(stream,'words)
    var my_func =new MyFlatMapFunction()//自定义UDF
    val result: Table = table.flatMap(my_func('words)).as('word, 'count)
      .groupBy('word) //分组
      .select('word, 'count.sum as 'c) //聚合
    tableEvn.toRetractStream[Row](result)
      .filter(_._1==true)
      .print()

    tableEvn.execute("table_api")

  }
  //自定义UDF
  class MyFlatMapFunction extends TableFunction[Row]{
    //定义类型
    override def getResultType: TypeInformation[Row] = {
      Types.ROW(Types.STRING, Types.INT)
    }
    //函数主体
    def eval(str:String):Unit ={
      str.trim.split(" ")
        .foreach({word=>{
          var row =new Row(2)
          row.setField(0,word)
          row.setField(1,1)
          collect(row)
        }})
    }
  }
}
```

#### Window

​	Flink支持ProcessTime、EventTime和IngestionTime三种时间概念，针对每种时间概念，Flink Table API中使用Schema中单独的字段来表示时间属性，当时间字段被指定后，就可以在基于时间的操作算子中使用相应的时间属性。

​	在Table API中通过使用.rowtime来定义EventTime字段，在ProcessTime时间字段名后使用.proctime后缀来指定ProcessTime时间属性

案例：统计最近5秒钟，每个基站的呼叫数量

```scala
object TableAPITest {

  def main(args: Array[String]): Unit = {
    val streamEnv: StreamExecutionEnvironment = StreamExecutionEnvironment.getExecutionEnvironment
    //指定EventTime为时间语义
    streamEnv.setStreamTimeCharacteristic(TimeCharacteristic.EventTime)
    streamEnv.setParallelism(1)
    //初始化Table API的上下文环境
    val tableEvn =StreamTableEnvironment.create(streamEnv)
    //导入隐式转换，建议写在这里，可以防止IDEA代码提示出错的问题
    import org.apache.flink.streaming.api.scala._
    import org.apache.flink.table.api.scala._

    val data = streamEnv.socketTextStream("hadoop101",8888)
          .map(line=>{
            var arr =line.split(",")
            new StationLog(arr(0).trim,arr(1).trim,arr(2).trim,arr(3).trim,arr(4).trim.toLong,arr(5).trim.toLong)
          })
      .assignTimestampsAndWatermarks( //引入Watermark
        new BoundedOutOfOrdernessTimestampExtractor[StationLog](Time.seconds(2)){//延迟2秒
          override def extractTimestamp(element: StationLog) = {
            element.callTime
          }
        })

    //设置时间属性
    val table: Table = tableEvn.fromDataStream(data,'sid,'callOut,'callIn,'callType,'callTime.rowtime)
    //滚动Window ,第一种写法
    val result: Table = table.window(Tumble over 5.second on 'callTime as 'window)
    //第二种写法
    val result: Table = table.window(Tumble.over("5.second").on("callTime").as("window"))
      .groupBy('window, 'sid)
      .select('sid, 'window.start, 'window.end, 'window.rowtime, 'sid.count)
    //打印结果
    tableEvn.toRetractStream[Row](result)
      .filter(_._1==true)
      .print()
  

    tableEvn.execute("sql")
  }
}
```

上面的案例是滚动窗口，如果是滑动窗口也是一样，代码如下：

```scala
//滑动窗口，窗口大小为：10秒，滑动步长为5秒 :第一种写法
table.window(Slide over 10.second every 5.second on 'callTime as 'window)
//滑动窗口第二种写法 table.window(Slide.over("10.second").every("5.second").on("callTime").as("window"))
```

### Python API

## Deployment

### 技术架构概览

![The processes involved in executing a Flink dataflow](images/processes.svg)

### Standalone

Standalone是独立部署模式，它不依赖其他平台，不依赖任何的资源调度框架

Standalone集群是由JobManager、TaskManager两个JVM进程组成

#### 集群角色划分

|   node01   |   node02    |   node03    |   node04    |
| :--------: | :---------: | :---------: | :---------: |
| JobManager | TaskManager | TaskManager | TaskManager |

------

#### 安装步骤

1. 官网下载Flink安装包

   Apache Flink® 1.10.0 is our latest stable release.现在最稳定的是1.10.0，不建议采用这个版本，刚从1.9升级到1.10，会存在一些bug，不建议采用小版本号为0的安装包，所以我们建议使用1.9.2版本

   下载链接:https://mirrors.tuna.tsinghua.edu.cn/apache/flink/flink-1.9.2/flink-1.9.2-bin-scala_2.11.tgz

2. 安装包上传到node01节点

3. 解压、修改配置文件

   解压：tar -zxf flink-1.9.2-bin-scala_2.11.tgz

   修改flink-conf.yaml配置文件

   ```
   jobmanager.rpc.address: node01 	JobManager地址
   jobmanager.rpc.port: 6123      	JobManagerRPC通信端口
   jobmanager.heap.size: 1024m   	JobManager所能使用的堆内存大小
   taskmanager.heap.size: 1024m  	TaskManager所能使用的堆内存大小
   taskmanager.numberOfTaskSlots: 2 TaskManager管理的TaskSlot个数，依据当前物理机的核心数来配置，一般预留出一部分核心（25%）给系统及其他进程使用，一个slot对应一个core。如果core支持超线程，那么slot个数*2
   rest.port: 8081					指定WebUI的访问端口
   ```

   修改slaves配置文件

   ```
   node02
   node03
   node04
   ```

4. 同步安装包到其他的节点

   同步到node02  scp -r flink-1.9.2 node02:`pwd`

   同步到node03  scp -r flink-1.9.2 node03:`pwd`

   同步到node04  scp -r flink-1.9.2 node04:`pwd`

5. node01配置环境变量

   ```
   vim ~/.bashrc
   export FLINK_HOME=/opt/software/flink/flink-1.9.2
   export PATH=$PATH:$FLINK_HOME/bin
   source ~/.bashrc
   ```

6. 启动standalone集群

   启动集群：start-cluster.sh

   关闭集群：stop-cluster.sh

7. 查看Flink Web UI页面

   http://node01:8081/ 可通过rest.port参数自定义端口

#### 提交Job到standalone集群

常用提交任务的方式有两种，分别是命令提交和Web页面提交	

1. **命令提交：**

   ```shell
   # -c 指定主类
   # -d 独立运行、后台运行 
   # -p 指定并行度
   flink run -c com.msb.stream.WordCount StudyFlink-1.0-SNAPSHOT.jar
   ```

2. **Web页面提交：**

   在Web中指定Jar包的位置、主类路径、并行数等

   web.submit.enable: true一定是true，否则不支持Web提交Application


3. 启动scala-shell测试

   ```
   start-scala-shell.sh remote <hostname> <portnumber>
   ```

### Standalone HA

JobManager协调每个flink任务部署,它负责调度和资源管理

默认情况下，每个flink集群只有一个JobManager，这将导致一个单点故障(SPOF single-point-of-failure)：如果JobManager挂了，则不能提交新的任务，并且运行中的程序也会失败。

使用JobManager HA，集群可以从JobManager故障中恢复，从而避免SPOF

Standalone模式（独立模式）下JobManager的高可用性的基本思想是，任何时候都有一个 Active JobManager ，并且多个Standby JobManagers 。 Standby JobManagers可以在Master JobManager 挂掉的情况下接管集群成为Master JobManager。 这样保证了没有单点故障，一旦某一个Standby JobManager接管集群，程序就可以继续运行。 Standby JobManager和Active JobManager实例之间没有明确区别。 每个JobManager可以成为Active或Standby节点

![img](images/jobmanager_ha_overview.png)

如何单独启动JobManager  jobmanager.sh

如何单独启动TaskManager  taskmanager.sh

#### 集群角色划分

|             | node01 | node02 | node03 | node04 |
| :---------: | :----: | :----: | :----: | :----: |
| JobManager  |   √    |   √    |   ×    |   ×    |
| TaskManager |   ×    |   √    |   √    |   √    |

#### 安装步骤

1. 修改配置文件conf/flink-conf.yaml

   ```
   high-availability: zookeeper 
   high-availability.storageDir: hdfs://node01:9000/flink/ha/ 保存JobManager恢复所需要的所有元数据信息
   high-availability.zookeeper.quorum: node01:2181,node02:2181,node03:2181 zookeeper地址
   ```

2. 修改配置文件conf/masters

   ```
   node01:8081
   node02:8081
   ```

3. 同步文件到各个节点

4. 下载支持Hadoop插件并且拷贝到各个节点的安装包的lib目录下

   下载地址：https://repo.maven.apache.org/maven2/org/apache/flink/flink-shaded-hadoop-2-uber/2.6.5-10.0/flink-shaded-hadoop-2-uber-2.6.5-10.0.jar

- HA集群测试

  http://node01:8081/

  http://node02:8081/


### Flink on Kubernetes（推荐）

参考另一篇文章【基于K3S快速搭建Flink集群】

### Flink on Yarn

Flink on Yarn是依托Yarn资源管理器，现在很多分布式任务都可以支持基于Yarn运行，这是在企业中使用最多的方式。Why？

（1）基于Yarn的运行模式可以充分使用集群资源，Spark on Yarn、MapReduce on Yarn、Flink on Yarn等 多套计算框架都可以基于Yarn运行，充分利用集群资源

（2）基于Yarn的运行模式降低维护成本

运行流程：

![img](images/FlinkOnYarn.svg)

1. 每当创建一个新flink的yarn session的时候，客户端会首先检查要请求的资源(containers和memory)是否可用。然后，将包含flink相关的jar包盒配置上传到HDFS

2. 客户端会向ResourceManager申请一个yarn container 用以启动ApplicationMaster。由于客户端已经将配置和jar文件上传到HDFS，ApplicationMaster将会下载这些jar和配置，然后启动成功

3. JobManager和AM运行于同一个container

4. AM开始申请启动Flink TaskManager的containers，这些container会从HDFS上下载jar文件和已修改的配置文件。一旦这些步骤完成，flink就可以接受任务了

## Operations

### REST API

Flink 具有监控 API ，可用于查询正在运行的作业以及最近完成的作业的状态和统计信息。该监控 API 被用于 Flink 自己的仪表盘，同时也可用于自定义监控工具。该监控 API 是 REST-ful 风格的，可以接受 HTTP 请求并返回 JSON 格式的数据。

这些 API 中存在几种异步操作，例如：`trigger savepoint` 、 `rescale a job` 。它们将返回 `triggerid` 来标识你刚刚执行的 `POST` 请求，然后你需要使用该 `triggerid` 查询该操作的状态。

#### 集群管理

| 版本 | Path                        | Method | 解释                                                         |
| ---- | --------------------------- | ------ | ------------------------------------------------------------ |
| v1   | /cluster                    | DELETE | Shuts down the cluster                                       |
| v1   | /config                     | GET    | Returns the configuration of the WebUI.                      |
| v1   | /datasets                   | GET    | Returns all cluster data sets.                               |
| v1   | /datasets/delete/:triggerid | GET    | Returns the status for the delete operation of a cluster data set. |
| v1   | /datasets/:datasetid        | DELETE | Triggers the deletion of a cluster data set. This async operation would return a 'triggerid' for further query identifier. |
| v1   | /jars                       | GET    | Returns a list of all jars previously uploaded via '/jars/upload'. |
| v1   | /jars/upload                | POST   | Uploads a jar to the cluster. The jar must be sent as multi-part data. Make sure that the "Content-Type" header is set to "application/x-java-archive", as some http libraries do not add the header by default. Using 'curl' you can upload a jar via 'curl -X POST -H "Expect:" -F "jarfile=@path/to/flink-job.jar" http://hostname:port/jars/upload'. |
| v1   | **/jars/:jarid**            | DELETE | Deletes a jar previously uploaded via '/jars/upload'.        |
| v1   | **/jars/:jarid/plan**       | GET    | Returns the dataflow plan of a job contained in a jar previously uploaded via '/jars/upload'. Program arguments can be passed both<br /> via the JSON request (recommended) or query parameters.<br /> 1.`program-args` (optional): Deprecated, please use 'programArg' instead. String value that specifies the arguments for the program or plan<br />2.  `programArg` (optional): Comma-separated list of program arguments.<br />3. `entry-class` (optional): String value that specifies the fully qualified name of the entry point class. Overrides the class defined in the jar file manifest.<br />4. `parallelism` (optional): Positive integer value that specifies the desired parallelism for the job. |
| v1   | **/jars/:jarid/plan**       | POST   | Returns the dataflow plan of a job contained in a jar previously uploaded via '/jars/upload'. Program arguments can be passed both via the JSON request (recommended) or query parameters.<br />参数同上 |
| v1   | **/jars/:jarid/run**        | POST   | Submits a job by running a jar previously uploaded via '/jars/upload'. Program arguments can be passed both via the JSON request (recommended) or query parameters. |
| v1   | **/overview**                                                | GET    | Returns an overview over the Flink cluster.                  |
| v1   | **/savepoint-disposal**                                      | POST   | Triggers the desposal of a savepoint. This async operation would return a 'triggerid' for further query identifier. |
| v1   | **/savepoint-disposal/:triggerid**                           | GET    | Returns the status of a savepoint disposal operation.        |
#### 作业调度
| 版本 | Path                                         | Method | 解释                                                         |
| ---- | -------------------------------------------- | ------ | ------------------------------------------------------------ |
| v1   | /jobs                                                        | GET    | Returns an overview over all jobs and their current state.   |
| v1   | /jobs                                                        | POST   | Submits a job. This call is primarily intended to be used by the Flink client. This call expects a multipart/form-data request that consists of file uploads for the serialized JobGraph, jars and distributed cache artifacts and an attribute named "request" for the JSON payload. |
| v1   | **/jobs/metrics**                                            | GET    | Provides access to aggregated job metrics.                   |
| v1   | **/jobs/overview**                                           | GET    | Returns an overview over all jobs.                           |
| v1   | **/jobs/:jobid**                                             | GET    | Returns details of a job.                                    |
| v1   | **/jobs/:jobid**                                             | PATCH  | Terminates a job.                                            |
| v1   | **/jobs/:jobid/accumulators**                                | GET    | Returns the accumulators for all tasks of a job, aggregated across the respective subtasks. |
| v1   | **/jobs/:jobid/checkpoints**                                 | GET    | Returns checkpointing statistics for a job.                  |
| v1   | **/jobs/:jobid/checkpoints/config**                          | GET    | Returns the checkpointing configuration.                     |
| v1   | **/jobs/:jobid/checkpoints/details/:checkpointid**           | GET    | Returns details for a checkpoint.                            |
| v1   | **/jobs/:jobid/checkpoints/details/<br />:checkpointid/subtasks/:vertexid** | GET    | Returns checkpoint statistics for a task and its subtasks.   |
| v1   | **/jobs/:jobid/config**                                      | GET    | Returns the configuration of a job.                          |
| v1   | **/jobs/:jobid/exceptions**                                  | GET    | Returns the most recent exceptions that have been handled by Flink for this job. The 'exceptionHistory.truncated' flag defines whether exceptions were filtered out through the GET parameter. The backend collects only a specific amount of most recent exceptions per job. This can be configured through web.exception-history-size in the Flink configuration. The following first-level members are deprecated: 'root-exception', 'timestamp', 'all-exceptions', and 'truncated'. Use the data provided through 'exceptionHistory', instead. |
| v1   | **/jobs/:jobid/execution-result**                            | GET    | Returns the result of a job execution. Gives access to the execution time of the job and to all accumulators created by this job. |
| v1   | **/jobs/:jobid/metrics**                                     | GET    | Provides access to job metrics.                              |
| v1   | **/jobs/:jobid/plan**                                        | GET    | Returns the dataflow plan of a job.                          |
| v1   | **/jobs/:jobid/rescaling**                                   | GET    | Triggers the rescaling of a job. This async operation would return a 'triggerid' for further query identifier. |
| v1   | **/jobs/:jobid/rescaling/:triggerid**                        | GET    | Returns the status of a rescaling operation.                 |
| v1   | **/jobs/:jobid/savepoints**                                  | POST   | Triggers a savepoint, and optionally cancels the job afterwards. This async operation would return a 'triggerid' for further query identifier. |
| v1   | **/jobs/:jobid/savepoints/:triggerid**                       | GET    | Returns the status of a savepoint operation.                 |
| v1   | **/jobs/:jobid/stop**                                        | POST   | Stops a job with a savepoint. Optionally, it can also emit a MAX_WATERMARK before taking the savepoint to flush out any state waiting for timers to fire. This async operation would return a 'triggerid' for further query identifier. |
| v1   | **/jobs/:jobid/vertices/:vertexid**                          | GET    | Returns details for a task, with a summary for each of its subtasks. |
| v1   | **/jobs/:jobid/vertices/:vertexid/accumulators**             | GET    | Returns user-defined accumulators of a task, aggregated across all subtasks. |
| v1   | **/jobs/:jobid/vertices/:vertexid/backpressure**             | GET    | Returns back-pressure information for a job, and may initiate back-pressure sampling if necessary. |
| v1   | **/jobs/:jobid/vertices/:vertexid/flamegraph**               | GET    | Returns flame graph information for a vertex, and may initiate flame graph sampling if necessary. |
| v1   | **/jobs/:jobid/vertices/:vertexid/metrics**                  | GET    | Provides access to task metrics.                             |
| v1   | **/jobs/:jobid/vertices/:vertexid/subtasks/<br />accumulators** | GET    | Returns all user-defined accumulators for all subtasks of a task. |
| v1   | **/jobs/:jobid/vertices/:vertexid/subtasks/metrics**         | GET    | Provides access to aggregated subtask metrics.               |
| v1   | **/jobs/:jobid/vertices/:vertexid/subtasks/<br />:subtaskindex** | GET    | Returns details of the current or latest execution attempt of a subtask. |
| v1   | **/jobs/:jobid/vertices/:vertexid/subtasks/<br />:subtaskindex/attempts/:attempt** | GET    | Returns details of an execution attempt of a subtask. Multiple execution attempts happen in case of failure/recovery. |
| v1   | **/jobs/:jobid/vertices/:vertexid/subtasks/<br />:subtaskindex/attempts/:attempt/accumulators** | GET    | Returns the accumulators of an execution attempt of a subtask. Multiple execution attempts happen in case of failure/recovery. |
| v1   | **/jobs/:jobid/vertices/:vertexid/subtasks/<br />:subtaskindex/metrics** | GET    | Provides access to subtask metrics.                          |
| v1   | **/jobs/:jobid/vertices/:vertexid/subtasktimes**             | GET    | Returns time-related information for all subtasks of a task. |
| v1   | **/jobs/:jobid/vertices/:vertexid/taskmanagers**             | GET    | Returns task information aggregated by task manager.         |
| v1   | **/jobs/:jobid/vertices/:vertexid/watermarks**               | GET    | Returns the watermarks for all subtasks of a task.           |

#### Jobmanager
| 版本 | Path                                                         | Method | 解释                                                         |
| ---- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------ |
| v1   | **/jobmanager/config**                                       | GET    | Returns the cluster configuration.                           |
| v1   | **/jobmanager/logs**                                         | GET    | Returns the list of log files on the JobManager.             |
| v1   | **/jobmanager/metrics**                                      | GET    | Provides access to job manager metrics.                      |

#### TaskManager

| 版本 | Path                                         | Method | 解释                                                         |
| ---- | -------------------------------------------- | ------ | ------------------------------------------------------------ |
| v1   | **/taskmanagers**                            | GET    | Returns an overview over all task managers.                  |
| v1   | **/taskmanagers/metrics**                    | GET    | Provides access to aggregated task manager metrics.          |
| v1   | **/taskmanagers/:taskmanagerid**             | GET    | Returns details for a task manager. "metrics.memorySegmentsAvailable" and "metrics.memorySegmentsTotal" are deprecated. Please use "metrics.nettyShuffleMemorySegmentsAvailable" and "metrics.nettyShuffleMemorySegmentsTotal" instead. |
| v1   | **/taskmanagers/:taskmanagerid/logs**        | GET    | Returns the list of log files on a TaskManager.              |
| v1   | **/taskmanagers/:taskmanagerid/metrics**     | GET    | Provides access to task manager metrics.                     |
| v1   | **/taskmanagers/:taskmanagerid/thread-dump** | GET    | Returns the thread dump of the requested TaskManager.        |



## 概念速览

### 集群

#### Flink Application Cluster

A Flink Application Cluster is a dedicated Flink Cluster that only executes Flink Jobs from one Flink Application. The lifetime of the Flink Cluster is bound to the lifetime of the Flink Application.

#### Flink TaskManager

TaskManager 是 Flink Cluster 的工作进程。Task 被调度到 TaskManager 上执行。TaskManager 相互通信，只为在后续的 Task 之间交换数据。

#### Flink JobManager

Flink JobManager 是 Flink Cluster 的主节点。它包含三个不同的组件：Flink Resource Manager、Flink Dispatcher、运行每个 Flink Job 的 Flink JobMaster。

在作业执行期间，**JobManager 会持续跟踪各个 task**，决定何时调度下一个或一组 task，处理已完成的 task 或执行失败的情况。

JobManager 会接收到一个 JobGraph ，用来描述由多个算子顶点 ( JobVertex ) 组成的数据流图，以及中间结果数据 ( IntermediateDataSet )。每个算子都有自己的可配置属性，比如并行度和运行的代码。除此之外，JobGraph 还包含算子代码执行所必须的依赖库。

JobManager 会将 JobGraph 转换成 ExecutionGraph 。可以将 ExecutionGraph 理解为并行版本的 JobGraph，对于每一个顶点 JobVertex，它的每个并行子 task 都有一个 ExecutionVertex 。一个并行度为 100 的算子会有 1 个 JobVertex 和 100 个 ExecutionVertex。ExecutionVertex 会跟踪子 task 的执行状态。 同一个 JobVertex 的所有 ExecutionVertex 都通过 ExecutionJobVertex 来持有，并跟踪整个算子的运行状态。ExecutionGraph 除了这些顶点，还包含中间数据结果和分片情况 IntermediateResult 和 IntermediateResultPartition 。前者跟踪中间结果的状态，后者跟踪每个分片的状态。

![JobGraph and ExecutionGraph](images/job_and_execution_graph.svg)

#### Flink JobMaster

JobMaster 是在 Flink JobManager 运行中的组件之一。JobManager 负责监督单个作业 Task 的执行。以前，整个 Flink JobManager 都叫做 JobManager。

#### Flink Job Cluster

A Flink Job Cluster is a dedicated Flink Cluster that only executes a single Flink Job. The lifetime of the Flink Cluster is bound to the lifetime of the Flink Job.

#### Flink Cluster

一般情况下，Flink 集群是由一个 Flink JobManager 和一个或多个 Flink TaskManager 进程组成的分布式系统。

#### Flink Session Cluster

长时间运行的 Flink Cluster，它可以接受多个 Flink Job 的执行。此 Flink Cluster 的生命周期不受任何 Flink Job 生命周期的约束限制。以前，Flink Session Cluster 也称为 session mode 的 Flink Cluster，和 Flink Application Cluster 相对应。

#### Flink Application

A Flink application is a Java Application that submits one or multiple Flink Jobs from the main() method (or by some other means). Submitting jobs is usually done by calling execute() on an execution environment.

The jobs of an application can either be submitted to a long running Flink Session Cluster, to a dedicated Flink Application Cluster, or to a Flink Job Cluster.

#### State Backend

对于流处理程序，Flink Job 的 State Backend 决定了其 state 是如何存储在每个 TaskManager 上的（ TaskManager 的 Java 堆栈或嵌入式 RocksDB），以及它在 checkpoint 时的写入位置（ Flink JobManager 的 Java 堆或者 Filesystem）。

### 开发 API

#### Transformation

Transformation 应用于一个或多个数据流或数据集，并产生一个或多个输出数据流或数据集。Transformation 可能会在每个记录的基础上更改数据流或数据集，但也可以只更改其分区或执行聚合。虽然 Operator 和 Function 是 Flink API 的“物理”部分，但 Transformation 只是一个 API 概念。具体来说，大多数（但不是全部）Transformation 是由某些 Operator 实现的。

#### DataStream API

Flink中的DataStream任务用于实现data streams的转换，data stream可以来自不同的数据源，比如消息队列，socket，文件等。使用DataStream API需要使用stream env。

#### TableAPI & SQL

Table API 和 SQL 集成在同一套 API 中。 这套 API 的核心概念是`Table`，用作查询的输入和输出。 本文介绍 Table API 和 SQL 查询程序的通用结构、如何注册 `Table` 、如何查询 `Table` 以及如何输出 `Table` 。

所有用于批处理和流处理的 Table API 和 SQL 程序都遵循相同的模式。下面的代码示例展示了 Table API 和 SQL 程序的通用结构。

#### Flink中的Environment

Flink有以下几种Environment

1. 批处理Environment，ExecutionEnvironment

```java
ExecutionEnvironment env = ExecutionEnvironment.getExecutionEnvironment();
```

2.流处理Environment，StreamExecutionEnvironment

```
StreamExecutionEnvironment env= StreamExecutionEnvironment.getExecutionEnvironment();
```

3. 本机Environment，LocalEnvironment

```
ExecutionEnvironment env= LocalEnvironment.getExecutionEnvironment();
```

4. java集合Environment，CollectionEnvironment

```
ExecutionEnvironment env = CollectionEnvironment.getExecutionEnvironment();
```

创建Environment的方法

1. getExecutionEnvironment ，含义就是本地运行就是 createLocalEnvironment，如果是通过client提交到集群上，就返回集群的环境

```java
Creates an execution environment that represents the context ``in` `which` `the program is currently executed.``  ``* If the program is invoked standalone, this method returns a ``local` `execution environment, as returned by``  ``* {@link ``#createLocalEnvironment()}. If the program is invoked from within the command line client to be``  ``* submitted to a cluster, this method returns the execution environment of this cluster.
```

2. createLocalEnvironment ，返回本地执行环境，需要在调用时指定默认的并行度，比如

```java
LocalStreamEnvironment env1 = StreamExecutionEnvironment.createLocalEnvironment(1);
LocalEnvironment env2 = ExecutionEnvironment.createLocalEnvironment(1);
```

3. createRemoteEnvironment， 返回集群执行环境，将 Jar 提交到远程服务器。需要在调用时指定 JobManager 的 IP 和端口号，并指定要在集群中运行的 Jar 包，比如

```java
StreamExecutionEnvironment env1 = StreamExecutionEnvironment.createRemoteEnvironment("127.0.0.1", 8080, "/path/word_count.jar");
ExecutionEnvironment env2 = ExecutionEnvironment.createRemoteEnvironment("127.0.0.1", 8080, "/path/word_count.jar");
```

#### Partition

分区是整个数据流或数据集的独立子集。通过将每个 Record 分配给一个或多个分区，来把数据流或数据集划分为多个分区。在运行期间，Task 会消费数据流或数据集的分区。改变数据流或数据集分区方式的转换通常称为重分区。

### 任务流转

#### Flink Job

A Flink Job is the runtime representation of a logical graph (also often called dataflow graph) that is created and submitted by calling execute() in a Flink Application.

#### Sub-Task

Sub-Task 是负责处理数据流 Partition 的 Task。“Sub-Task"强调的是同一个 Operator 或者 Operator Chain 具有多个并行的 Task 。

#### Task

Task 是 Physical Graph 的节点。它是基本的工作单元，由 Flink 的 runtime 来执行。Task 正好封装了一个 Operator 或者 Operator Chain 的 parallel instance。

#### Function

Function 是由用户实现的，并封装了 Flink 程序的应用程序逻辑。大多数 Function 都由相应的 Operator 封装。

#### Instance

Instance 常用于描述运行时的特定类型(通常是 Operator 或者 Function)的一个具体实例。由于 Apache Flink 主要是用 Java 编写的，所以，这与 Java 中的 Instance 或 Object 的定义相对应。在 Apache Flink 的上下文中，parallel instance 也常用于强调同一 Operator 或者 Function 的多个 instance 以并行的方式运行。

#### Event

Event 是对应用程序建模的域的状态更改的声明。它可以同时为流或批处理应用程序的 input 和 output，也可以单独是 input 或者 output 中的一种。Event 是特殊类型的 Record。

#### Logical Graph/JobGraph

A logical graph is a directed graph where the nodes are Operators and the edges define input/output-relationships of the operators and correspond to data streams or data sets. A logical graph is created by submitting jobs from a Flink Application.

Logical graphs are also often referred to as *dataflow graphs*.

#### Managed State

Managed State 描述了已在框架中注册的应用程序的托管状态。对于托管状态，Apache Flink 会负责持久化和重伸缩等事宜。

#### Operator

Logical Graph 的节点。算子执行某种操作，该操作通常由 Function 执行。Source 和 Sink 是数据输入和数据输出的特殊算子。

#### Operator Chain

算子链由两个或多个连续的 Operator 组成，两者之间没有任何的重新分区。同一算子链内的算子可以彼此直接传递 record，而无需通过序列化或 Flink 的网络栈。

#### Physical Graph/ExecutionGraph

Physical graph 是一个在分布式运行时，把 Logical Graph 转换为可执行的结果。节点是 Task，边表示数据流或数据集的输入/输出关系或 partition。

#### Record

Record 是数据集或数据流的组成元素。Operator 和 Function接收 record 作为输入，并将 record 作为输出发出。

## FAQ

### Flink如何管理内存

- 堆内存管理（积极的内存管理）

  > Flink 并不是将大量对象存在堆上，而是将对象都序列化到一个预分配的内存块上，这个内存块叫做 `MemorySegment`，它代表了一段固定长度的内存（默认大小为 32KB），也是 Flink 中最小的内存分配单元，并且提供了非常高效的读写方法。你可以把 MemorySegment 想象成是为 Flink 定制的 `java.nio.ByteBuffer`。它的底层可以是一个普通的 Java 字节数组（`byte[]`），也可以是一个申请在堆外的 `ByteBuffer`。每条记录都会以序列化的形式存储在一个或多个`MemorySegment`中。Flink 中的 Worker 名叫 TaskManager，是用来运行用户代码的 JVM 进程。TaskManager 的堆内存主要被分成了三个部分：
  >
  > - **Network Buffers:** 一定数量的32KB大小的 buffer，主要用于数据的网络传输。在 TaskManager 启动的时候就会分配。默认数量是 2048 个，可以通过 `taskmanager.network.numberOfBuffers` 来配置。（阅读[这篇文章](http://wuchong.me/blog/2016/04/26/flink-internals-how-to-handle-backpressure/#网络传输中的内存管理)了解更多Network Buffer的管理）
  > - **Memory Manager Pool:** 这是一个由 `MemoryManager` 管理的，由众多`MemorySegment`组成的超大集合。Flink 中的算法（如 sort/shuffle/join）会向这个内存池申请 MemorySegment，将序列化后的数据存于其中，使用完后释放回内存池。默认情况下，池子占了堆内存的 70% 的大小。
  > - **Remaining (Free) Heap:** 这部分的内存是留给用户代码以及 TaskManager 的数据结构使用的。因为这些数据结构一般都很小，所以基本上这些内存都是给用户代码使用的。从GC的角度来看，可以把这里看成的新生代，也就是说这里主要都是由用户代码生成的短期对象。
  >
  > **注意：Memory Manager Pool 主要在Batch模式下使用。在Steaming模式下，该池子不会预分配内存，也不会向该池子请求内存块。也就是说该部分的内存都是可以给用户代码使用的。不过社区是打算在 Streaming 模式下也能将该池子利用起来。**
  >
  > Flink 采用类似 DBMS 的 sort 和 join 算法，直接操作二进制数据，从而使序列化/反序列化带来的开销达到最小。所以 Flink 的内部实现更像 C/C++ 而非 Java。如果需要处理的数据超出了内存限制，则会将部分数据存储到硬盘上。如果要操作多块MemorySegment就像操作一块大的连续内存一样，Flink会使用逻辑视图（`AbstractPagedInputView`）来方便操作。下图描述了 Flink 如何存储序列化后的数据到内存块中，以及在需要的时候如何将数据存储到磁盘上。
  >
  > 从上面我们能够得出 Flink 积极的内存管理以及直接操作二进制数据有以下几点好处：
  >
  > 1. **减少GC压力。**显而易见，因为所有常驻型数据都以二进制的形式存在 Flink 的`MemoryManager`中，这些`MemorySegment`一直呆在老年代而不会被GC回收。其他的数据对象基本上是由用户代码生成的短生命周期对象，这部分对象可以被 Minor GC 快速回收。只要用户不去创建大量类似缓存的常驻型对象，那么老年代的大小是不会变的，Major GC也就永远不会发生。从而有效地降低了垃圾回收的压力。另外，这里的内存块还可以是堆外内存，这可以使得 JVM 内存更小，从而加速垃圾回收。
  > 2. **避免了OOM。**所有的运行时数据结构和算法只能通过内存池申请内存，保证了其使用的内存大小是固定的，不会因为运行时数据结构和算法而发生OOM。在内存吃紧的情况下，算法（sort/join等）会高效地将一大批内存块写到磁盘，之后再读回来。因此，`OutOfMemoryErrors`可以有效地被避免。
  > 3. **节省内存空间。**Java 对象在存储上有很多额外的消耗（如上一节所谈）。如果只存储实际数据的二进制内容，就可以避免这部分消耗。
  > 4. **高效的二进制操作 & 缓存友好的计算。**二进制数据以定义好的格式存储，可以高效地比较与操作。另外，该二进制形式可以把相关的值，以及hash值，键值和指针等相邻地放进内存中。这使得数据结构可以对高速缓存更友好，可以从 L1/L2/L3 缓存获得性能的提升（下文会详细解释）。

- Flink 基于堆内存的内存管理机制已经可以解决很多JVM现存问题了，为什么还要引入堆外内存？

  > 1. 启动超大内存（上百GB）的JVM需要很长时间，GC停留时间也会很长（分钟级）。使用堆外内存的话，可以极大地减小堆内存（只需要分配Remaining Heap那一块），使得 TaskManager 扩展到上百GB内存不是问题。
  > 2. 高效的 IO 操作。堆外内存在写磁盘或网络传输时是 zero-copy，而堆内存的话，至少需要 copy 一次。
  > 3. 堆外内存是进程间共享的。也就是说，即使JVM进程崩溃也不会丢失数据。这可以用来做故障恢复（Flink暂时没有利用起这个，不过未来很可能会去做）。
  >
  > 但是强大的东西总是会有其负面的一面，不然为何大家不都用堆外内存呢。
  >
  > 1. 堆内存的使用、监控、调试都要简单很多。堆外内存意味着更复杂更麻烦。
  > 2. Flink 有时需要分配短生命周期的 `MemorySegment`，这个申请在堆上会更廉价。
  > 3. 有些操作在堆内存上会快一点点。
  >
  > Flink用通过`ByteBuffer.allocateDirect(numBytes)`来申请堆外内存，用 `sun.misc.Unsafe` 来操作堆外内存。

### 布隆过滤器整合State编程解决state过大的问题

### 使用Flink异步IO提升数据处理的性能

### 基于Flink的双流JOIN方案

### Flink如何确保Exactly-once语义

### 理解基于Flink自定义状态管理

### 什么是CEP，如何自定义CEP规则

### Flink如何保证exactly-once语义