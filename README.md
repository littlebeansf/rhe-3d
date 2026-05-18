# Rhe.3d

> Convert images to 3D-printable objects — directly in your browser.

[![Deploy to GitHub Pages](https://github.com/littlebeansf/rhe-3d/actions/workflows/deploy.yml/badge.svg)](https://github.com/littlebeansf/rhe-3d/actions/workflows/deploy.yml)

**Live:** [littlebeansf.github.io/rhe-3d](https://littlebeansf.github.io/rhe-3d/)

---

## Features

- **Upload** PNG, JPG, WebP, SVG, BMP, GIF images
- **Heightmap / Lithophane** conversion — pixel brightness → Z depth
- **Live 3D preview** with orbit controls, wireframe toggle, grid
- **Editing tools** — extrusion depth, base plate, smoothing, scale (X/Y/Z), resolution
- **Mesh validation** — manifold check, wall thickness warning, overhang detection
- **Export** to `.stl`, `.3mf`, `.obj`, `.glb`
- `.step` export — _roadmap_

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + shadcn/ui |
| 3D Rendering | Three.js |
| Geometry | Custom heightmap + watertight mesh builder |
| Export | Binary STL, 3MF (JSZip), OBJ, GLB (GLTFExporter) |
| Backend | Express + SQLite via Drizzle ORM |

## Competitive Gaps

Unlike Meshy AI, Tripo AI, or ImageToSTL.com:
- **No account required** — fully client-side conversion
- **STEP export** on roadmap (no competitor offers this)
- **Open source** — MIT license
- **Self-hostable**

## Development

```bash
npm install
npm run dev          # dev server on :5000
npm run build        # production build
```

## License

MIT — Sebastian Fries / littlebeansf
