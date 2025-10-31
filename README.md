# nave

*Nav(e)igate the Bible through topics.*

Imagine a dictionary of topics, with the Bible as definitions. Based off of Nave's Topical Bible.

## What's Nave's Topical Bible

Nave's Topical Bible (1897) is an amazingly comprehensive Bible reference work compiled by Orville J. Nave, a chaplain in the United States Army. It organizes biblical subjects alphabetically, providing verse references for **over 20,000 topics**. Nave referred to his work as "the result of fourteed years of delightful and untiring study of the Word of God." It also happens to be in the public domain.

This project imagines how Nave would organize his work in a web interface to make it even easier to *Nav(e)igate scripture*.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Project Setup

```sh
bun install
```

### Compile and Hot-Reload for Development

```sh
bun dev
```

### Type-Check, Compile and Minify for Production

```sh
bun run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
bun test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
bun lint
```

## Nave Scraper

A scraper for Nave's Topical Bible from www.naves-topical-bible.com, using Bun.

```bash
bun install
```

To run:

```bash
bun run scrape
```
