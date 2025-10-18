---
slug: houyi-caijiqi
title: 🦀️ Houyi Web Scraper—The Most Conscientious Web Scraping Software
authors: skychx
description: In 2020, if I had to recommend a data collection software for the general public, it would definitely be Houyi Web Scraper. Compared to the web scraper I previously recommended, if web scraper is a small and precise Swiss army knife, then Houyi Web Scraper is a large and comprehensive heavy weapon that can basically solve all data scraping problems.
draft: false
tags: [web scraping, 'data collection']
---

![Houyi Web Scraper header](https://image-1255652541.file.myqcloud.com/uPic/houyiheader.png)

In 2020, if I had to recommend a data collection software for the general public, it would definitely be [Houyi Web Scraper](http://www.houyicaiji.com/). Compared to the [web scraper](https://sspai.com/post/60572) I previously recommended, if web scraper is a small and precise Swiss army knife, then Houyi Web Scraper is a large and comprehensive heavy weapon that can basically solve all data scraping problems.

Let's discuss the excellent features of this software.

{/* truncate */}

<br />

## 1. Product Features

### 1. Cross-Platform

Houyi Web Scraper is a desktop application software that supports three major operating systems: Linux, Windows, and Mac. It can be directly [downloaded for free](http://www.houyicaiji.com/?type=download) from the official website.

![Supported platforms](https://image-1255652541.file.myqcloud.com/uPic/image-20200726123053850.png)

### 2. Powerful Features

Houyi Web Scraper divides collection work into two types: **Smart Mode** and **Flowchart Mode**.

![Smart Mode and Flowchart Mode](https://image-1255652541.file.myqcloud.com/uPic/image-20200726122953789.png)

[Smart Mode](http://www.houyicaiji.com/?type=post&pid=831) means that after loading a webpage, the software automatically analyzes the webpage structure, intelligently identifies webpage content, and simplifies the operation process. This mode is more suitable for simple webpages. After my testing, the recognition accuracy is quite high.

[Flowchart Mode](http://www.houyicaiji.com/?type=post&pid=831) is essentially **visual programming**. We can use various controls provided by Houyi Web Scraper to simulate various conditional control statements in programming languages, thereby simulating various behaviors of real people browsing webpages to scrape data.

### 3. Unlimited Export

This can be said to be the **most conscientious** feature of Houyi Web Scraper.

There are many data collection software on the market that, for commercial purposes, more or less restrict data export. People unfamiliar with the tricks often work hard to collect a bunch of data with related software, only to find that exporting data requires payment.

Houyi Web Scraper doesn't have this problem. Its [paid features](http://www.houyicaiji.com/?type=pricing) are mainly reflected in advanced features such as IP pools and collection acceleration. Not only is data export free, but it also supports multiple export formats including Excel, CSV, TXT, and HTML, and supports direct export to databases, which is completely sufficient for ordinary users.

![Export options](https://image-1255652541.file.myqcloud.com/uPic/export.png)

### 4. Detailed Tutorials

Before writing this article, I thought about writing several tutorials on using Houyi Web Scraper first, but after looking at their official tutorials, I knew it wasn't necessary because they are written **too detailed**.

Houyi Web Scraper's official website provides two types of tutorials: one is [video tutorials](http://www.houyicaiji.com/?type=videolist), each video is about five minutes long; the other is [graphic tutorials](http://www.houyicaiji.com/?type=post&pid=2619) with step-by-step teaching. After watching these two types of tutorials, you can also check their [documentation center](http://www.houyicaiji.com/?type=tutorial), which is also written in great detail and basically covers all functional points of the software.

![Tutorial examples](https://image-1255652541.file.myqcloud.com/uPic/image-20200726131724807.png)

<br />

## 2. Basic Functions

### 1. Data Scraping

Basic data scraping is very simple: we just click the "Add Field" button, and a selection wand will appear. Then we click on the data we want to scrape, and we can collect the data:

![Data selection](https://image-1255652541.file.myqcloud.com/uPic/select.gif)

### 2. Pagination Function

When I introduced [web scraper](https://sspai.com/post/60572), I divided webpage pagination into 3 major categories: **scroll loading**, **paginator loading**, and **click next page loading**.

![Three pagination types](https://image-1255652541.file.myqcloud.com/uPic/image-20200517172111386.png)

Houyi Web Scraper also fully supports these three basic pagination types.

Unlike web scraper where pagination functions are scattered across various selectors, Houyi Web Scraper's pagination configuration is concentrated in one place. As long as you select from the dropdown, you can easily configure pagination mode. Related configuration tutorials can be found on the official website tutorial: [How to set up pagination](http://www.houyicaiji.com/?type=post&pid=7489).

![Pagination configuration](https://image-1255652541.file.myqcloud.com/uPic/image-20200726122737844.png)

### 3. Complex Forms

For some webpages with multi-level linked filtering, Houyi Web Scraper can also handle them well. We can use the flowchart mode in Houyi Web Scraper to customize some interaction rules.

For example, in the image below, I used the click component in flowchart mode to simulate clicking the filter button, which is very convenient.

![Complex form handling](https://image-1255652541.file.myqcloud.com/uPic/genshuixue.gif)

<br />

## 3. Advanced Usage

### 1. Data Cleaning

When I introduced [web scraper](https://sspai.com/post/60572), I said that web scraper only provides basic regex matching functionality, which can perform preliminary data cleaning during data scraping.

In comparison, Houyi Web Scraper provides more features: powerful filtering configuration, complete regex functionality, and comprehensive text processing configuration. Of course, powerful features also bring increased complexity, requiring more patience to learn and use.

Below are tutorials related to data cleaning on the official website that everyone can refer to for learning:

- [How to set up data filtering](http://www.houyicaiji.com/?type=post&pid=4157) explains basic data cleaning functionality, which can avoid invalid collection during the collection process (for example, when collecting data from a certain Weibo blogger, you can filter out the first pinned Weibo data and only collect normal timeline Weibo posts)
- [How to set up collection scope](http://www.houyicaiji.com/?type=post&pid=7803) explains filtering unnecessary collection items during the collection process, making it convenient to customize collection scope (for example, when collecting Douban Movie TOP 250, only collect the top 100 data instead of all 250 items)
- [How to configure collection fields](http://www.houyicaiji.com/?type=post&pid=1001) explains how to customize the minimum fields for collection and supports stacking processing, allowing multiple matching rules to be applied to one field (for example, if you only want to collect the number from the text "1024 likes", you can set corresponding rules to filter out Chinese characters)

### 2. Flowchart Mode

This article also introduced earlier that flowchart mode is essentially **visual programming**. We can use various controls provided by Houyi Web Scraper to simulate various conditional control statements in programming languages, thereby simulating various behaviors of real people browsing webpages to scrape data.

For example, the flowchart below simulates the behavior of real people browsing Weibo to scrape related data.

![Flowchart example](https://image-1255652541.file.myqcloud.com/uPic/image-20200726121556512.png)

After several personal tests, I believe that flowchart mode has a certain learning threshold, but compared to learning Python web scraping from scratch, the learning curve is much gentler. If you're very interested in flowchart mode, you can learn on the [official website](http://www.houyicaiji.com/?type=post&pid=1437), which is written in great detail.

### 3. XPath/CSS/Regex

No matter what web scraping software, they are all based on certain rules to scrape data. XPath/CSS/Regex are several common matching rules. Houyi Web Scraper supports customizing these types of selectors, allowing more flexible selection of data to be scraped.

For example, if there is data A on a certain webpage that only appears in popup form when the mouse hovers over the corresponding text, we can write a corresponding selector ourselves to filter the data.

![Custom selector example](https://image-1255652541.file.myqcloud.com/uPic/image-20200726144840886.png)

**XPath**

XPath is a data query language widely used in web scraping. We can learn the application of this language through [XPath tutorials](https://www.runoob.com/xpath/xpath-tutorial.html).

**CSS**

The CSS here specifically refers to CSS selectors. When I previously introduced advanced techniques for web scraper, I explained the usage scenarios and precautions of CSS selectors. Interested people can read my [CSS selector tutorial](https://www.cnblogs.com/web-scraper/p/web-scraper-css.html).

**Regex**

Regex refers to regular expressions. We can also use regular expressions to select data. I have also written some [regular expression tutorials](https://www.cnblogs.com/web-scraper/p/web-scraper-regex.html). However, personally, I believe that in the field selector scenario, regular expressions are not as useful as XPath and CSS selectors.

### 4. Scheduled Scraping/IP Pool/Captcha Recognition

These are all paid features of Houyi Web Scraper. I haven't purchased a membership, so I don't know what the user experience is like. Here I'll provide a small explanation to clarify what these terms mean.

**Scheduled Scraping**

Scheduled scraping is very easy to understand - it means that at a fixed time, the web scraping software will automatically scrape data. There are some price comparison software on the market that run many scheduled web scrapers behind the scenes, scraping price information every few minutes to achieve price monitoring purposes.

**IP Pool**

90% of internet traffic is contributed by web scrapers. To reduce server pressure, internet companies have some risk control strategies, one of which is to limit IP traffic. For example, if an internet company's backend detects that a certain IP has a large number of data requests exceeding the normal range, it will temporarily block that IP and not return related data. At this time, web scraping software will maintain an IP pool itself, using different IPs to send requests, reducing the probability of IP blocking.

**Captcha Recognition**

This function means it has a built-in captcha recognizer that can implement machine captcha recognition or manual captcha recognition, which is also a method to bypass website risk control.

<br />

## 4. Summary

Personally, I believe Houyi Web Scraper is an excellent data collection software. The free features it provides can solve the data scraping needs of most programming beginners.

If you have some programming foundation, you can clearly see that some functions are encapsulations of programming language logic. For example, flowchart mode is an encapsulation of process control, and data cleaning functionality is an encapsulation of string processing functions. These advanced features expand the capabilities of Houyi Web Scraper but also increase the learning difficulty.

From my perspective, if it's lightweight data scraping needs, I prefer to use web scraper; if the needs are more complex, Houyi Web Scraper is a good choice; if it involves advanced needs like scheduled scraping, writing your own web scraping code is actually more controllable.

In conclusion, Houyi Web Scraper is an excellent data collection software, and I highly recommend everyone to learn and use it.

<br />

## Contact Me

Since articles are published on various platforms and I have many accounts, I cannot reply to comments and private messages in time. If you have questions, you can follow the official account — "卤代烃实验室" (or search for egglabs on WeChat) to follow and stay connected.

![WeChat account QR code](https://image-1255652541.file.myqcloud.com/images/20190709220018.png)

<br />

<br />

<br />

<br />

:::note A little tail
Welcome to follow our official account: **卤代烃实验室**: Focusing on frontend technology, hybrid development, and computer graphics, only writing in-depth technical articles
:::