/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useEffect } from 'react';

import Layout from '@theme/Layout';
import BlogPostItem from '@theme/BlogPostItem';
import BlogPostPaginator from '@theme/BlogPostPaginator';
import useTOCHighlight from '@theme/hooks/useTOCHighlight';
import useThemeContext from '@theme/hooks/useThemeContext';

import styles from './styles.module.css';

const LINK_CLASS_NAME = 'table-of-contents__link';
const ACTIVE_LINK_CLASS_NAME = 'table-of-contents__link--active';
const TOP_OFFSET = 100;

function BlogTOC({headings}) {
  useTOCHighlight(LINK_CLASS_NAME, ACTIVE_LINK_CLASS_NAME, TOP_OFFSET);
  return (
    <div className="col col--3" style={{paddingLeft: 30 + 'px'}}>
      <div className={styles.tableOfContents}>
        <Headings headings={headings} />
      </div>
    </div>
  );
}

/* eslint-disable jsx-a11y/control-has-associated-label */
function Headings({headings, isChild}) {
  if (!headings.length) {
    return null;
  }
  return (
    <ul
      className={
        isChild ? '' : 'table-of-contents table-of-contents__left-border'
      }>
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className={LINK_CLASS_NAME}
            dangerouslySetInnerHTML={{__html: heading.value}}
          />
          <Headings isChild headings={heading.children} />
        </li>
      ))}
    </ul>
  );
}

// https://www.coderhackers.com/blog/2020/02/29/how-to-add-forum-to-docusaurus
function Comments() {
  const {isDarkTheme} = useThemeContext();

  useEffect(() => {
    const script = document.createElement('script');

    console.log('isDarkTheme', isDarkTheme)

    script.src = "https://utteranc.es/client.js";
    script.setAttribute('repo', "skychx/blog-comments");
    script.setAttribute('issue-term', "pathname");
    script.setAttribute('label', "comment");
    script.setAttribute('theme', isDarkTheme ? "github-dark" : "github-light");
    script.crossOrigin = "anonymous";
    script.async = true;

    const oldElements = document.getElementsByClassName('utterances');

    if(oldElements.length === 0) {
      document.getElementById("comment-system").appendChild(script);
    } else {
      document.getElementById("comment-system").replaceChild(script, oldElements[0]);
    }

    // document.getElementById("comment-system").appendChild(script);
  }, [isDarkTheme]);

  return (
    <div id="comment-system"></div>
  );
}

function BlogPostPage(props) {
  const {content: BlogPostContents} = props;
  const {frontMatter, metadata} = BlogPostContents;
  const {title, description, nextItem, prevItem, editUrl} = metadata;

  return (
    <Layout title={title} description={description}>
      {BlogPostContents && (
        <div className="container margin-vert--lg">
          <div className="row">
            <div className="col docItemCol_src-theme-DocItem-">
              <BlogPostItem
                frontMatter={frontMatter}
                metadata={metadata}
                isBlogPostPage>
                <BlogPostContents />
              </BlogPostItem>
              <div>
                {editUrl && (
                  <a href={editUrl} target="_blank" rel="noreferrer noopener">
                    <svg
                      fill="currentColor"
                      height="1.2em"
                      width="1.2em"
                      preserveAspectRatio="xMidYMid meet"
                      viewBox="0 0 40 40"
                      style={{
                        marginRight: '0.3em',
                        verticalAlign: 'sub',
                      }}>
                      <g>
                        <path d="m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z" />
                      </g>
                    </svg>
                    Edit this page
                  </a>
                )}
              </div>
              {(nextItem || prevItem) && (
                <div className="margin-vert--xl">
                  <BlogPostPaginator nextItem={nextItem} prevItem={prevItem} />
                </div>
              )}
              <Comments />
            </div>
            <BlogTOC headings={BlogPostContents.rightToc} />
          </div>
        </div>
      )}
    </Layout>
  );
}

export default BlogPostPage;
