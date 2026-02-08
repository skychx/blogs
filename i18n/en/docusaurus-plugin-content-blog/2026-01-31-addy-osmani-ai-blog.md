---
slug: addy-osmani-ai-blog
title: "✨ [AI] From Chrome to Gemini: When Heavy Hitter Follows the Trend"
authors: skychx
description: My takeaways from Addy Osmani's insights on programmers in the AI era
tags: [AI]
---

import { HeroImage } from '../../../src/components/heroImage';

<HeroImage name="addy-osmani-ai-blog-hero.jpeg" w={749 } h={302} />

Just some random thoughts today - not as serious as my usual posts.

A friend recently shared a blog post called [The Next Two Years of Software Engineering](https://addyosmani.com/blog/next-two-years/), and it was genuinely good. When I checked the author, I realized it was [Addy Osmani](https://addyosmani.com/) - someone I've been following for years (well, in the "I follow him, he doesn't know I exist" kind of way).

{/* truncate */}

## Addy's Career Journey

<p>
<img src="https://addyosmani.com/assets/images/addy_2022.jpg" width="200" alt='Addy in one of his commonly used profile pictures' />
</p>

Since my previous work focused heavily on performance optimization, I had to keep a close eye on Chrome's updates and features - and Addy Osmani's name was everywhere. He's written tons of high-quality articles. In fact, I previously wrote a post on JS performance optimization called [The Cost Of JavaScript](https://supercodepower.com/the-cost-of-javascript), which drew heavily from his talks and blog posts. His [career trajectory](https://addyosmani.com/bio/) is seriously impressive:

- At 16, as an indie dev, he built XWebs - essentially "hand-coding a browser in C++"
- In 2011, he created TodoMVC, an open-source project that became the go-to teaching project for frontend frameworks everywhere
- After joining Chrome in 2012, he worked his way up to Senior Staff Engineering Manager, focusing on Chrome's DX (Developer Experience). His key contributions include:
  - Chrome DevTools: hands down the best web debugging platform out there
  - Lighthouse: performance auditing tool
  - Puppeteer: browser automation tool
  - PWA, Core Web Vitals, MV3, Chrome DevTools MCP, and other Chrome features and ecosystem development
- Beyond his day job, he's written multiple books and built numerous indie products

<br />

As you can see, he's made massive contributions to the web over the past decade (especially to the developer ecosystem). But at the end of 2025, he moved to the Google Cloud AI team - still focusing on DX, community operations, and impact building. The only difference? His focus shifted from **Chrome** to **Gemini**.

You could argue this is just another smart move by a smart person, given where things are headed. But like I mentioned earlier, Addy loves sharing through his blog. After joining Cloud AI, he wrote 12 posts in just two months, mostly covering AI Agents and AI Coding. And given his background, he's that rare combination of someone with extensive management experience who still codes daily. So his articles **balance both developer and manager perspectives** - I personally found them pretty insightful.

## Key Insights

### Taste

There's this term "Taste" that's been trending lately. The basic idea is that since AI can generate code so fast now, replacing the manual coding work engineers used to do, what matters more is deciding what to build, which direction to take, and how to design the system.

Some people suggest translating "Taste" as **品味** (taste/refinement) or **审美** (aesthetics). The meaning is similar enough, but the problem is that these words are too broad and easily get mixed up with other contexts - like musical taste or artistic aesthetics. Plus, they're too vague. It's like critiquing a painting by simply saying "the aesthetics aren't great" - that's nowhere near as constructive as saying "the brushwork could be better, the composition has flaws, and here's how the colors could be improved."

Addy actually explored this in his blog post [Your AI coding agents need a manager](https://addyosmani.com/blog/coding-agents-manager/). He explained the term from a management perspective. His take? **Taste is essentially a management skill in disguise**:

> That is a manager skill in disguise: prioritization, saying no, defining success, running small experiments, and killing bad ideas quickly.

These categories are much clearer. They break down the broad concept of "Taste" into specific directions. Before directing a Coding Agent to work, planning ahead based on these principles will get you much better results than just diving in blindly.

<br />

### Agentic Engineering

Overall, possibly due to his long tenure as a manager, many of Addy's blogs are written from a management perspective - that is, **how to reliably coordinate multiple AI Agents to accomplish serious development work**.

For example, in his recent article [Agentic Engineering](https://addyosmani.com/blog/agentic-engineering/), he argues that the term "vibe coding" is too vague. It's fine to use it in less critical scenarios (like MVP prototyping, personal scripts, or one-off tools), but using it for real production projects would clearly create ambiguity for other team members and managers.

So what's the solution? It's actually the software engineering experience accumulated over decades: from development standards to code review processes, to final testing and delivery - everything needs strict engineering definitions and boundaries. The implementation can be handed off to AI, but **you have to take responsibility for the final delivery**. This isn't really any different from 1979:

![IBM Slide](https://image-1255652541.file.myqcloud.com/uPic/addy-osmani-ai-blog-ibm.png)

<br />

Of course, describing this serious engineering approach with the flippant term [vibe coding](https://x.com/karpathy/status/1886192184808149383) isn't appropriate - it should be called [agentic engineering](https://x.com/karpathy/status/2019137879310836075).

![vibe - agentic](https://image-1255652541.file.myqcloud.com/uPic/addy-osmani-ai-blog-agentic.jpg)

I bet most of you have encountered similar scenarios. If you hand all work over to AI and just type requirements in the input box without any engineering constraints, after multiple iterations the code explodes in entropy until even AI can't fix it anymore - not to mention whoever has to maintain it later. This just drains the project's life force. Only with engineering constraints can you maintain consistent AI programming speed, rather than hitting a cliff where iteration speed suddenly drops off.

<br />

### AI with DX

Beyond the specific details, I think one of his development workflow diagrams is really good - it describes which stages of the traditional development process AI can impact and how it affects DX. This diagram is from his book [Beyond Vibe Coding](https://beyond.addy.ie/) (though to be fair, this book has a lot of AI-assisted content - I'd recommend just skimming it, you don't need to read it in depth).

First, he drew a development workflow diagram from the "pre-AI era":

![addy-osmani-ai-blog-dx-before-ai](https://image-1255652541.file.myqcloud.com/uPic/addy-osmani-ai-blog-dx-before-ai.svg)

As shown above, traditional software development workflows actually consist of multiple nested loops:

- The Design Loop on the far left covers prep work before actual coding starts - things like solution research, architecture design, and breaking down the workflow
- The Inner Loop in the middle is the coding phase where you write code word by word - this is what most programmers spend their time on
- Submit Loop is the process of each MR submission, including Lint, Code Review, etc.
- Outer Loop is the product-level iteration for major features - this is what CICD has mainly been optimizing

<br />

With Coding Agents in the picture, each stage and node in this traditional workflow gets accelerated to varying degrees:

![addy-osmani-ai-blog-dx-after-ai](https://image-1255652541.file.myqcloud.com/uPic/addy-osmani-ai-blog-dx-after-ai.svg)

- In the Design Loop, ChatBot involvement and DeepResearch features speed up research time significantly. Planning is also being replaced by features like Claude Code's Plan functionality
- The Inner Loop has been **completely replaced** by Coding Agents - there are tons of programming products doing this now
- In Submit Loop, the Code Review stage also has various Agents doing reviews - there are already mature products for this
- In Outer Loop, post-release resource utilization, performance regression prevention, and other scenarios can also leverage AI to consolidate repetitive work

From these changes, it's clear that only the "Thinking" step remains un-replaced so far. Everything else is either accelerated by standardized CICD processes or by Coding Agents. And isn't this "Thinking" step what a Manager (Agentic Engineering) does? Or to put it more bluntly, we still need a real human to take responsibility for the final outcome.

## Wrapping Up

The points I mentioned above are just the takeaways that resonated most with me from Addy's recent blog posts. I'd still recommend developers check out his recent blogs themselves - I'm sure different people will get different insights from them.

At the end of the day, whether AI exists or not, building a robust, reusable system from an engineering perspective is incredibly tempting in any business scenario because it guarantees quality while improving overall delivery efficiency. Like the title says, **sometimes the trend is stronger than the individual** - so let's all get ready and experience this AI revolution together.

