---
title: "HashMap、Hashtable等Map接口的实现和原理"
date: 2020-04-11T18:51:09+08:00
draft: true
categories:
  - "Java"
tags:
  - "原理"
---

Map 集合和 Collection 集合不同，Map 集合是基于键（key）/值（value）的映射，Collection中的集合，元素是孤立存在的，向集合中存储元素采用一个个元素的方式存储；Map中的集合，元素是成对存在的，每个元素由键与值两部分组成，通过键可以找对所对应的值。

Collection中的集合称为单列集合，Map中的集合称为双列集合。需要注意的是，Map中的集合不能包含重复的键，值可以重复；每个键只能对应一个值。
![](/media/2020/map-interface-1.png)

<!--more-->

## 比较

||HashMap|TreeMap|HashTable|
|---|---|---|---|
|实现|基于哈希散列表实现|SortMap接口，基于红黑树|继承自Dictionary|
|存储|随机存储|默认按键的升序排序|随机存储|
|遍历|Iterator遍历是随机的|Iterator遍历是排序的|Enumeration和Iterator|
|性能损耗|几乎无|插入、删除|几乎无|
|键值对|只允许键、值均为null|键、值都不能为null|不允许null|
|线程安全|否|否|是|
|效率|高|低|高|

一般情况下我们选用HashMap，因为HashMap的键值对在取出时是随机的，其依据键的hashCode和键的equals方法存取数据，具有很快的访问速度，所以在Map中插入、删除及索引元素时其是效率最高的实现。而TreeMap的键值对在取出时是排过序的，所以效率会低点。

## HashTable

散列表（Hash table，也叫哈希表），是根据键（Key）而直接访问在内存储存位置的数据结构。也就是说，它通过计算一个关于键值的函数，将所需查询的数据映射到表中一个位置来访问记录，这加快了查找速度。这个映射函数称做散列函数，存放记录的数组称做散列表。

### HashMap和hashtable的区别

* HashMap允许将 null 作为一个 entry 的 key 或者 value，而 Hashtable 不允许
* HashMap 把 Hashtable 的 contains 方法去掉了，改成 containsValue 和 containsKey。因为 contains 方法容易让人引起误解。
* HashTable 继承自 Dictionary 类，而HashMap是Java1.2 引进的 Map interface 的一个实现
* HashTable 的方法是 Synchronize 的，而HashMap不是，在多个线程访问 Hashtable 时，不需要自己为它的方法实现同步，而 HashMap 就必须为之提供外同步
* Hashtable 和 HashMap 采用的 hash/rehash 算法都大概一样，所以性能不会有很大的差异

### HashMap 不是线程安全的（没有锁）

HashMap 是 map 接口的实现类，是将键映射到值的对象，其中键和值都是对象，并且不能包含重复键，但可以包含重复值。HashMap 允许 null key 和 null value，而 HashTable 不允许。

### LinkedHashMap

大多数情况下，只要不涉及线程安全问题，Map基本都可以使用HashMap，不过HashMap有一个问题，就是迭代HashMap的顺序并不是HashMap放置的顺序，也就是无序。HashMap的这一缺点往往会带来困扰，因为有些场景，我们期待一个有序的Map.这就是我们的LinkedHashMap,

### Hashtable 是线程安全 （有锁-同步机制）

HashMap 是 HashTable 的轻量级实现，他们都完成了Map 接口，主要区别在于 HashMap 允许 null key 和 null value,由于非线程安全，效率上可能高于 Hashtable。

```Java
    //get它搞成了同步方法，保证了get的安全性
    public synchronized V get(Object key) {
    
    }
    //synchronized,同样
    public synchronized V put(K key, V value) {
    
    }
    //也是搞成了同步方法
    public synchronized V remove(Object key) {
    
    }
```

### ConcurrentHashMap和Hashtable的区别

ConcurrentHashMap基于内存屏障（Volatile）实现，而HashTable基于同步锁性能相对较低

它们都可以用于多线程的环境，但是当Hashtable的大小增加到一定的时候，性能会急剧下降，因为迭代时需要被锁定很长的时间。因为ConcurrentHashMap引入了分割(segmentation)，不论它变得多么大，仅仅需要锁定map的某个部分，而其它的线程不需要等到迭代完成才能访问map。简而言之，在迭代的过程中，ConcurrentHashMap仅仅锁定map的某个部分，而Hashtable则会锁定整个map。
 
## 扩展阅读

1. [IBM 探索 ConcurrentHashMap 高并发性的实现机制](https://www.ibm.com/developerworks/cn/java/java-lo-concurrenthashmap/index.html)



