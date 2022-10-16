import React, { memo } from "react";

import styles from './book.module.css';

export const Book = memo((props) => {
  // console.log('props', props)
  return (
    <div className={styles.item}>
      <img src={props.img} referrerPolicy="no-referrer" alt={props.name} style={{ objectFit: 'cover'}} />
      <div>
        <h3 className={styles.title}><a href={props.link}>{props.name}</a></h3>
        <div><b>个人评分：</b>{props.rate}</div>
        <div className={styles.center}>
          <b>电子书：</b>
          <Label link={props.douban} type={'douban'} />
          <Label link={props.dedao} type={'dedao'} />
          <Label link={props.weixin} type={'weixin'} />
          <Label link={props.ituring} type={'ituring'} />
        </div>
        <b>简评：</b>
        <div>{props.children}</div>
      </div>
    </div>
  )
});

const Label = (props) => {
  if (!props.link) {
    return null;
  }

  return (
    <a href={props.link} target="_blank" className={styles.center}>
      <span style={icon(props.type)} className={styles.icon} />
    </a>
  )
};

const bookImg = {
  width: '135px',
  minWidth: '135px',
  height: '200px',
  margin: 0,
  marginRight: '16px',
}

const icon = (img) => ({
  backgroundImage: `url(/img/ebook/${img}.png)`,
})

