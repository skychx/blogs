---
slug: HTTP_CORS_visualized
title: 🌐 A Complete Guide to CORS with 15 Beautiful Animations
authors: skychx
description: A complete guide to CORS with 15 beautiful animations
draft: false
tags: [HTTP, network, web security]
---

![CORS visualization](https://image-1255652541.file.myqcloud.com/uPic/image-20200802144736235.png)

This article is translated from [Lydia Hallie](https://dev.to/lydiahallie)'s [✋🏼🔥 CS Visualized: CORS](https://dev.to/lydiahallie/cs-visualized-cors-5b8h?utm_campaign=React%2BNative%2BNow&utm_medium=web&utm_source=React_Native_Now_69#cs-cors). She used many animations to explain the concept of CORS. Since no one has translated this article in China yet, I've translated and corrected some errors based on my understanding of the original text, hoping to help everyone.

{/* truncate */}

If you think this translation is good, please **give it a like**. Thank you, it really means a lot to me! 🌟

:::tip Note before reading
All animations in the original article were created with **Keynote**
:::

<br/>
<br/>

In frontend development, we often need to use data from other websites. Before displaying this data on the frontend, we must send a request to the server to get that data.

Let's say we're visiting `https://api.mywebsite.com` and click a button to send a request to `https://api.mywebsite.com/users` to get some user information from the website:

![Same-origin request](https://image-1255652541.file.myqcloud.com/uPic/qyeikeonofi8dfl0jz2t.gif)


:::caution Error note
The original author had a typo here, mistakenly writing `https://www.mywebsite.com` instead of `https://api.mywebsite.com`. This error is also present in the image, so readers should be careful not to be misled
:::

From the results, everything looks perfect. We send a request to the server, the server returns the JSON data we need, and the frontend renders the result normally.



Now let's try with a different website. Use `https://www.anotherwebsite.com` to send a request to `https://api.website.com/users`:

![Cross-origin request](https://image-1255652541.file.myqcloud.com/uPic/lxhuh29biuwhefs3k9d9.gif)

Here's the problem: we're requesting the same API endpoint, but this time the browser throws an Error at us.



The error the browser just threw is a CORS Error. Let's analyze why this Error occurs and what exactly this Error means.



## 1. Same-Origin Policy

When browsers make network requests, there's a mechanism called the **same-origin policy**. By default, web applications using APIs can only request HTTP resources from the same domain that loaded the application.

For example, `https://www.mywebsite.com` requesting `https://www.mywebsite.com/page` is perfectly fine. But when the resource is on a site with a different **protocol**, **subdomain**, or **port**, the request is cross-origin.

![Same-origin vs cross-origin](https://image-1255652541.file.myqcloud.com/uPic/ibyoyo1yqta9cdvh0tbv.png)

Currently, the same-origin policy restricts three types of behavior:

- Restricted access to Cookies, LocalStorage, and IndexDB
- Cannot manipulate cross-origin DOM (common with iframes)
- Restricted XHR and Fetch requests initiated by JavaScript

<br/>

So why does the same-origin policy exist?

Let's make an assumption: if the same-origin policy didn't exist, you might accidentally click on a health article link that your aunt sent you on WeChat. This webpage might actually be a phishing site that redirects you to an attack site with embedded iframes after you visit the link. This iframe would automatically load the banking website and log into your account through cookies.

After successful login, this phishing site could also control the iframe's DOM and transfer money from your card through a series of clever operations.

![Phishing attack without same-origin policy](https://image-1255652541.file.myqcloud.com/uPic/50nmgrnkf6pb6gphno06.gif)

This is a very serious security vulnerability. We don't want our content on the internet to be accessed arbitrarily, let alone sites involving money.

The same-origin policy helps us solve this security problem. This policy ensures that we can only access resources from the same site.

![Same-origin policy protection](https://image-1255652541.file.myqcloud.com/uPic/8unei9l9enunbpr58o54.gif)

In this case, `https://www.evilwebsite.com` tries to access resources from `https://www.bank.com` across sites, and the same-origin policy blocks this operation, preventing the phishing site from accessing the banking site's data.



After all this discussion, what's the relationship between the same-origin policy and CORS?



## 2. Browser CORS

For security reasons, browsers restrict cross-origin HTTP requests **initiated from within scripts**. For example, XHR and Fetch follow the same-origin policy. This means that web applications using APIs can only request HTTP resources from the same domain that loaded the application.

![CORS restriction](https://image-1255652541.file.myqcloud.com/uPic/0qe4yzasvrm7r0a76kui.gif)

In day-to-day business development, we often need to access cross-origin resources. To safely request cross-origin resources, browsers use a mechanism called CORS.

The full name of CORS is **Cross-Origin Resource Sharing**. Although browsers prohibit us from accessing cross-origin resources by default, we can use CORS to **relax** this restriction while maintaining security to access cross-origin resources.

Browsers can use the CORS mechanism to allow cross-origin requests that comply with the rules and block those that don't. Let's analyze how browsers do this internally.



When a web application makes a cross-origin request, the browser **automatically** adds an additional request header field to our HTTP header: `Origin`. `Origin` marks the origin of the requesting site:

```http
GET https://api.website.com/users HTTP/1/1
Origin: https://www.mywebsite.com // <- Added by the browser itself
```

![Origin header addition](https://image-1255652541.file.myqcloud.com/uPic/91qh9mo3q5lcl0ng4t0r.gif)



To allow browsers to access cross-origin resources, the server's response also needs to add some response header fields that will **explicitly indicate** whether this server allows this cross-origin request.



## 3. Server-side CORS

As server developers, we can indicate whether to allow cross-origin requests by adding extra response header fields `Access-Control-*` to HTTP responses. Based on these CORS response header fields, browsers can allow some cross-origin responses that are restricted by the same-origin policy.

Although there are [several CORS response header fields](https://fetch.spec.whatwg.org/#http-responses), one field is **required**: `Access-Control-Allow-Origin`. The value of this header field specifies which sites are allowed to access resources cross-origin.

1️⃣ If we have development permissions for the server, we can grant access permissions to `https://www.mywebsite.com`: add this domain to `Access-Control-Allow-Origin`.

![Adding Access-Control-Allow-Origin](https://image-1255652541.file.myqcloud.com/uPic/bpw6vwe6w5tm3cadqg7j.gif)

This response header field is now added to the response header that the server sends back to the client. After adding this field, if we send a cross-origin request from `https://www.mywebsite.com`, the same-origin policy will no longer restrict resources returned by the `https://api.mywebsite.com` site.

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://www.mywebsite.com
Date: Fri, 11 Oct 2019 15:47 GM
Content-Length: 29
Content-Type: application/json
Server: Apache

{user: [{...}]}
```

![Successful cross-origin request](https://image-1255652541.file.myqcloud.com/uPic/akf0epavr00o2vo857lc.gif)



2️⃣ After receiving the server's response, the CORS mechanism in the browser checks whether the value of `Access-Control-Allow-Origin` equals the value of `Origin` in the request.

In this example, the request's `Origin` is `https://www.mywebsite.com`, which is the same as the value of `Access-Control-Allow-Origin` in the response:

![CORS validation](https://image-1255652541.file.myqcloud.com/uPic/foathske6a5prjf02dyf.gif)

3️⃣ Browser validation passes, and the frontend successfully receives the cross-origin resource.

<br />

So what happens when we try to access these resources cross-origin from a website that's not listed in `Access-Control-Allow-Origin`?

![CORS error](https://image-1255652541.file.myqcloud.com/uPic/lqtoobekf1h1d08lcl56.gif)

As shown in the image above, when accessing `https://api.mywebsite.com` resources cross-origin from `https://www.anotherwebsite.com`, the browser throws a CORS Error. After the explanation above, we can understand this error message:

```
The 'Access-Control-Allow-Origin' header has a value
 'https://www.mywebsite.com' that is not equal
to the supplied origin.
```

In this case, the value of `Origin` is `https://www.anotherwebsite.com`. However, the server didn't mark this site in the `Access-Control-Allow-Origin` response header field, so the browser's CORS mechanism blocks this response, and we can't get the response data in our code.

> CORS also allows us to add a wildcard `*` as an allowed origin, which means this resource can be accessed by **any** origin, so be careful with this special case

------

`Access-Control-Allow-Origin` is one of many header fields provided by the CORS mechanism. Server developers can also extend the server's CORS policy through other header fields to allow/prohibit certain requests.

Another common response header field is `Access-Control-Allow-Methods`. This specifies the HTTP methods allowed for cross-origin requests.

![Access-Control-Allow-Methods](https://image-1255652541.file.myqcloud.com/uPic/yjjhg7yr3kjrh1nm44mo.gif)

In the example above, only `GET`, `POST`, or `PUT` methods are allowed to access resources cross-origin. Other HTTP methods like `PATCH` and `DELETE` will be blocked.

> If you want to know what other CORS response header fields exist and their purposes, you can [check this list](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#The_HTTP_response_headers).


Speaking of HTTP methods like `PUT`, `PATCH`, and `DELETE`, CORS handles these methods differently. These non-simple requests trigger CORS preflight requests.



## 4. Preflight Requests

CORS has two types of requests: one is **simple requests**, and the other is **preflight requests**. Whether a cross-origin request is simple or preflight depends on some request headers.

When the request is `GET` or `POST` method and has no custom Header fields, it's generally a simple request. Any other request, such as `PUT`, `PATCH`, or `DELETE` methods, will trigger a preflight.

> If you want to know what requirements a request must meet to be a simple request, you can check the MDN documentation on **simple requests**.

After all this discussion, what exactly does "**preflight request**" mean? Let's explore this.

------

1️⃣ Before sending the actual request, the client first sends a preflight request using the [`OPTIONS`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS) method. The preflight request's `Access-Control-Request-*` headers contain information about the actual request we're about to handle:

- The header field [`Access-Control-Request-Method`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Method) tells the server what **method** the actual request will use
- The header field [`Access-Control-Request-Headers`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Request-Headers) tells the server what **custom request header fields** the actual request will carry

```http
OPTIONS https://api.mywebsite.com/user/1 HTTP/1.1
Origin: https://www.mywebsite.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Content-Type
```

![Preflight request](https://image-1255652541.file.myqcloud.com/uPic/pp30p7ej496f8bqta4he.gif)



2️⃣ After receiving the preflight request, the server returns an HTTP response without a body. This response marks the HTTP methods and HTTP Header fields that the server allows:

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://www.mywebsite.com
Access-Control-Allow-Methods: GET POST PUT
Access-Control-Allow-Headers: Content-Type
```

3️⃣ The browser receives the preflight response and checks whether the actual request should be allowed.

![Preflight response validation](https://image-1255652541.file.myqcloud.com/uPic/py19auar8xhs933ilmsc.gif)

:::caution Error note
The preflight response in the image above is missing `Access-Control-Allow-Headers: Content-Type`
:::


4️⃣ If the preflight response validation passes, the browser sends the actual request to the server, and then the server returns the resources we need.

![Actual request after preflight](https://image-1255652541.file.myqcloud.com/uPic/pfv1dcg77yjxbue5ryzf.gif)



If the preflight response validation fails, CORS blocks the cross-origin access, and the actual request is never sent. Preflight requests are a good way to prevent us from accessing or modifying resources on servers that haven't enabled CORS policies.

> 💡 To reduce network round trips, we can cache preflight responses by adding the `Access-Control-Max-Age` header field to CORS requests. Browsers can use the cache instead of sending new preflight requests.



## 5. Credentials

An interesting feature of XHR or Fetch with CORS is that we can send credentials based on [Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) and HTTP authentication information. Generally, for cross-origin XHR or Fetch requests, browsers **do not** send credential information.

Although CORS doesn't send credentials by default, we can change this by adding the `Access-Control-Allow-Credentials` CORS response header.

To include cookies and other authorization information in cross-origin requests, we need to do the following:

- Set `withCredentials` to `true` in XHR requests
- Set `credentials` to `include` in Fetch requests
- Add `Access-Control-Allow-Credentials: true` to the response headers on the server

```javascript
// Browser fetch request
fetch('https://api.mywebsite.com/users', {
  credentials: "include"
})

// Browser XHR request
let xhr = new XMLHttpRequest();
xhr.withCredentials = true;

// Server adds credential field
HTTP/1.1 200 OK
Access-Control-Allow-Credentials: true
```

![CORS with credentials](https://image-1255652541.file.myqcloud.com/uPic/vg3yo6qfqw12oh0f68yg.gif)

After doing the above work properly, we can include credential information in cross-origin requests.

## 6. Summary

CORS errors can be quite frustrating for frontend developers, but by following its相关规定, it allows us to make secure cross-origin requests in the browser.

There are many knowledge points about the same-origin policy and CORS. This article only covers some key points. If you want to comprehensively learn CORS-related knowledge, I recommend you check the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) and [W3C specification](https://www.w3.org/wiki/CORS_Enabled). These primary sources are the most accurate.




## 7. Finally

This article ends here. If you think it's good, please give it a like to encourage me. Wish you all success in your studies and work!

If you want to learn more non-note-style HTTP knowledge, you can check out my previous articles:

- [Is X-Forwarded-For the real IP?](https://juejin.im/post/6844904174132396045)
- [Should spaces be encoded as %20 or + in HTTP requests?](https://juejin.im/post/6844904178267979783)
- [Have you encountered these HTTP pitfalls?](https://juejin.im/post/6844904170550460423)

<br />

<br />

<br />

<br />

:::note A little tail
Welcome to follow our official account: **卤代烃实验室**: Focusing on frontend technology, hybrid development, and computer graphics, only writing in-depth technical articles
:::