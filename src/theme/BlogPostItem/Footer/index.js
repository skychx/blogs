import React from 'react';
import Footer from '@theme-original/BlogPostItem/Footer';

import GitalkComponent from "../../GitalkComment";

export default function FooterWrapper(props) {
  return (
    <>
      <Footer {...props} />
      <GitalkComponent />
    </>
  );
}
