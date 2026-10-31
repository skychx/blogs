import React from "react";

import styles from './notion.module.css';

// 还原 Notion 里的几种块，从 Notion 导出的文章用

// 分栏：Column 的 width 是这一栏在 Notion 里占的比例，比如 37.5%
export const Columns = (props) => {
  return <div className={styles.columns}>{props.children}</div>
}

export const Column = (props) => {
  return (
    <div className={styles.column} style={{ '--column-width': props.width }}>
      {props.children}
    </div>
  )
}

// 带说明文字的图片：图片写成 children，编译时的图片尺寸插件才能处理到它
export const Figure = (props) => {
  return (
    <figure className={styles.figure}>
      {props.children}
      <figcaption>{props.caption}</figcaption>
    </figure>
  )
}

// 红色文字
export const Red = (props) => {
  return <span className={styles.red}>{props.children}</span>
}
