import React from "react";

const style = (w, h) => ({
  aspectRatio: `${w}/${h}`
})

export const HeroImage = (props) => {
  return (
    <p>
      <img
        src={`https://image-1255652541.file.myqcloud.com/uPic/${props.name}`}
        alt={props.name}
        width="100%"
        style={style(props.w, props.h)}
      />
    </p>
  )
}