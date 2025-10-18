---
slug: web-vitals
title: 📐 Web Frontend Performance Measurement Library web-vitals Source Code Analysis
authors: skychx

description: web-vitals source code analysis
draft: true
tags: [Web Performance, performance monitoring]
---

[`web-vitals`](https://github.com/GoogleChrome/web-vitals) is a very small library officially launched by Google that encapsulates many common performance data (such as FCP/LCP/CLS, etc.) and exposes simple and unified APIs to users, greatly simplifying the operation threshold.

- Need to have some understanding of Web performance metrics
- Content is relatively limited, you can master some performance API usage encapsulation techniques by reading the source code
- Because it highly depends on historical design issues of compatible browsers and APIs, some implementations are quite dirty, but this part is not the focus
- Learn higher-level encapsulation techniques