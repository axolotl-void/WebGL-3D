# WebGL-3D

Immersive WebGL portfolio built with React 19 + Vite + Three.js + R3F. Scroll-driven 3-zone experience (Hero → Cube → Contact/Projects).

## Stack

- React 19
- Vite 6
- Three.js 0.172 + @react-three/fiber + @react-three/drei
- @react-three/postprocessing
- GSAP 3.12

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # outputs to dist/
npm run preview      # preview built output
```

## Deploy to Vercel

The project is a standard Vite SPA. Vercel auto-detects `vite` and uses `npm run build` with `dist/` as output.

1. Push to GitHub: `git push origin main`
2. Visit https://vercel.com/new
3. Import `axolotl-void/WebGL-3D`
4. Vercel auto-configures: build = `npm run build`, output = `dist`
5. Click **Deploy**

The included `vercel.json` adds:
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- Long-term caching for `/models/*` and `/assets/*`
- SPA-friendly configuration

## Browser support

Modern evergreen browsers (Chrome 90+, Firefox 88+, Safari 14+). WebGL 2 required.

## License

Private portfolio project. All rights reserved.
