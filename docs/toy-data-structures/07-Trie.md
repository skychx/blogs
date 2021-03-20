---
id: 07-Trie
title: 字典树/前缀树
sidebar_label: 字典树/前缀树
description: 字典树/前缀树
keywords:
  - 字典树/前缀树
---

## 11.字典树/前缀树 ToyTrie

> 代码链接：https://github.com/skychx/Toy-Data-Structures/blob/main/11-Trie/ToyTrie.ts

顾名思义，Trie 是专门为**字典查询**这个场景设计的高级数据结构，优点就是时间复杂度可以控制在 `O(m)`，m 是字符串的长度；缺点就是空间浪费了不少（主要用来存储指针了）。


### API:

| 基础       |  增       |  删          | 查                  | 改   |
| --------- | --------- | ------------ | ------------------ | ---- |
| getSize() | add(word) | remove(word) | has(word)          |      |
|           |           |              | startswith(prefix) |      |

<br />