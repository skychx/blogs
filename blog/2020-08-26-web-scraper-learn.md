---
id: web-scraper-learn
title: 🕷️ Web Scraper——轻量数据爬取利器
author: 卤代烃
author_title: 微信公众号@卤蛋实验室
author_url: https://github.com/skychx
author_image_url: https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/WechatIMG17.jpeg
description: Web Scraper 的优点就是对新手友好，在最初抓取数据时，把底层的编程知识和网页知识都屏蔽了，可以非常快的入门，只需要鼠标点选几下，几分钟就可以搭建一个自定义的爬虫。
draft: false
tags: [爬虫, 'web scraper']
---

![image-20200517183119381](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200517183119381.png)

<!--truncate-->

日常学习工作中，我们多多少少都会遇到一些数据爬取的需求，比如说写论文时要收集相关课题下的论文列表，运营活动时收集用户评价，竞品分析时收集友商数据。


当我们着手准备收集数据时，面对低效的复制黏贴工作，一般都会萌生一个想法：我要是会爬虫就好了，分分钟就把数据爬取下来了。可是当我们搜索相关教程时，往往会被高昂的学习成本所劝退。拿现在最通用的 python 爬虫来说，对于小白来说往往要跨过下面几座大山：



![图片 1](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/图片%201.png)



- 学习一门编程语言：**python**
- 学习网页的基础构成——**HTML** 标签和 **CSS** 选择器，有时候还要了解一些 **JavaScript**
- 学习网络通信的基础协议——**HTTP** 协议
- 学习 python 中常见的**爬虫框架**和**解析库**
- ......



上面的知识点，没有几个月是掌握不完的。而且对于非强需求的人来说，这么多的知识点，你还会**时时刻刻和遗忘做斗争**。

那么有没有不学 python 也能爬取数据的利器呢？结合文章标题，我想你已经知道我要安利什么了。今天我要推荐的就是**Web Scraper**，一个轻量的数据爬虫利器。



![image-20200517155544485](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200517155544485.png)



Web Scraper 的优点就是**对新手友好**，在最初抓取数据时，把底层的编程知识和网页知识都屏蔽了，可以非常快的入门，只需要鼠标点选几下，几分钟就可以搭建一个自定义的爬虫。



我在过去的半年里，写了很多篇关于 Web Scraper 的教程，本文类似于一篇导航文章，把爬虫的注意要点和我的教程连接起来。**最快一个小时，最多一个下午，就可以掌握 Web Scraper 的使用，轻松应对日常生活中的数据爬取需求**。


<br />


## 插件安装



Web Scraper 作为一个 Chrome 插件，网络条件良好的用户可以直接上[chrome 网上应用店](https://chrome.google.com/webstore/category/extensions?utm_source=chrome-ntp-icon)安装，不太好的用户可以下载插件安装包手动安装，具体的安装流程可以看我的教程：[Web Scraper 的下载与安装](https://www.cnblogs.com/web-scraper/p/web_scraper_download.html)。



<br />

## 常见网页的类型



结合我的数据爬取经验和读者反馈，我一般把网页分为三大类型：**单页**、**分页列表**和**筛选表单**。



![image-20200517171919628](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200517171919628.png)



### 1.单页

单页是最常见的网页类型。



我们日常阅读的文章，推文的详情页都可以归于这种类型。作为网页里最简单最常见的类型，Web Scraper 教程里[第一篇爬虫实战](https://sspai.com/post/55496)就拿豆瓣电影作为案例，入门 Web Scraper 的基础使用。



### 2.分页列表

分页列表也是非常常见的网页类型。



互联网的资源可以说是无限的，当我们访问一个网站时，不可能一次性把所有的资源都加载到浏览器里。现在的主流做法是先加载一部分数据，随着用户的交互操作（滚动、筛选、分页）才会加载下一部分数据。



教程里我费了较大的笔墨去讲解 Web Scraper 如何爬取不同分页类型网站的数据，因为内容较多，我放在本文的下一节详细介绍。



### 3.筛选表单

表单类型的网页在 PC 网站上比较常见。



这种网页的最大特点就是有很多筛选项，不同的选择会加载不同的数据，组合多变，交互较为复杂。比如说淘宝的购物筛选页。



![taobao_filter](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/taobao_filter.png)



比较遗憾的是，Web Scraper 对复杂筛选页的支持不是很好，如果筛选条件可以反映在 URL 链接上就可以爬取相关数据，如果不能就无法爬取筛选后的数据。


<br />


## 常见的分页类型



分页列表是很常见的网页类型。根据加载新数据时的交互，我把分页列表分为 3 大类型：**滚动加载**、**分页器**加载和**点击下一页加载**。



![image-20200517172111386](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200517172111386.png)



### 1.滚动加载



![img](https://image-1255652541.cos.ap-shanghai.myqcloud.com/images/20190804162826.gif)



我们在刷朋友圈刷微博的时候，总会强调一个『**刷**』字，因为看动态的时候，当把内容拉到屏幕末尾的时候，APP 就会自动加载下一页的数据，从体验上来看，数据会源源不断的加载出来，永远没有尽头。



Web Scraper 有一个选择器类型叫 `Element scroll down`，意如其名，就是滚动到底部加载的意思。利用这个选择器，就可以抓取滚动加载类型的网页，具体的操作可以见教程：[Web Scraper 抓取「滚动加载」类型网页](https://www.cnblogs.com/web-scraper/p/web_scraper_element_scroll_down.html)。



### 2.分页器加载



![img](https://image-1255652541.cos.ap-shanghai.myqcloud.com/images/Xnip2019-09-15_23-43-29.jpg)



分页器加载数据的网页在 PC 网页上非常常见，点击相关页码就能跳转到对应网页。



Web Scraper 也可以爬取这种类型的网页。相关的教程可见： [Web Scraper 控制链接分页](https://www.cnblogs.com/web-scraper/p/web_scraper_douban_top250_movie.html)、[Web Scraper 抓取分页器类型网页](https://www.cnblogs.com/web-scraper/p/web_scraper_element_click_once.html) 和 [Web Scraper 利用 Link 选择器翻页](https://www.cnblogs.com/web-scraper/p/web-scraper-fanye-link.html)。



### 3.点击下一页加载

点击下一页按钮加载数据其实可以算分页器加载的一种，相当于把分页器中的「下一页」按钮单独拿出来自成一派。



这种网页需要我们手动点击加载按钮来加载新的数据。Web Scraper 可以 `Element click` 选择器抓取这种分页网页，相关教程可见：[Web Scraper 点击「下一页」按钮翻页](https://www.cnblogs.com/web-scraper/p/web_scraper_start_element_click.html)。


<br />


## 进阶使用



学习了上面列出的几篇教程，Web Scraper 这个插件 **60%** 的功能基本上就掌握了。下面是一些进阶内容，掌握了可以更高效的抓取数据。



### 1.列表页 + 详情页



![image-20200517172451885](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200517172451885.png)



互联网资讯最常见的架构就是「**列表页 + 详情页**」的组合结构了。



列表页是内容的标题和摘要，详情页是详细说明。有时候我们需要同时抓取列表页和详情页的数据，Web Scraper 也支持这种常见的需求。我们可以利用 Web Scraper 的 Link 选择器来抓取这种组合网页，具体操作可以看教程：[Web Scraper 抓取二级网面](https://www.cnblogs.com/web-scraper/p/web_scraper_detail_page.html)。



### 2.HTML 标签与 CSS 选择器



![image-20200517172540422](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200517172540422.png)



我在前面说了 Web Scraper 屏蔽了一些网页知识，比如说 HTML 和 CSS 的一些内容，只需要简单的鼠标点选就可以搭建一个自定义爬虫。但是如果我们花半个小时了解一些**基础的 HTML 和 CSS 知识**，其实可以更好的使用 Web Scraper。所以我专门写了一篇介绍 [CSS 选择器](https://www.cnblogs.com/web-scraper/p/web-scraper-css.html)的文章，十分钟读下来可以上手自定义 CSS 选择器。



### 3.正则表达式的使用



![](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/carbon%20%283%29.png)



Web Scraper 其实是一款**专注于文本爬取**的爬虫工具。如果你日常工作中经常和文本打交道，或者使用过一些效率工具，那你一定听说过**正则表达式**。没错，Web Scraper 也支持基础的正则表达式，用来筛选和过滤爬取的文本，我也写了一篇文章[介绍正则表达式](https://www.cnblogs.com/web-scraper/p/web-scraper-regex.html)，如果爬取过程中使用它，可以节省不少数据清洗的时间。



### 4.Sitemap 的导入和导出

SItemap 是个什么东西？其实它就是我们操作 Web Scraper 后生成的**配置文件**，相当于 python 爬虫的源代码。我们可以通过分享 Sitemap 来分享我们制作的爬虫，相关操作我也写了教程：[Web Scraper 导入导出爬虫配置](https://www.cnblogs.com/web-scraper/p/import_export_sitemap.html)。



### 5.换一个存储数据库



![image-20200517174401847](https://image-1255652541.cos.ap-shanghai.myqcloud.com/uPic/image-20200517174401847.png)



Web Scraper 导出数据时有一个缺点，默认使用浏览器的 localStorage 存储数据，导致存储的数据是**乱序**的。这种情况可以通过 Excel 等软件进行排序，也可以通过换一个数据存储库的方式来解决。



Web Scraper 支持 **CouchDB** 数据库，配置成功后导出的数据就是正序了。相关的配置过程可以看我写的教程：[Web Scraper 使用 CouchDB](https://www.cnblogs.com/web-scraper/p/web-scraper-couchdb.html)。

<br />

## Web Scraper 的优点



- **轻量**：非常的轻量。上手只需要一个 Chrome 浏览器和一个 Web Scraper 插件。对于一些限制安装第三方软件的公司电脑，可以很轻易的突破这层限制
- **提效**：Web Scraper 支持绝大多数的网页的爬取，可以无侵入的加入你的日常工作流中
- **快**：抓取速度取决于你的网速与浏览器加载速度，其他的数据采集软件可能有限速现象（充钱就能不限速）

<br />

## Web Scraper 的缺点



- **只支持文本数据抓取**：图片短视频等多媒体数据无法批量抓取
- **不支持范围抓取**：例如一个网页有 1000 条数据，默认是全量抓取的，无法配置抓取范围。想停止抓取，只能断网模拟数据加载完毕的情况
- **不支持复杂网页抓取**：对于那些加了复杂交互、酷炫的特效和反人类的反爬虫网页，Web Scraper 无能为力（其实这种网页写 python 爬虫也挺头疼）
- **导出数据乱序**：想让数据正序就得用 Excel 或者用 CouchDB，相对复杂了一些


<br />


## 总结



掌握了 Web Scraper 的使用，基本上可以应付学习工作中 **90%** 的数据爬取需求。相对于 python 爬虫，虽然灵活度上受到了限制，但是低廉的学习成本可以大大节省学习时间，快速解决手头的工作，提高整体的工作效率。综合来看，Web Scraper 还是非常值得去学习的。


<br />


## 联系我



因为文章发在各大平台上，账号较多不能及时回复评论和私信，有问题可关注公众号 ——「卤蛋实验室」，关注上车防失联。

![img](https://image-1255652541.cos.ap-shanghai.myqcloud.com/images/20190709220018.png)















