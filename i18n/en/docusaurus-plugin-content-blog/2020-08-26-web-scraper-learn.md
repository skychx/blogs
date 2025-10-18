---
slug: web-scraper-learn
title: 🕷️ Web Scraper - Lightweight Data Scraping Tool
authors: skychx

description: The advantage of Web Scraper is that it's beginner-friendly. When initially scraping data, it shields underlying programming and web knowledge, allowing for very quick entry. Just a few mouse clicks and you can build a custom scraper in minutes.
draft: false
tags: [web scraping, 'web scraper']
---

![image-20200517183119381](https://image-1255652541.file.myqcloud.com/uPic/image-20200517183119381.png)

{/* truncate */)

In our daily study and work, we more or less encounter some data scraping needs, such as collecting paper lists under related topics when writing papers, collecting user reviews during operational activities, and collecting competitor data during competitive analysis.

When we start preparing to collect data, facing inefficient copy-paste work, we generally develop an idea: if only I knew how to scrape, I could get the data down in minutes. But when we search for related tutorials, we are often discouraged by the high learning cost. Take the most common python scraping currently, for beginners, they often need to overcome the following mountains:

![图片 1](https://image-1255652541.file.myqcloud.com/uPic/图片%201.png)

- Learn a programming language: **python**
- Learn the basic composition of web pages - **HTML** tags and **CSS** selectors, sometimes also need to understand some **JavaScript**
- Learn the basic protocol for network communication - **HTTP** protocol
- Learn common **scraping frameworks** and **parsing libraries** in python
- ......

The above knowledge points cannot be mastered without several months. And for people without strong needs, with so many knowledge points, you will also **constantly battle with forgetting**.

So is there a tool that can scrape data without learning python? Combined with the article title, I think you already know what I'm going to recommend. Today I want to recommend **Web Scraper**, a lightweight data scraping tool.

![image-20200517155544485](https://image-1255652541.file.myqcloud.com/uPic/image-20200517155544485.png)

The advantage of Web Scraper is that it's **beginner-friendly**. When initially scraping data, it shields underlying programming and web knowledge, allowing for very quick entry. Just a few mouse clicks and you can build a custom scraper in minutes.

In the past six months, I've written many tutorials about Web Scraper. This article is similar to a navigation article, connecting the key points of scraping and my tutorials. **Fastest in one hour, at most one afternoon, you can master the use of Web Scraper and easily handle daily data scraping needs**.

<br />

## Plugin Installation

As a Chrome plugin, users with good network conditions can directly install it from the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions?utm_source=chrome-ntp-icon). Users with poor network conditions can download the plugin installation package for manual installation. For specific installation process, you can refer to my tutorial: [Web Scraper Download and Installation](https://www.cnblogs.com/web-scraper/p/web_scraper_download.html).

<br />

## Common Web Page Types

Combined with my data scraping experience and reader feedback, I generally divide web pages into three major types: **single page**, **paginated list**, and **filter form**.

![image-20200517171919628](https://image-1255652541.file.myqcloud.com/uPic/image-20200517171919628.png)

### 1. Single Page

Single pages are the most common web page type.

The articles we read daily and tweet detail pages can all be classified as this type. As the simplest and most common type of web page, the first practical scraping tutorial in the Web Scraper tutorials uses Douban Movies as a case study to introduce the basic usage of Web Scraper.

### 2. Paginated List

Paginated lists are also very common web page types.

Internet resources can be said to be infinite. When we visit a website, it's impossible to load all resources into the browser at once. The current mainstream approach is to load some data first, and then load the next part of the data as users interact (scroll, filter, paginate).

In the tutorial, I spent considerable effort explaining how Web Scraper can scrape data from different pagination types of websites. Because there's a lot of content, I'll introduce it in detail in the next section of this article.

### 3. Filter Form

Form-type web pages are more common on PC websites.

The biggest characteristic of this type of web page is that it has many filter options, and different selections will load different data. The combinations are varied and the interaction is relatively complex. For example, Taobao's shopping filter page.

![taobao_filter](https://image-1255652541.file.myqcloud.com/uPic/taobao_filter.png)

Unfortunately, Web Scraper's support for complex filter pages is not very good. If the filter conditions can be reflected in the URL link, then related data can be scraped; otherwise, filtered data cannot be scraped.

<br />

## Common Pagination Types

Paginated lists are very common web page types. According to the interaction when loading new data, I divide paginated lists into 3 major types: **scroll loading**, **paginator** loading, and **click next page** loading.

![image-20200517172111386](https://image-1255652541.file.myqcloud.com/uPic/image-20200517172111386.png)

### 1. Scroll Loading

![img](https://image-1255652541.file.myqcloud.com/images/20190804162826.gif)

When we browse Moments or Weibo, we always emphasize the word "**browse**" because when looking at updates, when we pull the content to the end of the screen, the APP will automatically load the next page of data. From an experience perspective, data will continuously load, seemingly never-ending.

Web Scraper has a selector type called `Element scroll down`, which means exactly what it says - scroll to the bottom to load. Using this selector, you can scrape scroll-loading type web pages. For specific operations, see the tutorial: [Web Scraper Scraping "Scroll Loading" Type Web Pages](https://www.cnblogs.com/web-scraper/p/web_scraper_element_scroll_down.html).

### 2. Paginator Loading

![img](https://image-1255652541.file.myqcloud.com/images/Xnip2019-09-15_23-43-29.jpg)

Web pages that load data with paginators are very common on PC web pages. Clicking the relevant page number can jump to the corresponding web page.

Web Scraper can also scrape this type of web page. Related tutorials can be found at: [Web Scraper Control Link Pagination](https://www.cnblogs.com/web-scraper/p/web_scraper_douban_top250_movie.html), [Web Scraper Scraping Paginator Type Web Pages](https://www.cnblogs.com/web-scraper/p/web_scraper_element_click_once.html), and [Web Scraper Using Link Selector for Page Turning](https://www.cnblogs.com/web-scraper/p/web-scraper-fanye-link.html).

### 3. Click Next Page Loading

Loading data by clicking the next page button can actually be considered a type of paginator loading, equivalent to taking the "next page" button from the paginator and making it its own category.

This type of web page requires us to manually click the load button to load new data. Web Scraper can use the `Element click` selector to scrape this type of paginated web page. Related tutorials can be found at: [Web Scraper Click "Next Page" Button for Page Turning](https://www.cnblogs.com/web-scraper/p/web_scraper_start_element_click.html).

<br />

## Advanced Usage

After learning the tutorials listed above, you've basically mastered **60%** of Web Scraper's functionality. Below are some advanced content that can help you scrape data more efficiently.

### 1. List Page + Detail Page

![image-20200517172451885](https://image-1255652541.file.myqcloud.com/uPic/image-20200517172451885.png)

The most common architecture for internet information is the combination structure of "**list page + detail page**".

The list page contains content titles and summaries, while the detail page contains detailed explanations. Sometimes we need to scrape data from both list pages and detail pages simultaneously. Web Scraper also supports this common requirement. We can use Web Scraper's Link selector to scrape this combination of web pages. For specific operations, see the tutorial: [Web Scraper Scraping Secondary Pages](https://www.cnblogs.com/web-scraper/p/web_scraper_detail_page.html).

### 2. HTML Tags and CSS Selectors

![image-20200517172540422](https://image-1255652541.file.myqcloud.com/uPic/image-20200517172540422.png)

I mentioned earlier that Web Scraper shields some web knowledge, such as some HTML and CSS content, requiring only simple mouse clicks to build a custom scraper. But if we spend half an hour understanding some **basic HTML and CSS knowledge**, we can actually use Web Scraper better. So I specifically wrote an article introducing [CSS selectors](https://www.cnblogs.com/web-scraper/p/web-scraper-css.html), which takes ten minutes to read and allows you to get started with custom CSS selectors.

### 3. Using Regular Expressions

![](https://image-1255652541.file.myqcloud.com/uPic/carbon%20%283%29.png)

Web Scraper is actually a scraping tool **focused on text scraping**. If you often work with text in your daily work, or have used some efficiency tools, you must have heard of **regular expressions**. That's right, Web Scraper also supports basic regular expressions to filter and filter scraped text. I also wrote an article [introducing regular expressions](https://www.cnblogs.com/web-scraper/p/web-scraper-regex.html). Using it during the scraping process can save a lot of data cleaning time.

### 4. Sitemap Import and Export

What is a Sitemap? It's actually the **configuration file** generated after we operate Web Scraper, equivalent to the source code of a python scraper. We can share our created scrapers by sharing Sitemaps. I also wrote a tutorial for related operations: [Web Scraper Import Export Scraper Configuration](https://www.cnblogs.com/web-scraper/p/import_export_sitemap.html).

### 5. Change Storage Database

![image-20200517174401847](https://image-1255652541.file.myqcloud.com/uPic/image-20200517174401847.png)

When Web Scraper exports data, it has a disadvantage: it uses the browser's localStorage to store data by default, causing the stored data to be **unordered**. This situation can be solved by sorting with software like Excel, or by changing to a different data storage library.

Web Scraper supports **CouchDB** database. After successful configuration, the exported data will be in the correct order. For the related configuration process, see the tutorial I wrote: [Web Scraper Using CouchDB](https://www.cnblogs.com/web-scraper/p/web-scraper-couchdb.html).

<br />

## Advantages of Web Scraper

- **Lightweight**: Very lightweight. Getting started only requires a Chrome browser and a Web Scraper plugin. For company computers that restrict installing third-party software, this restriction can be easily bypassed
- **Efficiency**: Web Scraper supports scraping most web pages and can be non-intrusively integrated into your daily workflow
- **Fast**: Scraping speed depends on your network speed and browser loading speed. Other data collection software may have speed limiting (paying can remove speed limits)

<br />

## Disadvantages of Web Scraper

- **Only supports text data scraping**: Multimedia data such as images and short videos cannot be scraped in bulk
- **Doesn't support range scraping**: For example, if a web page has 1000 data items, it defaults to full scraping. You cannot configure the scraping range. To stop scraping, you can only disconnect from the network to simulate the situation where data loading is complete
- **Doesn't support complex web page scraping**: For web pages with complex interactions, cool special effects, and anti-human anti-scraping measures, Web Scraper is powerless (actually, writing python scrapers for this type of web page is also quite troublesome)
- **Exported data is unordered**: To get data in order, you need to use Excel or CouchDB, which is relatively more complicated

<br />

## Summary

Mastering the use of Web Scraper can basically handle **90%** of data scraping needs in study and work. Compared to python scrapers, although flexibility is limited, the low learning cost can greatly save learning time, quickly solve current work, and improve overall work efficiency. Overall, Web Scraper is still very worth learning.

<br />

## Contact Me

Because the article is published on various platforms with many accounts, I cannot reply to comments and private messages in a timely manner. If you have questions, you can follow the official account - "卤代烃实验室" - to follow and prevent losing contact.

![img](https://image-1255652541.file.myqcloud.com/images/20190709220018.png)

<br />

<br />

<br />

<br />

:::note A small note
Welcome to follow the official account: **卤代烃实验室**: Focus on frontend technology, hybrid development, and graphics, only writing in-depth technical articles
:::