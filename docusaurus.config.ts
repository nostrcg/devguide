import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Nostr Developer Guide',
  tagline: 'Build decentralized applications on the Nostr protocol',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://nostrcg.github.io',
  baseUrl: '/devguide/',

  organizationName: 'nostrcg',
  projectName: 'devguide',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/nostrcg/devguide/tree/gh-pages/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/nostr-social-card.jpg',

    metadata: [
      {name: 'keywords', content: 'nostr, protocol, decentralized, social, development, nips, relay, client'},
      {name: 'description', content: 'Comprehensive developer documentation for building on the Nostr protocol'},
      {property: 'og:type', content: 'website'},
    ],

    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },

    announcementBar: {
      id: 'contribute',
      content: 'Help improve these docs! <a href="https://github.com/nostrcg/devguide">Contribute on GitHub</a>',
      backgroundColor: '#8B5CF6',
      textColor: '#fff',
      isCloseable: true,
    },

    navbar: {
      title: 'Nostr Dev Guide',
      logo: {
        alt: 'Nostr Logo',
        src: 'img/logo.jpg',
        width: 32,
        height: 32,
      },
      items: [
        {
          to: '/getting-started/introduction',
          label: 'Getting Started',
          position: 'left',
        },
        {
          to: '/protocol/overview',
          label: 'Protocol',
          position: 'left',
        },
        {
          to: '/libraries/overview',
          label: 'Libraries',
          position: 'left',
        },
        {
          to: '/relays/overview',
          label: 'Relays',
          position: 'left',
        },
        {
          type: 'dropdown',
          label: 'Ecosystem',
          position: 'left',
          items: [
            {label: 'Clients', to: '/ecosystem/clients'},
            {label: 'Tools', to: '/ecosystem/tools'},
            {type: 'html', value: '<hr style="margin: 0.5rem 0;">'},
            {label: 'NIPs', href: 'https://github.com/nostr-protocol/nips'},
            {label: 'Awesome Nostr', href: 'https://github.com/aljazceru/awesome-nostr'},
          ],
        },
        {
          href: 'https://github.com/nostrcg/devguide',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {label: 'Getting Started', to: '/getting-started/introduction'},
            {label: 'Protocol Basics', to: '/protocol/overview'},
            {label: 'Build Your First App', to: '/getting-started/first-app'},
          ],
        },
        {
          title: 'Reference',
          items: [
            {label: 'Libraries', to: '/libraries/overview'},
            {label: 'NIPs', href: 'https://github.com/nostr-protocol/nips'},
            {label: 'Relay Guide', to: '/relays/overview'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'W3C Nostr CG', href: 'https://www.w3.org/community/nostr/'},
            {label: 'GitHub', href: 'https://github.com/nostr-protocol'},
            {label: 'Nostr Apps', href: 'https://nostr.net'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} W3C Nostr Community Group. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'rust', 'python', 'go'],
    },

    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
