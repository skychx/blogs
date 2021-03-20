---
id: 04-Set-and-Map
title: Set & Map
sidebar_label: Set & Map
description: Set & Map
keywords:
  - Set
  - Map
---


## 06.集合 ToySet

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/06-Set/ToySet.d.ts

`ToySet` 有两个实现：

> 有序无序有两个角度，一种是按照元素存取的顺序，一种是元素和元素之间的关系。下文的有序无序指的是后者

- **有序集合**：Set 中的元素都是有序排列的（基于搜索树实现）
  - **BSTSet**：基于 BST 二分搜索树实现，`add` `has` `delete` 时间复杂度平均为 `O(logn)`，最坏情况下退化为链表，时间复杂度变为 `O(n)`
  - **AVLSet**：基于 AVL Tree 实现，时间复杂度稳定为 `O(logn)`，根据 AVL 特性，不会退化为链表。
- **无序集合**：Set 中的元素都是无序排列的
  - **JS Set**：ES6 内置 Set，性能最优
  - **JS Object Set**：ES6 Object 模拟的 Set，只比 Set 慢一点点（根据 JS 规范，Object string key 排序是按插入顺序排序的）
  - **LinkedListSet**：基于 LinkedList 链表实现，`add` `has` `delete` 时间复杂度均为 `O(n)`
  - **ArraySet**：基于 ToyArray 动态数组实现，`add` `has` `delete` 时间复杂度均为 `O(n)`
  - **HashTableSet**：HashTable 模拟的 Set

### API:

| 基础       | 增         | 删        | 查         | 改   |
| --------- | ---------- | --------- | ---------- | ---- |
| getSize() | add(e)     | delete(e) | has(e)     |      |
| isEmpty() |            |           |            |      |

<br />

## 07.映射 ToyMap

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/07-Map/ToyMap.d.ts


> 有序无序有两个角度，一种是按照元素存取的顺序，一种是元素和元素之间的关系。下文的有序无序指的是后者

`ToyMap` 有两个实现：

- **有序映射**：Map 中的元素都是有序排列的（基于搜索树实现）
  - **BSTMap**：基于 BST 二分搜索树实现，`add` `get` `has` `delete` `set` 时间复杂度平均为 `O(logn)`，最坏情况下退化为链表，时间复杂度变为 `O(n)`
  - **AVLMap**：基于 AVL Tree 实现，时间复杂度稳定为 `O(logn)`，根据 AVL 特性，不会退化为链表。
- **无序映射**：Map 中的元素都是无序排列的
  - **JS Map**：ES6 内置 Map，性能最优
  - **JS Object Map**：ES6 Object 模拟的 Map，只比 Map 慢一点点（根据 JS 规范，Object string key 排序是按插入顺序排序的）
  - **LinkedListMap**：基于 LinkedList 链表实现，`add` `get` `has` `delete` `set` 时间复杂度均为 `O(n)`
  - **HashTableMap**：HashTable 模拟的 Map

### API:

| 基础       | 增         | 删        | 查         | 改         |
| --------- | ---------- | --------- | ---------- | --------- |
| getSize() | add(k, v)  | delete(k) | get(k)     | set(k, v) |
| isEmpty() |            |           | has(k)     |           |

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::