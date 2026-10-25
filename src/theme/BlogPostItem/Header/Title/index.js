import React from 'react';
import clsx from 'clsx';
import BlogPostItemHeaderTitle from '@theme-original/BlogPostItem/Header/Title';
import styles from './styles.module.css';

// 使用官方主题包装机制，保留主题提供的 h1/h2 语义和文章链接。
export default function BlogPostItemHeaderTitleWrapper({className, ...props}) {
  return (
    <BlogPostItemHeaderTitle
      {...props}
      className={clsx(styles.title, className)}
    />
  );
}
