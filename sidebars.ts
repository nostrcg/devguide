import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  mainSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/introduction',
        'getting-started/how-nostr-works',
        'getting-started/keys-and-signing',
        'getting-started/first-app',
      ],
    },
    {
      type: 'category',
      label: 'Protocol',
      collapsed: true,
      items: [
        'protocol/overview',
        'protocol/events',
        'protocol/kinds',
        'protocol/filters',
        'protocol/nips',
        'protocol/relay-communication',
        'protocol/did-nostr',
      ],
    },
    {
      type: 'category',
      label: 'Libraries',
      collapsed: true,
      items: [
        'libraries/overview',
        'libraries/javascript',
        'libraries/rust',
        'libraries/python',
        'libraries/go',
        'libraries/other',
      ],
    },
    {
      type: 'category',
      label: 'Relays',
      collapsed: true,
      items: [
        'relays/overview',
        'relays/implementations',
        'relays/running-a-relay',
        'relays/configuration',
        'relays/reverse-proxy',
        'relays/hosting',
        'relays/explorers',
        'relays/sync-tools',
      ],
    },
    {
      type: 'category',
      label: 'Ecosystem',
      collapsed: true,
      items: [
        'ecosystem/clients',
        'ecosystem/tools',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      items: [
        'guides/mobile-development',
        'guides/key-management',
        'guides/building-clients',
        'guides/nip-implementation',
        'guides/nip05-verification',
        'guides/zaps',
        'guides/algorithms',
        'guides/social-graph',
        'guides/testing',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: [
        'reference/event-kinds',
        'reference/nip-index',
        'reference/relay-info',
        'reference/snippets',
        'reference/faq',
      ],
    },
  ],
};

export default sidebars;
