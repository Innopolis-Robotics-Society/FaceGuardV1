# FaceGuard Admin Panel Prototype

This directory contains the interactive MVP v0 administrator interface generated from and refined after the FaceGuard Figma prototype.

## Local development

Prerequisites: Node.js 20.19 or later and npm.

```bash
npm ci
npm run dev
```

## Production build

```bash
npm ci
npm run build
```

The generated static files are written to `dist/`.

## Deployment

- University VM: build and serve the included Dockerfile on port 3000.
- GitHub Pages: `.github/workflows/deploy-pages.yml` builds this directory after changes reach `main`.

The application uses hash-based routing so that client-side routes work on static hosting.

## Source design

<https://www.figma.com/design/SRfKSsmTXU7thEWzW2f78g/FaceGuard-Admin-Panel-Design>
