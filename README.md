# Nostr Developer Guide

Source for <https://nostrcg.github.io/devguide/>, the developer guide of the
[W3C Nostr Community Group](https://www.w3.org/community/nostr/). It is a Community Group work, not a W3C Standard.
The site is built with [Docusaurus](https://docusaurus.io/). Practical recipes also live in the
[wiki](https://github.com/nostrcg/devguide/wiki).

## Branches

The site **source** lives on the `gh-pages` branch (this branch). There is no separate build branch: GitHub Actions builds
the site and publishes it to GitHub Pages.

## Local development

The repository has a `package-lock.json`, so use npm:

```bash
npm ci
npm start
```

`npm start` runs a dev server with live reload at <http://localhost:3000/devguide/>.

## Build

```bash
npm run build
npm run serve   # preview the build locally
```

The build fails on broken internal links, anchors and Markdown links. Fix them before you push.

## Deployment

Push to `gh-pages`. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm ci` and
`npm run build`, then deploys `build/` to GitHub Pages.

> [!CAUTION]
> **Don't run `npx docusaurus deploy`.** It pushes the built HTML to the `gh-pages` branch, which here holds the source,
> so it would replace the source tree with build output. (The `deploy` npm script was removed for this reason.)

## Contributing

- Every code sample should be run against current libraries before it is merged, or copied from a current upstream README.
- Check NIP details against [nostr-protocol/nips](https://github.com/nostr-protocol/nips).
- `docs/reference/event-kinds.md` and `docs/reference/nip-index.md` are generated from the NIPs README. Regenerate them
  rather than editing them by hand: `python3 -I scripts/gen-reference.py <path-to-nips-clone> .`
