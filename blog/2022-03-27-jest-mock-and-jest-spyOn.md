---
draft: true
---

# 玩转 jest mock 功能

## 前言

Jest 是一款 Facebook(Meta) 开源的 JavaScript 测试框架，从[下载量](https://npm-stat.com/charts.html?package=karma&package=jest&package=mocha&from=2021-03-26&to=2022-03-26)上来看，可以说是目前（截止到 2022 年）最火的 JS 单元测试框架了。

由于国内过于“敏捷”的开发大环境，jest 等单元测试框架实际上使用的频率并不高。jest 相关的博客文章也比较极端，要么是非常简单的入门教程，要么是非常辩经的 TDD/BDD 论道，而处于中间的实战经验分享的文章却很少。

本文假设读者有一定的 jest 等测试框架的使用经验，主要是



## 为什么使用 mock 功能

只要有单元测试用例书写经验的同学，一定会有一个共识：**没有副作用的函数是最容易写单测的**。但是现实的工程开发中，副作用是不可避免的。

比如说有个函数会发起非幂等的网络请求，如果运行测试程序的时候运行了该函数，不说网络耗时可能会 block 测试用例的运行，非幂等的请求若不小心改动了线上数据，反而会造成不可预知的 BUG。像这类有副作用的函数就需要对副作用进行 mock 模拟，防止上面说的异常发生。

当然 mock 函数的作用不止于此，从场景上看，mock 可以运用在以下几个场景：

- 相关模块会引起**网络 IO 或文件 IO**，例如 `fetch` 函数和 `fs` 模块
- 相关模块依赖于**全局变量**或不好预测的**异步调用**，例如 `Date` 和 `setTimeout`
- 相关模块调用非 JS 独占，**存在 native 绑定与调用**，例如 `react native`，部分调用会依赖于 `OC` 和 `Java`
- 相关模块会产生**高耗时的 CPU 运算**，直接调用会 block 测试耗时



从 jest 的[功能划分](https://jestjs.io/docs/jest-object)上，mock 可以分为以下几类：

- **Mock Modules**：对模块的 mock，可以 mock 系统模块、第三方模块和业务模块
- **Mock Functions**：对函数的 mock
- **Mock Timers**：对 Date 和 延时器的 mock



> 下面的案例都是手动 mock，自动 mock 不可控暂时不使用



## Mock Modules

由于 **Mock Modules** 可以 mock 任意模块，个人认为这个能力还是非常重要的，所以先写了 4 个 demo：

- **`cpu.ts`**：一个 `local module`，通过未做优化的斐波那契数列公式模拟 **高耗时的 CPU 运算**：

```typescript
export function fib(n: number): number {
  if (n === 1 || n === 2) {
    return 1;
  } else {
    return fib(n - 1) + fib(n - 2)
  }
}
```

- **`modules-local`**：文件中调用了 `cpu.ts` 这个  **`local module`**：

```typescript
import { fib } from './cpu';

export function sum(n: number) {
    const a = fib(n);
    const b = fib(n);

    return a + b;
}
```

- **`modules-core.ts`**：文件中调用了  `path` 和 `fs` 这两个 **`system core module`**，并且它们会产生**文件 IO**：

```typescript
import fs from 'fs';
import path from 'path';

export const readFileFromDisk = () => {
  const filePath = path.join(__dirname, 'file.txt');
  const test = fs.readFileSync(filePath, 'utf-8');

  return {
    path: filePath,
    value: test,
  };
}
```

- **`modules-npm`**：文件中调用了  `axios` 这个 **`npm module`**，并且它会产生**网络 IO**：

```typescript
import axios from 'axios';

export async function fetchData() {
  const response = await axios.get('https://api.github.com/users/skychx');
  return {
    name: response.data!.login, // skychx
    blog: response.data!.blog, //  supercodepower.com
  }
}
```



这样，我们就可以通过 4 个 modules 对 `文件 IO`、`网络 IO`、`高耗时 CPU 运算`，`system core module`、`npm module` 和 `local module` 进行了覆盖。



### 1.jest.mock



### 2.手动模拟（Manual Mocks）

```bash
src/manual-mocks
├── __mocks__ # 在文件的同级目录里创建 __mocks__ 文件夹，mock 相关模块
│   ├── axios.ts
│   ├── cpu.ts
│   ├── fs.ts
│   └── path.ts
├── cpu.ts
├── file.txt
├── modules-core.ts
├── modules-npm.ts
└── modules-user.ts
```





### 3.jest.spyOn

利用 jest.spyOn 也能对模块进行模拟

 jest.spyOn 就如 spy 的含义，jest 会 spy 进入原有的函数里，然后注入一个 jest 函数，记录调用情况



## Mock Timers

### setTimeout





### Date





## 其它技巧

### uon exported funtions



###mock console.log















