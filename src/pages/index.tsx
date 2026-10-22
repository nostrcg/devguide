import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/getting-started/introduction">
            Get Started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/protocol/overview">
            Explore the Protocol
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  description: string;
  link: string;
  icon: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'No Central Server',
    description:
      'Users publish to the relays they choose and clients read from many at once. If one relay drops you, your followers can still find you on another.',
    link: '/protocol/overview',
    icon: '🌐',
  },
  {
    title: 'Cryptographic Identity',
    description:
      'An identity is a secp256k1 keypair. Every event is signed, so any client can check who wrote it. Apps should ask a signer for signatures, not for the secret key.',
    link: '/getting-started/keys-and-signing',
    icon: '🔐',
  },
  {
    title: 'Small Core Protocol',
    description:
      'The core, NIP-01, is signed JSON events sent over WebSocket. It is small enough to implement from scratch in most languages.',
    link: '/protocol/events',
    icon: '⚡',
  },
  {
    title: 'Extensible via NIPs',
    description:
      'NIPs (Nostr Implementation Possibilities) describe optional features: private DMs, zaps, lists, groups, media and more. Implement only the ones your app needs.',
    link: '/protocol/nips',
    icon: '🧩',
  },
  {
    title: 'Libraries in Many Languages',
    description:
      'nostr-tools for JavaScript, Nostr Dev Kit for Rust and its bindings, nostr-sdk for Python, fiatjaf.com/nostr for Go, and more.',
    link: '/libraries/overview',
    icon: '📚',
  },
  {
    title: 'Clients and Tools',
    description:
      'Social clients, signers, relays, media servers and developer tools to build on and test against.',
    link: '/ecosystem/clients',
    icon: '🚀',
  },
];

function Feature({title, description, link, icon}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.feature)}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <Link to={link} className={styles.featureLink}>
          Learn more →
        </Link>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  return (
    <section className={styles.quickLinks}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Quick Links
        </Heading>
        <div className={styles.linkGrid}>
          <Link to="/getting-started/first-app" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>🛠️</span>
            <div>
              <strong>Build Your First App</strong>
              <p>Read and publish notes with nostr-tools, step by step</p>
            </div>
          </Link>
          <a href="https://github.com/nostr-protocol/nips" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📋</span>
            <div>
              <strong>NIPs Repository</strong>
              <p>The Nostr Implementation Possibilities, upstream</p>
            </div>
          </a>
          <Link to="/relays/overview" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>🔌</span>
            <div>
              <strong>Run a Relay</strong>
              <p>Pick relay software and deploy it</p>
            </div>
          </Link>
          <Link to="/libraries/javascript" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📦</span>
            <div>
              <strong>JavaScript</strong>
              <p>nostr-tools and other JS libraries</p>
            </div>
          </Link>
          <a href="https://github.com/nostrcg/devguide/wiki" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>🧰</span>
            <div>
              <strong>Wiki</strong>
              <p>Tested recipes: nak, snippets, reverse proxies</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="Developer documentation for building clients, relays and tools on the Nostr protocol">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickLinks />
      </main>
    </Layout>
  );
}
