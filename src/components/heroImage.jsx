import React from "react";

const style = (w, h) => ({
  aspectRatio: `${w}/${h}`
})

// 默认用图床上的图片，name 是文件名；也可以用 src 指定 static 目录里的图片
export const HeroImage = (props) => {
  return (
    <p>
      <img
        src={props.src || `https://image-1255652541.file.myqcloud.com/uPic/${props.name}`}
        alt={props.alt || props.name}
        width="100%"
        loading="lazy"
        style={style(props.w, props.h)}
      />
    </p>
  )
}