---
draft: true
---

# Mastering Jest Mock Features

## Introduction

Jest is a JavaScript testing framework open-sourced by Facebook (Meta). Based on [download statistics](https://npm-stat.com/charts.html?package=karma&package=jest&package=mocha&from=2021-03-26&to=2022-03-26), it can be considered the most popular JS unit testing framework as of 2022.

Due to the overly "agile" development environment in China, unit testing frameworks like Jest are not actually used very frequently. Jest-related blog articles tend to be quite extreme - either very basic beginner tutorials or highly theoretical TDD/BDD discussions. There are very few articles that share practical, intermediate-level experience.

This article assumes that readers have some experience with testing frameworks like Jest and will mainly focus on practical applications.

## Why Use Mock Features

Anyone with experience writing unit test cases will agree on one principle: **functions without side effects are the easiest to test**. However, in real-world engineering development, side effects are unavoidable.

For example, consider a function that makes non-idempotent network requests. If this function runs during testing, not only can network latency block the test execution, but non-idempotent requests might accidentally modify production data, causing unpredictable bugs. Functions with side effects like these need to have their side effects mocked to prevent such issues.

Of course, the purpose of mock functions goes beyond this. From a scenario perspective, mocks can be applied in the following situations:

- Related modules cause **network IO or file IO**, such as `fetch` functions and `fs` modules
- Related modules depend on **global variables** or unpredictable **async calls**, such as `Date` and `setTimeout`
- Related modules call non-JS-exclusive functionality with **native bindings and calls**, such as React Native, where some calls depend on Objective-C and Java
- Related modules perform **high CPU consumption operations** that would block test execution when called directly

According to Jest's [feature categorization](https://jestjs.io/docs/jest-object), mocks can be divided into the following types:

- **Mock Modules**: Mocking modules, can mock system modules, third-party modules, and business modules
- **Mock Functions**: Mocking functions
- **Mock Timers**: Mocking Date and timers

> The examples below all use manual mocking. Auto mocking is not controllable, so we won't use it for now.

## Mock Modules

Since **Mock Modules** can mock any module, I personally find this capability very important, so I've written 4 demos:

- **`cpu.ts`**: A `local module` that simulates **high CPU consumption** using an unoptimized Fibonacci sequence formula:

```typescript
export function fib(n: number): number {
  if (n === 1 || n === 2) {
    return 1;
  } else {
    return fib(n - 1) + fib(n - 2)
  }
}
```

- **`modules-local.ts`**: A file that calls `cpu.ts` this `local module`:

```typescript
import { fib } from './cpu';

export function sum(n: number) {
    const a = fib(n);
    const b = fib(n);

    return a + b;
}
```

- **`modules-core.ts`**: A file that calls `path` and `fs` these two `system core modules`, and they generate **file IO**:

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

- **`modules-npm.ts`**: A file that calls `axios` this `npm module`, and it generates **network IO**:

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

This way, we can cover `file IO`, `network IO`, `high CPU consumption operations`, `system core modules`, `npm modules`, and `local modules` through these 4 modules.

### 1. jest.mock

### 2. Manual Mocks

```bash
src/manual-mocks
├── __mocks__ # Create __mocks__ folder in the same directory as the file to mock related modules
│   ├── axios.ts
│   ├── cpu.ts
│   ├── fs.ts
│   └── path.ts
├── cpu.ts
├── file.txt
├── modules-core.ts
├── modules-npm.ts
└── modules-user.ts
```

### 3. jest.spyOn

You can also use jest.spyOn to mock modules.

jest.spyOn, as the name suggests, acts like a spy. Jest will spy into the original function and inject a Jest function to record call information.

## Mock Timers

### setTimeout

### Date

## Other Techniques

### Unexported Functions

### Mock console.log