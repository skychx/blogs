---
slug: De-Morgan-laws
title: 🔢【Mathematics in Programming】Using De Morgan's Laws to Simplify Boolean Operations
authors: skychx

description: Today let's talk about the practical application of De Morgan's laws in programming. The title looks intimidating, but actually you only need a little bit of high school math knowledge to understand it. Moreover, this knowledge can be quickly applied to projects after mastering it, with a very high investment-return ratio.
draft: false
tags: [mathematics in programming, discrete mathematics, algorithms]
---



Today let's talk about the practical application of De Morgan's laws in programming. The title looks intimidating, but actually you only need a little bit of high school math knowledge to understand it. Moreover, this knowledge can be quickly applied to projects after mastering it, with a very high investment-return ratio.

{/* truncate */}

If you find my articles helpful, in the process of **bookmarking**, please remember to **like** and **share**. Thank you, this is really important to me🌟!



### 1. Origin: A Mind-Boggling Logic Judgment

While refactoring some old projects these past two days, I encountered a very mind-boggling logic judgment:

```javascript
if(!((A && B) || C)) {
  // do something
} else {
  // do something
}
```

Looking at this code, I was stunned. When I tried to sort out the logic layer by layer from inside out, my brain activity was like this:

<!-- ![](https://image-1255652541.file.myqcloud.com/uPic/LRAxP8g.jpg) -->

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/LRAxP8g.jpg" width="40%" />
</p>

In just one line of logic judgment, **AND, OR, NOT** three operators are all used, especially that final operation of taking the negation of the entire parenthesized expression. My brain directly **exploded**. You know, the human brain is very bad at OR operations and NOT operations, let alone when these operations are combined together.

After spending another five minutes trying to sort out the business logic from the code context without success, I re-examined this problem: if it's difficult to handle this problem from a business perspective, can we find a breakthrough from theory?

After finding the right direction, I quickly found the solution, which is [De Morgan's laws](https://en.wikipedia.org/wiki/De_Morgan%27s_laws) in discrete mathematics.

### 2. What are De Morgan's Laws

We actually encountered De Morgan's laws very early. They were mentioned in the set theory part of high school mathematics, and also mentioned in the set operations and Boolean algebra parts of university [discrete mathematics](https://book.douban.com/subject/34866266/).

De Morgan's laws have appeared in many scenarios in discrete mathematics. They have two relationships:

- In **propositional logic**, they can be expressed as:

$$
\neg (P\lor Q)\iff (\neg P)\land (\neg Q)
$$

$$
\neg (P\land Q)\iff (\neg P)\lor (\neg Q)
$$

Where $\neg$ represents the logical NOT operator (NOT, `!`), $\lor$ represents the logical OR operator (OR, `||`), and $\land$ represents the logical AND operator (AND, `&&`)

<br />

- In **set theory**, they can be expressed as:

$$
\overline {A\cup B} = \overline {A} \cap \overline {B}
$$

$$
\overline {A\cap B} = \overline {A} \cup \overline {B}
$$

Where A and B represent sets, the line over the set represents taking the complement, $\cap$ represents intersection, and $\cup$ represents union.

<br />

- In **Boolean algebra**, they can be expressed as:

$$
\overline {(x \cdot y)} = \overline {x} + \overline {y}
$$

$$
\overline {(x+y)} = \overline {x} \cdot \overline {y}
$$

Where $\cdot$ represents Boolean product (AND), $+$ represents Boolean sum (OR), and the overline represents complement (NOT).

<br />

- The above formulas can also be described in **words**:

NOT ($P$ OR $Q$) is equivalent to (NOT $P$) AND (NOT $Q$)

NOT ($P$ AND $Q$) is equivalent to (NOT $P$) OR (NOT $Q$)

<br />

- Or expressed using **AND, OR, NOT logical operators** familiar to programmers:

```javascript
!(P || Q) = !P && !Q
!(P && Q) = !P || !Q
```

The formulas are already laid out here and can definitely be used directly, but when using them, it's still not very reassuring. It's best to verify them yourself. We can use a truth table to intuitively verify $\neg (P\land Q)\iff (\neg P)\lor (\neg Q)$:

| $P$  | $Q$  | $\neg P$ | $\neg Q$ | $(P\land Q)$ | $\neg (P\land Q)$ | $(\neg P)\lor (\neg Q)$ |
| ---- | ---- | -------- | -------- | ------------ | ----------------- | ----------------------- |
| 0    | 0    | 1        | 1        | 0            | 1                 | 1                       |
| 0    | 1    | 1        | 0        | 0            | 1                 | 1                       |
| 1    | 0    | 0        | 1        | 0            | 1                 | 1                       |
| 1    | 1    | 0        | 0        | 1            | 0                 | 0                       |

We can also use [Venn diagrams](https://en.wikipedia.org/wiki/Venn_diagrams) to visually verify $\overline {A\cap B} = \overline {A} \cup \overline {B}$:

![](https://image-1255652541.file.myqcloud.com/uPic/ABBA.png)

I won't go into more complex mathematical derivations here. Interested students can search and learn them on their own.

### 3. Solving the Problem

Specifically for the conditional judgment I mentioned at the beginning, we can use De Morgan's laws to break down the original expression:

```javascript
!((A && B) || C)
== !(A && B) && !C   // De Morgan's law
== (!A || !B) && !C  // De Morgan's law
== (!A && !C) || (!B && !C)  // Distributive law
```

After conversion using the distributive law, through code context analysis, I found that in the business scenario of this code, `!A` is equivalent to `C`, so the above expression can be further simplified:

```javascript
(!A && !C) || (!B && !C)
== (C && !C) || (!B && !C) // !A is equivalent to C (analyzed from business, not universally applicable)
== false || (!B && !C)     // C && !C must be false
== !B && !C
== A && !B  // A is equivalent to !C (analyzed from business)
```

At this point, I successfully simplified the original mind-blowing judgment statement to a straightforward and easy-to-understand expression. The converted code is much easier than the original both in terms of understanding and later maintenance.

### 4. What Other Tricks Are There for Simplification?

Scenarios where **AND, OR, NOT** are used together can be simplified using De Morgan's laws. In other scenarios, you can also use other **operation laws** for conversion. For example, I used the distributive law earlier. Similar to the simplification of sum-of-products expansion forms, we can also use **Karnaugh maps** for analysis.

For example, a scenario tries to simplify a product-of-sums expansion of a Boolean function: $x\overline {y} + \overline {x}y + \overline {x} \overline {y}$, which can be analyzed using a Karnaugh map:

|                 | $y$  | $\overline {y}$ |
| --------------- | ---- | --------------- |
| $x$             |      | 1               |
| $\overline {x}$ | 1    | 1               |

According to the diagram, the final simplified result can easily be obtained as $\overline {x} + \overline {y}$.

If there are more than 4 variables, Karnaugh maps become very complex. At this time, you can use the **Quine-McCluskey method** for simplification. Limited by space, I won't introduce it more. Interested students can search for it themselves.

Let me add one more thing here. If you really encounter using more than 4 sub-states to determine the final behavior, **the key to the problem is not simplification, but there are problems with the top-level design**. At this time, you need to stop and think carefully about whether the model design abstraction level is insufficient, whether too much internal state is exposed, etc. This needs to be analyzed based on specific business. Blindly stacking `if else` or adding `flags` cannot solve the problem and will only lead to code decay and eventual unmaintainability.

---------

Welcome to follow my WeChat official account: **卤代烃实验室**, currently focusing on frontend technology, with some minor research in graphics.

You can also add my WeChat **egg_labs**, welcome to interact.

<p>
<img src="https://image-1255652541.file.myqcloud.com/uPic/Uh1E2O.png" width="40%" />
</p>

![](https://image-1255652541.file.myqcloud.com/uPic/OAFePh.jpg)