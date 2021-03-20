---
id: index
title: 前言
sidebar_label: 前言
description: 前言
keywords:
---

用 TypeScript 实现的基础数据结构

> TypeScript 最后会编译为 JavaScript。V8 在执行 JS 时，内部会有各种神奇的优化，所以在部分测试用例里时间复杂度会出现理论与实践不一致的情况。


## 调试

调试代码前先确保电脑全局安装了 `typescript`、`ts-node` 和 `vscode`

配置 launch.json 如下：
```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Current TS File",
            "type": "pwa-node",
            "request": "launch",
            "program": "${workspaceRoot}/node_modules/ts-node/dist/bin.js",
            "args": [
                "${relativeFile}"
            ],
            "cwd": "${workspaceRoot}",
            "sourceMaps": true,
            "resolveSourceMapLocations": [
                "${workspaceFolder}/**",
                "!**/node_modules/**"
            ],
        }
    ]
}
```

然后就可以直接用 vscode 调试 TS 代码了。