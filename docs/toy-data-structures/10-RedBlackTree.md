---
id: 10-RedBlackTree
title: 红黑树
sidebar_label: 红黑树
description: 红黑树
keywords:
  - 红黑树
---

## 14.红黑树 ToyRBTree

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/14-RedBlackTree/ToyRBTree.ts


红黑树其实和 2-3 树的原理是等价的，结构很复杂，但是有着**统计最优的性能**。

红黑树相对于AVL树来说，牺牲了部分平衡性以换取插入/删除操作时少量的旋转操作，整体来说性能要优于AVL树。

`ToyRBTree` 只实现了红黑树的 add 操作，delete 操作暂未实现。

### API:

| 基础      | 增          | 删              | 查           | 深度优先遍历   | 广度优先遍历   |
| --------- | ---------- | ---------       | ----------  | ----------   | ----------   |
| getSize() | add(e)     | ~~removeMin()~~ | contains(e) |  inOrder()   | levelOrder() |
| isEmpty() |            | ~~removeMax()~~ | minimum()   |              |              |
|           |            | ~~remove(e)~~   | maximum()   |              |              |

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::