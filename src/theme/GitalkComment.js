import React, { Component, useEffect } from 'react'
import 'gitalk/dist/gitalk.css'
import Gitalk from 'gitalk'

const GitalkComment = () => {
    useEffect(() => {
        // 不做延时的话，title 会取到上一个页面的 title
        const timer = setTimeout(() => {
            if (
              window.location.pathname === "/" ||
              window.location.pathname === "/en/" ||
              window.location.pathname.includes("/tags/")
            ) {
              return;
            }

            const gitalk = new Gitalk({
                clientID: '277d6847c52327f535a3',
                clientSecret: 'a5f7d7c615b5179dbdbd72954eda5563f9cd4b44',
                repo: 'blogComments',
                owner: 'skychx',
                admin: ['skychx'],
                labels: ['Comments'],
                title: window.document.title,
                id: window.location.pathname,
                distractionFreeMode: false,
                // proxy: 'https://shielded-brushlands-08810.herokuapp.com/https://github.com/login/oauth/access_token',
            })

            console.warn('GitalkComment', window.document.title, window.location.pathname)

            gitalk.render('gitalk-container')
        }, 300);


        return () => {
            !!timer && clearTimeout(timer);
        }
    }, []);

    return null;

    return <div id="gitalk-container"></div>;
}

export default GitalkComment;