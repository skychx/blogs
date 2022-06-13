import React, { memo } from "react";

// base64 icon
const doubanIcon = '';
const dedaoIcon = '';
const weixinIcon = '';
const tulinIcon = '';

export const Book = memo((props) => {
  console.log('props', props)
  return (
    <>
      <p>{props.name}</p>
      <p>评分：{props.rate}</p>
      <p>
        电子书：
        {!!props.douban && <span>豆瓣阅读</span>}
        {!!props.dedao && <span>得到</span>}
        {!!props.weixin && <span>微信读书</span>}
        {!!props.tulin && <span>图灵教育</span>}
      </p>
    </>
  )
});

const Label = (props) => {
  return (
    <span></span>
  )
};