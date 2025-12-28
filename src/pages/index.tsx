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
    title: 'Decentralized by Design',
    description:
      'No central server, no single point of failure. Nostr is a simple, open protocol for truly censorship-resistant global networks.',
    link: '/protocol/overview',
    icon: '🌐',
  },
  {
    title: 'Cryptographic Identity',
    description:
      'Your identity is your keypair. No email, no phone number, no permission needed. Just generate keys and start publishing.',
    link: '/getting-started/keys-and-signing',
    icon: '🔐',
  },
  {
    title: 'Simple Protocol',
    description:
      'JSON events over WebSocket. That\'s it. The protocol is intentionally minimal, making it easy to implement in any language.',
    link: '/protocol/events',
    icon: '⚡',
  },
  {
    title: 'Extensible via NIPs',
    description:
      'Nostr Improvement Proposals (NIPs) define optional features. Build what you need without breaking compatibility.',
    link: '/protocol/nips',
    icon: '🧩',
  },
  {
    title: 'Multi-Language Support',
    description:
      'Libraries available in JavaScript, Rust, Python, Go, and more. Pick your favorite language and start building.',
    link: '/libraries/overview',
    icon: '📚',
  },
  {
    title: 'Active Ecosystem',
    description:
      'Social clients, payment systems, marketplaces, and more. Join a thriving community of builders.',
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
              <p>Step-by-step tutorial to create a Nostr client</p>
            </div>
          </Link>
          <a href="https://github.com/nostr-protocol/nips" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📋</span>
            <div>
              <strong>NIPs Repository</strong>
              <p>Official Nostr Improvement Proposals</p>
            </div>
          </a>
          <Link to="/relays/overview" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>🔌</span>
            <div>
              <strong>Run a Relay</strong>
              <p>Set up your own Nostr relay server</p>
            </div>
          </Link>
          <Link to="/libraries/javascript" className={styles.quickLink}>
            <span className={styles.quickLinkIcon}>📦</span>
            <div>
              <strong>JavaScript SDK</strong>
              <p>nostr-tools and other JS libraries</p>
            </div>
          </Link>
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
      description="Comprehensive developer documentation for building on the Nostr protocol - the decentralized social protocol">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickLinks />
      </main>
    </Layout>
  );
}
