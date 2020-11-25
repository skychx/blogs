最近学习图形学，需要配置 C++ 环境，平时 Xcode 用习惯了，造的这个轮子又没什么第三方依赖，所以出于迅速上手跑代码的目的，直接用 Xcode 写 C++ 了。

课程的第一课时需要倒入当前目录下的 obj 文件，这时候需要配置相对路径，先做个简单的笔记，后面再整理。

`Product -> Scheme -> Edit Scheme`

`Run -> Options -> Working Directory`

勾选 `Using custom working directory`，然后点击红圈里的文件夹图标，选择项目文件就可

🔗 参考连接：[Xcode 读取代码所在目录txt或文件](https://blog.csdn.net/u010053344/article/details/51379222)