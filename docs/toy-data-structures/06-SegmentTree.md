---
id: 06-SegmentTree
title: 线段树
sidebar_label: 线段树
description: 线段树
keywords:
  - 线段树
---

## 10.线段树 ToySegmentTree

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/10-SegmentTree/ToySegmentTree.ts


线段树专注于研究**区间**问题，把各个区间的值记录为一棵树，然后当成一颗允许叶子节点为 null 的「满二叉树」存储到数组里。线段树在算法竞赛里比较常见，日常运用比较少。

优点是**更新/查询**操作的时间复杂度都可以优化到 `O(logn)`，缺点是会浪费不少存储空间（极限情况下有一半的空间都会浪费）。


### API:

| 基础       |  增  |  删  | 查           | 改            |
| --------- | ---- | ---- | ----------  | ------------  |
| getSize() |      |      | get(index)  | set(index, e) |
|           |      |      | query(l, r) |               |

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤蛋实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::