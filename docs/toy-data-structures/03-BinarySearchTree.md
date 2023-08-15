---
id: 03-BinarySearchTree
title: 二叉搜索树
sidebar_label: 二叉搜索树
description: 二叉搜索树
keywords:
  - 二叉搜索树
---

## 05.二分搜索树 ToyBST

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/05-BinarySearchTree/ToyBST.ts


`ToyBST` 为二分搜索树的一个简单实现，包括**深度优先遍历**（前序/中序/后序遍历）和**广度优先遍历**（层序遍历）。

- 深度优先遍历
  - 利用**递归**实现前序/中序/后序遍历
  - 借助「**栈**」实现非递归的前序遍历
- 广度优先遍历
  - 借助「**队列**」实现层序遍历

### API:

| 基础      | 增          | 删          | 查           | 深度优先遍历   | 广度优先遍历   |
| --------- | ---------- | ---------   | ----------  | ----------   | ----------   |
| getSize() | add(e)     | removeMin() | contains(e) | preOrder()   | levelOrder() |
| isEmpty() |            | removeMax() | minimum()   | preOrderNR() |              |
|           |            | remove(e)   | maximum()   | inOrder()    |              |
|           |            |             |             | postOrder()  |              |

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::