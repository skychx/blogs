import React from 'react';
import Footer from '@theme-original/DocItem/Footer';

import GitalkComponent from "../../GitalkComment";

export default function FooterWrapper(props) {
  return (
    <>
      <Footer {...props} />
      <GitalkComponent />
    </>
  );
}
