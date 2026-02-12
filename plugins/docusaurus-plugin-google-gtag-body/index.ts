/**
 * Custom Docusaurus Plugin: Google Gtag (Body placement)
 * Based on docusaurus-plugin-google-gtag, but injects tags at the end of body
 */

import type {LoadContext, Plugin} from '@docusaurus/types';
import type {PluginOptions, Options} from './options';

function createConfigSnippet({
  trackingID,
  anonymizeIP,
}: {
  trackingID: string;
  anonymizeIP: boolean;
}): string {
  return `gtag('config', '${trackingID}', { ${
    anonymizeIP ? "'anonymize_ip': true" : ''
  } });`;
}

function createConfigSnippets({
  trackingID: trackingIDArray,
  anonymizeIP,
}: PluginOptions): string {
  return trackingIDArray
    .map((trackingID) => createConfigSnippet({trackingID, anonymizeIP}))
    .join('\n');
}

export default function pluginGoogleGtagBody(
  context: LoadContext,
  options: PluginOptions,
): Plugin | null {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  const firstTrackingId = options.trackingID[0];

  return {
    name: 'docusaurus-plugin-google-gtag-body',

    contentLoaded({actions}) {
      actions.setGlobalData(options);
    },

    getClientModules() {
      return ['./gtag'];
    },

    injectHtmlTags() {
      return {
        headTags: [
          // Only preconnect tags go in head
          {
            tagName: 'link',
            attributes: {
              rel: 'preconnect',
              href: 'https://www.google-analytics.com',
            },
          },
          {
            tagName: 'link',
            attributes: {
              rel: 'preconnect',
              href: 'https://www.googletagmanager.com',
            },
          },
        ],
        // Gtag script and initialization go at the end of body
        bodyTags: [
          {
            tagName: 'script',
            attributes: {
              async: true,
              src: `https://www.googletagmanager.com/gtag/js?id=${firstTrackingId}`,
            },
          },
          {
            tagName: 'script',
            innerHTML: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${createConfigSnippets(options)};
            `,
          },
        ],
      };
    },
  };
}

export {validateThemeConfig, validateOptions} from './options';

export type {PluginOptions, Options};
