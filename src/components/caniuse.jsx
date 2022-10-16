import React, { memo } from "react";
import PropTypes from 'prop-types';

const wrap = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '1rem auto',
}

const item = {
  display: 'flex',
  margin: '0 12px',
}

const text = {
  marginLeft: '6px',
}

const iconStyle = (img) => ({
  display: 'inline-block',
  width: '24px',
  height: '24px',
  backgroundImage: `url(/img/caniuse/${img})`,
})


export const CanIUse = (props) => {
  return (
    <div style={wrap}>
      <span style={item}>
        <span style={iconStyle('chrome.svg')}></span>
        <span style={text}>{props.chrome}</span>
      </span>
      <span style={item}>
        <span style={iconStyle('firefox.svg')}></span>
        <span style={text}>{props.firefox}</span>
      </span>
      <span style={item}>
        <span style={iconStyle('edge.svg')}></span>
        <span style={text}>{props.edge}</span>
      </span>
      <span style={item}>
        <span style={iconStyle('safari.png')}></span>
        <span style={text}>{props.safari}</span>
      </span>
    </div>
  )
}

CanIUse.propTypes = {
  chrome: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  firefox: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  edge: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  safari: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
}