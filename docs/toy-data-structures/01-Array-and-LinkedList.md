---
id: 01-Array-and-LinkedList
title: 数组 & 链表
sidebar_label: 数组 & 链表
description: 数组 & 链表
keywords:
  - 数组
  - 链表
---

## 01.数组 ToyArray

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/01-Array/ToyArray.ts

基于 JavaScript 的 `Array` 实现。当然没有原数组强大（JS 数组里面啥都能塞，而且有 30+ 的 API），只实现了基础的「增删查改」功能。

### API:

| 基础          | 增            | 删               | 查          | 改            |
| ------------- | ------------- | ---------------- | ----------- | ------------- |
| getSize()     | add(index, e) | remove(index)    | contains(e) | set(index, e) |
| getCapacity() | unshift(e)    | removeElement(e) | indexOf(e)  |               |
| isEmpty()     | push(e)       | shift()          | get(index)  |               |
|               |               |                  | getFirst()  |               |
|               |               |                  | getLast()   |               |


<br />

## 02.链表 ToyLinkedList

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/02-LinkedList/ToyLinkedList.ts

一个简单的单链表实现

### API:

| 基础          | 增            | 删            | 查         | 改            |
| ------------- | ------------- | ------------- | ---------- | ------------- |
| getSize()     | add(index, e) | remove(index) | get(index) | set(index, e) |
| getCapacity() | addFirst(e)   | removeFirst() | getFirst() |               |
| isEmpty()     | addLast(e)    | removeLast()  | getLast()  |               |


<br />

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::