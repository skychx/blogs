---
id: 02-Stack-and-Queue
title: 栈 & 队列
sidebar_label: 栈 & 队列
description: 栈 & 队列
keywords:
  - 栈
  - 队列
---

## 03.栈 ToyStack

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/03-Stack/ToyStack.d.ts


`ToyStack` 有两个实现：

- 基于 `ToyArray` 实现的 `ArrayStack`，在数组尾模拟栈
- 基于 `ToyLinkedList` 实现的 `LinkedListStack`，在链表头模拟栈

### API:

| 基础      | 增      | 删    | 查     | 改   |
| --------- | ------- | ----- | ------ | ---- |
| getSize() | push(e) | pop() | peek() |      |
| isEmpty() |         |       |        |      |


<br />

## 04.队列 ToyQueue

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/04-Queue/ToyQueue.d.ts


`ToyQueue` 有三个实现：

- 基于 `ToyArray` 实现的 `ArrayQueue`，实现最为简单，缺点是 `dequeue()` 时间复杂度为 `O(n)`
- `LoopQueue`，底层依旧是数组，但是把 `dequeue()` 时间复杂度优化为 `O(1)`
- `LinkedListQueue`，基于链表实现的队列

### API:

| 基础      | 增         | 删        | 查         | 改   |
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