import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Nostr Developer Guide',
  tagline: 'Build clients, relays and tools on the Nostr protocol',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  url: 'https://nostrcg.github.io',
  baseUrl: '/devguide/',

  organizationName: 'nostrcg',
  projectName: 'devguide',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

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
      {name: 'description', content: 'Developer documentation for building on the Nostr protocol, from the W3C Nostr Community Group'},
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
          to: '/guides/mobile-development',
          label: 'Guides',
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
          href: 'https://github.com/nostrcg/devguide/wiki',
          label: 'Wiki',
          position: 'right',
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
            {label: 'NIP Index', to: '/reference/nip-index'},
            {label: 'Event Kinds', to: '/reference/event-kinds'},
            {label: 'Libraries', to: '/libraries/overview'},
            {label: 'Relay Guide', to: '/relays/overview'},
            {label: 'NIPs repository', href: 'https://github.com/nostr-protocol/nips'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'W3C Nostr CG', href: 'https://www.w3.org/community/nostr/'},
            {label: 'Devguide wiki', href: 'https://github.com/nostrcg/devguide/wiki'},
            {label: 'Devguide on GitHub', href: 'https://github.com/nostrcg/devguide'},
            {label: 'nostr-protocol on GitHub', href: 'https://github.com/nostr-protocol'},
          ],
        },
      ],
      copyright:
        'Last reviewed October 2026. A work of the W3C Nostr Community Group: a Community Group work, ' +
        'not a W3C Standard and not on the W3C Standards Track. Built with Docusaurus.',
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
