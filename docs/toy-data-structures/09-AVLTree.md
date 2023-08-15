---
id: 09-AVLTree
title: AVL
sidebar_label: AVL
description: AVL
keywords:
  - AVL
---


## 13.AVL ToyAVLTree

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/13-AVLTree/ToyAVLTree.ts


AVL树得名于它的发明者 G. M. Adelson-Velsky 和 Evgenii Landis（英语：E. M. Landis），他们在1962年的论文《An algorithm for the organization of information》中公开了这一数据结构。

`ToyAVLTree` 为 AVL 的一个实现。

### API:

| 基础      | 增          | 删          | 查           | 深度优先遍历   | 广度优先遍历   |
| --------- | ---------- | ---------   | ----------  | ----------   | ----------   |
| getSize() | add(e)     | removeMin() | contains(e) |  inOrder()   | levelOrder() |
| isEmpty() |            | removeMax() | minimum()   |              |              |
| isBST()   |            | remove(e)   | maximum()   |              |              |
| isBalanced() |         |             |             |              |              |

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::