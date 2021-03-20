---
id: 05-Heap-and-PriorityQueue
title: 堆 & 优先队列
sidebar_label: 堆 & 优先队列
description: 堆 & 优先队列
keywords:
  - 堆
  - 优先队列
---

## 08.堆 ToyHeap

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/08-Heap/ToyHeap.d.ts

使用**完全二叉树**表示一个堆（二叉堆），因为完全二叉树的性质，可以直接用数组存储二叉堆。

这里实现了最大堆 `ToyMaxHeap` 和最小堆 `ToyMinHeap`。其实两者只有数值比较处相反，其它的实现逻辑完全一致。


### API:

| 基础       | 增         | 删        | 查         | 改         |
| --------- | ---------- | --------- | --------- | ---------  |
| getSize() | push(e)    | pop()     | peek()    | replace(e) |
| isEmpty() |            |           | has(k)    |            |

<br />

## 09.优先队列 ToyPriorityQueue

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/09-PriorityQueue/ToyPriorityQueue.ts


本质上还是一个队列，但是出队时机和入队时机无关，需要**动态**的选择优先级最高的任务出队。

- 优先队列的**最优方案**就是用最大堆 `ToyMaxHeap` 实现，这时候入队出队的时间复杂度稳定为 `O(logn)`
- 数组实现的优先队列内部是无序的，所以出队操作需要遍历整个数组，时间复杂度为 `O(n)`


### API:

| 基础       | 增         | 删        | 查          | 改   |
| --------- | ---------- | --------- | ---------- | ---- |
| getSize() | enqueue(e) | dequeue() | getFront() |      |
| isEmpty() |            |           |            |      |

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::