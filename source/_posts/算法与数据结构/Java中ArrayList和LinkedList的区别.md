---
title: "Java中ArrayList和LinkedList的区别"
date: 2020-04-10T14:41:50+08:00
categories:
    - "Java"
tags:
    - "原理"
---

从数据结构上看，顾名思义，ArrayList是实现了基于动态数组的结构，而LinkedList则是基于实现链表的数据结构。而两种数据结构在程序上体现出来的优缺点在于增删和改查的速率，就此，我们分别作出说明。

<!--more-->

## 数据的更新和查找

ArrayList的所有数据是在同一个地址上,而LinkedList的每个数据都拥有自己的地址。所以在对数据进行查找的时候，由于LinkedList的每个数据地址不一样，get数据的时候ArrayList的速度会优于LinkedList，而更新数据的时候，虽然都是通过循环循环到指定节点修改数据，但LinkedList的查询速度已经是慢的，而且对于LinkedList而言，更新数据时不像ArrayList只需要找到对应下标更新就好，LinkedList需要修改指针，速率不言而喻

## 数据的增加和删除

对于数据的增加元素，ArrayList是通过移动该元素之后的元素位置，其后元素位置全部+1，所以耗时较长，而LinkedList只需要将该元素前的后续指针指向该元素并将该元素的后续指针指向之后的元素即可。与增加相同，删除元素时ArrayList需要将被删除元素之后的元素位置-1，而LinkedList只需要将之后的元素前置指针指向前一元素，前一元素的指针指向后一元素即可。当然，事实上，若是单一元素的增删，尤其是在List末端增删一个元素，二者效率不相上下。

下面我们通过程序检验结果：

```Java
public static final int N = 50000;
static void getTime(List list) {
    insertByPosition(list);
    readByPosition(list);
    updateByPosition(list);
    deleteByPosition(list);
}

// 向list的指定位置插入N个元素，并统计时间
private static void insertByPosition(List list) {
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < N; i++)
        list.add(0, i);
    long endTime = System.currentTimeMillis();
    long interval = endTime - startTime;
    System.out.println(getListName(list) + "插入" + N + "条数据耗时：" + interval
            + " ms");
}

//从list中读取元素，并统计时间
private static void readByPosition(List list) {
    long startTime = System.currentTimeMillis();
    for (int i = 0; i < N; i++){
        list.get(i);
    }
    long endTime = System.currentTimeMillis();
    long interval = endTime - startTime;
    System.out.println(getListName(list) + "查询" + N + "条数据耗时：" + interval
            + "ms");
}

// 从list的随机位置修改元素，并统计时间
private static void updateByPosition(List list) {
    long startTime = System.currentTimeMillis();
    int M = 40000;
    for(int i=0;i<40000;i++){
    int j = (int)(1+Math.random()*(40000-1+1));
    list.set(j, "list");
    }
    long endTime = System.currentTimeMillis();
    long interval = endTime - startTime;
    System.out.println(getListName(list) + "随机修改" + M + "条数据耗时" + interval
            + " ms");
}

// 从list的指定位置删除N个元素，并统计时间
private static void deleteByPosition(List list) {
    long startTime = System.currentTimeMillis();
    // 删除list第一个位置元素
    for (int i = 0; i < N; i++)
        list.remove(0);
    long endTime = System.currentTimeMillis();
    long interval = endTime - startTime;
    System.out.println(getListName(list) + "删除" + N + "条数据耗时" + interval
            + " ms");
}

//获取list类型名称
private static String getListName(List list) {
    if (list instanceof LinkedList) {
        return "LinkedList";
    } else if (list instanceof ArrayList) {
        return "ArrayList";
    } else {
        return "error";
    }
}

public static void main(String[] args) {
    getTime(new ArrayList());
    getTime(new LinkedList());
}
```

然后在我本机的运行结果如下：

![](/media/2020/arraylist-linkedlist.webp)

> 由此可见在程序执行过程中，对大量数据的增删改查时就会面临效率问题，所以对于ArrayList和LinkedList的选择，多数情况下如果查询操作较多ArrayList的效果更好.如果删除,插入较多LinkedList的效果较好.当然，具体怎么用还看具体的需求.
