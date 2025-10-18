---
slug: get-base64-image-meta-info
title: ⚡️ [Performance Optimization] How to Efficiently Get Meta Information from Base64 Images
authors: skychx
description: How to efficiently get meta information from base64 images
tags: [Web Performance, image]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="get-base64-image-meta-info-hero-image.jpg" w={1920} h={773} />

Hello everyone, it's been over a year since my blog was last updated. I guess the SEO ranking has dropped completely, and I don't know how many people will see this in the end.

Starting from May last year, due to organizational structure changes at work, I shifted from the performance optimization field to AI. Due to confidentiality agreements, I can't say much about the specific content, so I haven't updated for a long time. This year, my work direction has changed again, mainly focusing on GUI Agent work.

A year has passed, but the programming field has undergone earth-shaking changes. With the launch of tools like Cursor/Claude Code, everyone has basically broken free from the constraints of traditional programming methods (let's not worry about whether the generated code is correct, just ask if it's fast or not); many departments are not satisfied with the efficiency gains from external programming tools and have started building their own internal Agents, attempting to double efficiency in both business and engineering. Since my recent work involves more collaboration with large model teams, I feel this more deeply, and I'll have opportunities to share my insights slowly in the future.

<br />

{/* truncate */}

Aside from the above greetings, today's technical topic will be something simple.

Since the development of "multimodal large models," passing image content to models has become an unavoidable topic in various Agent systems. For some security considerations, some large models early on only supported base64-encoded image uploads, making the post body of network requests extremely long and cumbersome.

With the introduction of concepts like computer use and browser use in 2024, these related Agents will involve a large number of screenshots, then send these screenshots to large models for decision-making and to provide actions for the next loop. Most of these screenshots exist in base64 format, and related GUI Agents need to read meta information like "format/width/height" from these base64 images, then perform a series of logical processing.


## Conventional Approach

If the Agent's tech stack is JS/TS, the conventional processing flow is to first convert the base64 image entirely to a binary image, then use image processing libraries like [jimp](https://jimp-dev.github.io/jimp/)/[sharp](https://sharp.pixelplumbing.com/) to extract relevant meta information (directly requesting tasks from Claude Code actually follows a similar processing method).

```typescript
// Jimp
import { Jimp } from "jimp";

const buffer = Buffer.from(base64Data, 'base64');
const image = await Jimp.fromBuffer(buffer);

console.log(image.mime, image.width, image.height)

// sharp
import sharp from "sharp";

const buffer = Buffer.from(base64Data, 'base64');
const metadata = await sharp(imageBuffer).metadata();

console.log(metadata.format, metadata.width, metadata.height)
```

This approach has no problem in terms of **final results**, but it has the following shortcomings in **performance and efficiency**:

- Including general image libraries like jimp increases bundle size, but only uses very few features - it's like using a cannon to shoot a mosquito
- Full conversion to binary brings unnecessary memory increases. For example, a 4MB base64 image will increase memory by 3MB after conversion to binary. If the library internally decodes to common bitmap formats like BMP, memory will fluctuate by ten to几十MB depending on width/height/bit depth

<br />


## Performance Optimization

Based on previous experience, for original base64 images, the main meta information we need to obtain is mime, width, and height. All image formats have very rigorous RFC definitions to ensure they can flow and be encoded/decoded across all platforms. And the meta information we need to obtain is recorded in the **header chunk** of the image's binary format, so we just need to find the relevant position and read it to get the data we want.

<br />


### Basic Principles

This is rather abstract, so let's take the classic PNG image as an example to look at its binary composition.

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/corkami-pics-png.png" alt="corkami-pics-png" width="80%" />
</p>

From the above image, we can see that a PNG image mainly consists of 4 parts:

- **signature**: The magic number of PNG images, fixed as `\x89PNG\r\n^Z\n`, so decoders can quickly determine the data type through the first 8 bytes
- **IHDR**: image header chunk, which marks various meta information like width/height/bit depth, etc.
- **IDAT**: image data chunk, PNG data content, ignored here as it's not the focus of this article
- **IEND**: image trailer chunk, marking the end of the PNG image. Actually, additional information can be appended after PNG ends (for related techniques, see [Hot Update-Steganography](https://supercodepower.com/how-to-hide-bundle#11-%E9%9A%90%E5%86%99%E6%9C%AF%E5%BD%93%E4%BB%A3%E7%89%B9%E6%B4%9B%E4%BC%8A%E6%98%A8%E9%A9%AC))


<br />

From the above content, we can see that for PNG images:

- We only need to read the first 8 bytes to quickly determine the mime type of the base64 image
- Directly reading the content at bytes 10+4 and 14+4 can determine the width and height of the PNG image

In other words, for **PNG images of any size, we only need to read the first 23 bytes to get mime & width & height**. The same applies to other image formats.

<br />

The binary formats of other images are as follows:

| Format | Binary Format Analysis                                        |
| ------ | ------------------------------------------------------------ |
| PNG    | https://github.com/corkami/pics/blob/master/binary/PNG.png  |
| JPEG   | https://github.com/corkami/pics/blob/master/binary/JPG.png  |
| GIF    | https://github.com/corkami/pics/blob/master/binary/GIF.png  |
| BMP    | https://github.com/corkami/pics/blob/master/binary/bmp3.png |
| WEBP   | https://datatracker.ietf.org/doc/rfc9649/                   |

<br />


### Getting the Type

As mentioned earlier, we can determine the mime type through the image's **Magic Number**.

It's worth noting that many base64 images will have a DataURI prefix added (like `data:image/png;base64,iVBOR...`), and the mimeType in this prefix is not necessarily accurate. For example, the image below claims it's PNG in the prefix, but it's actually WebP (the browser still displays it correctly based on the Magic Number):

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/webp-fake-png.png" alt="webp-fake-png" width="100%" />
</p>

<br />

After converting Magic Number to base64 strings, because Magic Number is fixed, the converted string is also fixed. Generally, we only need to match the first 8 characters (which is the first 6 bytes) to quickly determine the image type:

```typescript
const IMAGE_TYPE_MAP = new Map<string, ImageType>([
  ['/9j/',  'jpeg'], // JPEG: FF D8 FF
  ['iVBORw', 'png'], // PNG:  89 50 4E 47
  ['UklGR', 'webp'], // WebP: 52 49 46 46
  ['R0lGOD', 'gif'], // GIF:  47 49 46 38
  ['Qk',     'bmp'], // BMP:  42 4D
]);

// use
const prefix = base64Image.substring(0, 8);
for (const [signature, type] of IMAGE_TYPE_MAP) {
  if (prefix.startsWith(signature)) {
    return type;
  }
}
```

<br />


### Getting Width and Height

Getting width and height is slightly more troublesome because, unlike Magic Number which is always at the very beginning, each image specification is somewhat different, but the final solutions are all similar, generally described within the first 32 bytes. We can take only the first n characters of base64, then convert to binary and read the data at relevant positions. This approach has much smaller memory increments than full image conversion.

Let's take PNG images as an example. From the [PNG RFC](https://datatracker.ietf.org/doc/html/rfc2083), we know that PNG stores data in **big-endian order** (high-order bytes first), and width and height each occupy **4 bytes**. Taking PNG's width as an example, it occupies `bytes[16]`, `bytes[17]`, `bytes[18]`, `bytes[19]`.

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/corkami-pics-png-header-chunk.png" alt="corkami-pics-png-header-chunk" width="100%" />
</p>

> All integers that require more than one byte must be in **network byte order**
>
> Width and height give the image dimensions in pixels. They are **4-byte integers**. Zero is an invalid value. The maximum for each is **(2^31)-1** in order to accommodate languages that have difficulty with unsigned 4-byte values.

<br />

Assuming the width value is `1920` (decimal), which is `0x00000780` in hexadecimal, and the 32-bit binary representation is `00000000 00000000 00000111 10000000`, then the storage relationship in PNG would be:

- `bytes[16]` = `0x00` (binary `00000000`)
- `bytes[17]` = `0x00` (binary `00000000`)
- `bytes[18]` = `0x07` (binary `00000111`)
- `bytes[19]` = `0x80` (binary `10000000`)

<br />

So to combine the discrete `bytes[16]`, `bytes[17]`, `bytes[18]`, `bytes[19]` into a 32-bit integer in big-endian order, we first need to do left shift operations to unify them as 32 bits:

| Bits      | Original (8-bit) | Operation (left shift) | After shift (32-bit)                 |
| --------- | ---------------- | --------------------- | ------------------------------------ |
| bytes[16] | 00000000         | \<\< 24               | 00000000 00000000 00000000 00000000 |
| bytes[17] | 00000000         | \<\< 16               | 00000000 00000000 00000000 00000000 |
| bytes[18] | 00000111         | \<\< 8                | 00000000 00000000 00000111 00000000 |
| bytes[19] | 10000000         | no shift              | 00000000 00000000 00000000 10000000 |

<br />

Finally, merge all results with bitwise OR:

```typescript
  00000000 00000000 00000000 00000000  (bytes[16])
| 00000000 00000000 00000000 00000000  (bytes[17])
| 00000000 00000000 00000111 00000000  (bytes[18])
| 00000000 00000000 00000000 10000000  (bytes[19])
-----------------------------------------
= 00000000 00000000 00000111 10000000  (final result)
```

<br />

Written as actual code, it looks like this:

```typescript
export function parsePngDimensions(bytes: Uint8Array): ImageDimensions {
  // PNG dimensions are at bytes 16-23 (big-endian)
  const width =  (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  return { width, height };
}

// use
const header = base64image.substring(0, 48);
const binaryHeader = new Uint8Array(Buffer.from(header, 'base64'));
const { width, height } = parsePngDimensions(binaryHeader);
```

Following the same logic, just paying attention to byte order and the position of width/height in the actual binary data, you can parse various image formats one by one. For this tedious work, you just need to give the above logic to Claude Code/Cursor plus the corresponding RFC references, and it can directly generate parsing code for other image formats.

Of course, the generated code might have errors, and this requires spending some time on manual review and adding unit tests. This part is actually the most time-consuming in the overall work because AI currently can't take responsibility.

<br />


## Summary

Using this approach can effectively control the **memory increment to within a few dozen bytes** when reading meta information, optimizing overall performance.