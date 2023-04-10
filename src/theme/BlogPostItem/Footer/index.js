import React from 'react';
import Footer from '@theme-original/BlogPostItem/Footer';

import GitalkComponent from "../../GitalkComment";

export default function FooterWrapper(props) {

  if (window.location.pathname === "/" || window.location.pathname === "") {
    return null;
  }

  return (
    <>
      <Footer {...props} />
      <GitalkComponent />
    </>
  );
}
