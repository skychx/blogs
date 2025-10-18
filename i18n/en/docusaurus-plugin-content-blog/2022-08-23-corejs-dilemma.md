---
draft: true
tags: [Web Performance]
---

CoreJS is still too inconspicuous.

## The Low-Profile CoreJS

### 1.

- Compared to infrastructure projects like webpack and babel, it has high download counts but low attention
  - Reason 1: Configuration is far less complex than webpack and babel
  - Reason 2: Toolchains like babel have done good encapsulation, hiding many details
  - Reason 3: Implementation principles are relatively simple, actually it's all dirty work with low "playability", CoreJS is already very complete
- Project maintainer is highly centralized
  - 99.99% of code is maintained by one person
  - Basically no maintenance after the maintainer was imprisoned, seems to still be looking for a job now

### 2. Compared to frontend infrastructure like webpack, attention is low

## Large Bundle Size

### 1. Base ES3 instead of ES5

Large bundle size inflation. Combined with the previous blog post, now everything is basically ES5 base, but CoreJS adapts to ES3, adding much unnecessary code.

### 2. CoreJS@4 release is uncertain

CoreJS4 has optimizations, but there's no energy or money.

### 3. Accuracy > Performance

Many APIs were implemented early, but might have bugs, all of these have polyfills.

## Some Poorly Handled Issues, Not Related to CoreJS

### 1. Dynamic nature of JS language makes it impossible to accurately identify APIs

For example, `includes` - it's unclear whether it's using the array version or string version.

### 2. Most people can't distinguish between global mode and pure mode

Some third-party libraries use CoreJS in their source code, but use global mode instead of pure mode, leading to global property pollution which might cause bugs.

### 3. Pure mode didn't recognize target in early versions

Pure mode doesn't recognize target, leading to bundle size growth.