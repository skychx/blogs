import React from "react";

import styles from './rendererDemo.module.css';

// 渲染器单独部署，所有能嵌入的演示见 https://toy-renderer.supercodepower.com/embeds.json
const origin = 'https://toy-renderer.supercodepower.com';

// 嵌入一张画布，src 取 embeds.json 里 path 的「章节/演示」部分，比如 day08/tangent
// size 是最大显示宽度，窄屏下画布跟着正文一起缩小
export const RendererDemo = (props) => {
  const size = props.size || 800;
  return (
    <iframe
      className={styles.demo}
      src={`${origin}/embed/${props.src}/`}
      title={props.title}
      width={size}
      height={size}
      loading="lazy"
      style={{ maxWidth: size }}
    />
  )
}

// 几张画布并排对比，每张下面显示它的 title
export const RendererDemos = (props) => {
  // MDX 会在子元素之间插入换行文本，只保留组件
  const demos = React.Children.toArray(props.children).filter(React.isValidElement);
  const className = demos.length > 3 ? `${styles.group} ${styles.wrap}` : styles.group;
  return (
    <div className={styles.container}>
      <div className={className} role="group" aria-label={props.title}>
        {demos.map((demo) => (
          <figure key={demo.key} className={styles.item}>
            {demo}
            <figcaption>{demo.props.title}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}
