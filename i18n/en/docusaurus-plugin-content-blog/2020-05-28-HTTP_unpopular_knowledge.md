---
slug: HTTP_unpopular_knowledge
title: 🌐 Hidden Pitfalls in HTTP Specifications
authors: skychx
description: Although HTTP has many advantages, the protocol specification contains numerous hidden pitfalls due to various compromises and limitations during its definition. This article summarizes common pitfalls in HTTP specifications to help developers consciously avoid them and improve development experience. 1. Referer 2. Should spaces be encoded as %20 or + in HTTP requests? 3. Is X-Forwarded-For the real IP? Most HTTP field values are separated by commas ",", while Cookie is not part of HTTP standard and uses semicolon ";" as separator
draft: false
tags: [HTTP, network]
---

The HTTP protocol is arguably the most familiar network protocol for developers. Its characteristics of being "simple and easy to understand" and "easy to extend" have made it the most widely used application-layer protocol.

Despite its many advantages, the protocol specification contains numerous hidden pitfalls due to various compromises and limitations during its definition, which can easily trap unsuspecting developers. **This article summarizes common pitfalls in HTTP specifications** to help developers consciously avoid them and improve their development experience.

{/* truncate */}


## 1. `Referer`

The HTTP standard misspelled `Referrer` as `Referer` (missing an 'r'), which可以说是 one of the most famous typos in computer history.

The main purpose of `Referer` is to **carry the source address of the current request, commonly used in anti-crawling and hotlinking prevention**. The recent Sina image hosting incident, where Sina suddenly started checking the HTTP `Referer` header and stopped returning images for non-Sina domains, caused images on many small and medium blogs that were leeching traffic to break.

Although the HTTP standard got `Referer` wrong, other standards that can control `Referer` didn't follow this mistake.

For example, the **<meta />** tag that prevents web pages from automatically sending the `Referer` header uses the correct spelling:

```html
<!-- Globally prohibit sending referrer -->
<meta name="referrer" content="no-referrer" />
```

Another noteworthy point is browser network requests. For security and stability reasons, request headers like `Referer` can only be controlled by the browser during network requests and cannot be directly manipulated. We can only control them through some properties. For example, with the **Fetch function**, we can control it through `referrer` and `referrerPolicy`, and their spellings are also correct:

```javascript
fetch('/page', {
  headers: {
    "Content-Type": "text/plain;charset=UTF-8"
  },
  referrer: "https://demo.com/anotherpage", // <-
  referrerPolicy: "no-referrer-when-downgrade", // <-
});
```

### One-sentence summary:

When it comes to Referrer, except for the HTTP field which is misspelled, all browser-related configuration fields are spelled correctly.


## 2. The "Supernatural" Space

### 1. `%20` or `+`?

This is an **epic-level pitfall** that once wasted an entire day of my development time due to this protocol conflict.

Before diving in, let's try a small test. Type `blank test` (with a space between `blank` and `test`) in your browser and see how the browser handles it:

![Browser space handling](https://image-1255652541.file.myqcloud.com/uPic/spacetest.gif)

From the animation, you can see that the browser parses the space as a plus sign "+".

Does this seem strange to you? Let's do another test using several functions provided by the browser:

```javascript
encodeURIComponent("blank test") // "blank%20test"
encodeURI("q=blank test")        // "q=blank%20test"
new URLSearchParams("q=blank test").toString() // "q=blank+test"
```

![Encoding function results](https://image-1255652541.file.myqcloud.com/uPic/image-20200524184735653.png)

Code doesn't lie. In fact, **all the above results are correct**. The different encoding results occur because **[URI specifications](https://tools.ietf.org/html/rfc3986) and [W3C specifications](https://www.w3.org/TR/html4/interact/forms.html#h-17.13.4.1) conflict**, leading to this confusing situation.

### 2. Conflicting Protocols

First, let's look at the [reserved characters](https://tools.ietf.org/html/rfc3986#section-2.2) in URIs. These reserved characters are not encoded. There are two main categories of reserved characters:

- gen-delims: `:` `/` `?` `#` `[` `]` `@`
- sub-delims: `!` `$` `&` `'` `(` `)` `*` `+` `,` `;` `=`

URI encoding rules are quite simple: first convert characters outside the defined range to hexadecimal, then add a percent sign in front.

For unsafe characters like spaces, converting to hexadecimal gives 0x20, and adding the percent sign `%` in front gives `%20`:

![Space to %20 conversion](https://image-1255652541.file.myqcloud.com/uPic/image-20200524184601512.png)

So when we look at the encoding results of `encodeURIComponent` and `encodeURI`, they are completely correct.

Since encoding spaces as `%20` is correct, where does encoding as `+` come from? This is where we need to understand the history of HTML forms.

In the early days of the web when there was no AJAX, data was submitted through HTML forms. Forms can be submitted using either GET or POST methods. You can test this on the [MDN form page](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form):

![HTML form submission](https://image-1255652541.file.myqcloud.com/uPic/form.png)

Through testing, we can see that **spaces in form submissions are converted to plus signs**. This encoding type is `application/x-www-form-urlencoded`, which is defined in the [WHATWG specification](https://url.spec.whatwg.org/#urlencoded-serializing) as follows:

![WHATWG specification](https://image-1255652541.file.myqcloud.com/uPic/image-20200524185912590.png)

<br />

This basically solves the mystery. `URLSearchParams` follows this specification when encoding. I found the [polyfill code](https://github.com/WebReflection/url-search-params/blob/814161e99f1dd4453f3c1dc594bc73da2bd61838/build/url-search-params.node.js#L88) for `URLSearchParams`, which does the mapping from `%20` to `+`:

```javascript
replace = {
    '!': '%21',
    "'": '%27',
    '(': '%28',
    ')': '%29',
    '~': '%7E',
    '%20': '+', // <= Here it is
    '%00': '\x00'
}
```

The specification also explains this encoding type:

> *The* `application/x-www-form-urlencoded` format is in many ways an aberrant monstrosity, the result of many years of implementation accidents and compromises leading to a set of requirements necessary for interoperability, **but in no way representing good design practices**. In particular, readers are cautioned to pay close attention to the twisted details involving repeated (and in some cases nested) conversions between character encodings and byte sequences. **Unfortunately the format is in widespread use due to the prevalence of HTML forms**.
>
> This encoding method is not good design, but unfortunately, with the popularity of HTML forms, this format has become widespread.

Essentially, the long paragraph above means one thing: **this thing is poorly designed 💩, but it's too entrenched to change, so everyone just has to bear with it**

### 3. One-sentence summary

- In URI specifications, spaces are encoded as `%20`, while in `application/x-www-form-urlencoded` format, spaces are encoded as `+`

- In actual business development, it's best to use mature HTTP request libraries to encapsulate requests. These frameworks handle all these tedious details

- If you must use native AJAX to submit `application/x-www-form-urlencoded` format data, don't manually concatenate parameters. Use `URLSearchParams` to process the data to avoid various nasty encoding conflicts


## 3. Is X-Forwarded-For the Real IP?

### 1. Story

Before starting this section, let me tell a short development story to deepen everyone's understanding of this field.

A while ago, I needed to implement a feature related to risk control that required getting users' IP addresses. After development, we released it to a small portion of users. Testing found that the IP addresses of all gray-scale users in the backend logs were **abnormal** - how could such a coincidence happen? The tester then sent me several abnormal IPs:

```bash
10.148.2.122
10.135.2.38
10.149.12.33
...
```

As soon as I saw the IP characteristics, I understood. These IPs all start with 10, belonging to the Class A private IP range (10.0.0.0-10.255.255.255). What the backend got was definitely the proxy server's IP, not the user's real IP.

### 2. Principle

![Proxy architecture diagram](https://image-1255652541.file.myqcloud.com/uPic/image-20200524154345598.png)

Websites of any scale today are basically not single-server anymore. To handle higher traffic and more flexible architectures, **application services are generally hidden behind proxy servers**, such as Nginx.

By adding an access layer, we can more easily implement load balancing across multiple servers and service upgrades, as well as other benefits like better content caching and security protection. However, these are not the focus of this article, so I won't elaborate.

After adding proxy servers to the website, in addition to the above advantages, some new problems are introduced. For example, with a previous single server setup, the server could directly get the user's IP. After adding a proxy layer, as shown in the figure above, the (application) origin server gets the proxy server's IP, which is where the problem in my story occurred.

In the mature field of web development, there must be existing solutions, which is the [X-Forwarded-For](https://en.wikipedia.org/wiki/X-Forwarded-For) request header.

`X-Forwarded-For` is a de facto standard. Although not written into the HTTP RFC specification, it can basically be considered part of the HTTP standard given its widespread adoption.

This standard is defined as follows: each time a **proxy server forwards a request to the next server**, it should write its own IP into `X-Forwarded-For`. This way, when the application service at the far end receives the request, it gets a list of IPs:

```nginx
X-Forwarded-For: client, proxy1, proxy2
```

Since IPs are pushed one by one in sequence, the first IP should be the user's real IP, which can be used directly.

**But is it really that simple?**

### 3. Attack

From a security perspective, the weakest link in the entire system is people, and client-side is the easiest to attack and forge. Some users start exploiting protocol vulnerabilities: `X-Forwarded-For` is added by proxy servers, so what if I add `X-Forwarded-For` to the Header right from the initial request? Wouldn't that fool the server?

**1.** First, the client sends a request with the `X-Forwarded-For` request header, containing a forged IP:

```
X-Forwarded-For: fakeIP
```

**2.** The first-layer proxy server on the server side receives the request and finds that `X-Forwarded-For` already exists. Mistaking this request as coming from a proxy server, it appends the client's real IP to this field:

```nginx
X-Forwarded-For: fakeIP, client
```

**3.** After passing through several proxy layers, the final server receives a Header like this:

```nginx
X-Forwarded-For: fakeIP, client, proxy1, proxy2
```

If you follow the approach of taking the first IP from `X-Forwarded-For`, you've fallen for the attacker's trick. You get the fakeIP, not the client IP.

### 4. Countermeasures

How can the server counter this? Looking at the three steps above:

- Step 1 is client forgery, which the server cannot intervene in
- Step 2 is the proxy server, which is controllable and preventable
- Step 3 is the application server, which is controllable and preventable

For step 2 countermeasures, I'll use Nginx server as an example.

On our outermost Nginx, we configure `X-Forwarded-For` as follows:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
```

What does this mean? It means **the outermost proxy server doesn't trust the client's `X-Forwarded-For` input and directly overwrites it instead of appending**.

For non-outermost Nginx servers, we configure:

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

`$proxy_add_x_forwarded_for` means appending IP. Through this method, we can counter the client's forgery attempt.

The countermeasure for step 3 is also straightforward. Normally, we would take the leftmost IP from `X-Forwarded-For`. This time, we'll do the opposite: **count from the right, subtract the number of proxy servers**, and then the rightmost IP among the remaining ones is the real IP.

```nginx
X-Forwarded-For: fakeIP, client, proxy1, proxy2
```

For example, if we know there are two proxy layers, counting from right to left, remove `proxy1` and `proxy2`, and the rightmost IP in the remaining list is the real IP.

For related approaches and code implementation, refer to [Egg.js Proxy Mode](https://eggjs.org/en/tutorials/proxy.html).

### 5. One-sentence summary

When getting user real IP through `X-Forwarded-For`, it's best not to take the first IP to prevent users from forging IPs.


## 4. Somewhat Confusing Separators

### 1. HTTP Standards

When HTTP request header fields involve multiple values, **each value is generally separated by commas ","**. Even non-RFC standard fields like `X-Forwarded-For` use commas to separate values:

```http
Accept-Encoding: gzip, deflate, br
cache-control: public, max-age=604800, s-maxage=43200
X-Forwarded-For: fakeIP, client, proxy1, proxy2
```

Because commas were initially used to separate values, when later wanting to use another field to modify values, the separator became semicolon ";". The most typical request header is `Accept`:

```http
// q=0.9 modifies application/xml, although they are separated by semicolons
Accept: text/html, application/xml;q=0.9, */*;q=0.8
```

Although the HTTP protocol is easy to read, this separator usage is quite counterintuitive. **Logically, semicolons have stronger separation emphasis than commas**, but in HTTP content negotiation related fields, it's the opposite. You can see this definition in [RFC 7231](https://tools.ietf.org/html/rfc7231), which is quite clear.

### 2. Cookie Standards

Contrary to common understanding, Cookie is not actually part of HTTP standards. The specification that defines Cookie is [RFC 6265](https://tools.ietf.org/html/rfc6265), so the separator rules are different. The [Cookie syntax rules](https://tools.ietf.org/html/rfc6265#section-4.2.1) defined in the specification are as follows:

```
cookie-header = "Cookie:" OWS cookie-string OWS
cookie-string = cookie-pair *( ";" SP cookie-pair )
```

**Multiple cookies are separated by semicolons ";", not commas ","**. I randomly grabbed a website's cookie, and you can see it uses semicolons for separation. This needs special attention:

![Cookie separator example](https://image-1255652541.file.myqcloud.com/uPic/image-20200524175111667.png)

### 3. One-sentence summary

- Most HTTP field value separators are commas ","

- Cookie is not part of HTTP standard; its separator is semicolon ";"


## 5. Article Recommendations

Here are some articles I'd like to recommend:

- An article introducing [5 most confusing concepts in webpack](https://juejin.im/post/5cede821f265da1bbd4b5630) with nearly 800 likes on Juejin, explaining **concepts that look similar but have different meanings** in Webpack
- A detailed article explaining [what webpack dll is](https://juejin.im/post/5d8aac8fe51d4578477a6699) with 2 best practices to **escape tedious dll configuration**
- [React Native Performance Optimization Guide](https://juejin.im/post/5e1676e16fb9a04847095b12) analyzes 6 RN performance optimization points from the rendering layer perspective and explains FlatList implementation principles with illustrations
- [Web Scraper——Lightweight Data Scraping Tool](https://www.cnblogs.com/web-scraper/p/web-scraper-learn.html) introduces a small browser scraping plugin that can implement simple data scraping functionality

------

<br />

<br />

<br />

<br />

:::note A little tail
Welcome to follow our official account: **卤代烃实验室**: Focusing on frontend technology, hybrid development, and computer graphics, only writing in-depth technical articles
:::