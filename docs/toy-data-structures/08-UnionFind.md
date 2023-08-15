---
id: 08-UnionFind
title: 并查集
sidebar_label: 并查集
description: 并查集
keywords:
  - 并查集
---

## 12.并查集 ToyUnionFind

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/12-UnionFind/ToyUnionFind.ts


并查集是一个非常**有意思**的数据结构，可以合并/查找任意两个不相交元素的集合关系。比较典型的运用有：

- 判断一个大家族里任意两个人是否为亲戚
- 社交网络中任意两人是否为好友关系

本小节有几个经典实现：

- **QuickFindUF**: Quick Find 的并查集实现，查的时间复杂度为 `O(1)`，并的时间复杂度为 `O(n)`
- **QuickUnionUF**: Quick Union 的最简单实现，并查的时间复杂度均为 `O(h)`，h 为树的高度。具体的时间复杂度推导比较繁琐，为 `O(log*n)`（比 `O(logn)` 快，比 `O(1)` 慢）
- **UnionBySizeUF**: 考虑 QuickUnionUF 中的树有可能退化为链表，这里需要减小树的高度，通过维护一个 size 数组，将元素个数少的集合合并到元素个数多的集合上（按大小求并）
- **UnionByHeightUF**: 考虑 QuickUnionUF 中的树有可能退化为链表，这里需要减小树的高度，通过维护一个 rank 数组，将 rank 低的集合合并到 rank 高的集合上（按高度求并，这里的 rank 指树的高度）
- **PathCompressionUF**: 通过路径压缩（Path Compression）进一步降低树的高度，每次执行**查**的操作时进行路径压缩
- **PathCompressionUF2**: 通过路径压缩（Path Compression）进一步降低树的高度，这个版本是递归实现


### API:

| 基础       | 并                  | 查                |
| --------- | ------------------  | ----------------  |
| getSize() | unionElements(p, q) | isConnected(p, q) |

<br />

<br />

<br />

<br />

:::note 一个小尾巴
欢迎关注公众号：**卤代烃实验室**：专注于前端技术、混合开发、图形学领域，只写有深度的技术文章
:::