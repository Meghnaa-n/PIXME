# PIXME — Memory Mosaic Studio

> The big picture is made of all the little ones.

---

## What is PIXME?

PIXME is a browser based photomosaic generator that transforms any image into a stunning mosaic made entirely from your own photos. Every tile is a real photograph. Every zoom reveals a new story.

No app. No install. No backend. Just you, your photos, and a canvas that remembers everything.

---

## How It Works

1. Upload a target image — a portrait, a place, a moment
2. Add your source photos — or let PIXME suggest 200 color-matched ones from Unsplash
3. Watch the mosaic build itself in real time, tile by tile
4. Export at **5760 × 3840px** — crisp enough to print, zoom, and frame

The engine splits the target into a grid, analyzes the RGB color of each cell, and matches it to the closest source photo. The result is a real photomosaic — not a filter, not a pixelation effect. Actual photographs, arranged with mathematical precision.

---

## Features

**Studio Controls**

- Tile density — Low (900) · Medium (2500) · High (5000) · Ultra (9000)
- Reveal animations — Wave · Spiral · Row by Row · Random
- Timeline scrubber — rewind through generation snapshots
- Real-time progress bar with stage labels

**Exploration Tools**

- Magnifier lens — 4× zoom showing the actual source photo in each tile
- Heatmap mode — green / yellow / red match quality overlay
- Compare mode — drag slider between original and mosaic
- Tile inspector — click any tile to see exactly which photo was used

**Memory Experience**

- Name your mosaic for someone
- Choose a caption or write your own
- Sealed kraft envelope + red wax seal animation
- Download at full resolution as a document — no WhatsApp compression

**Smart Photo Suggestions**

- Analyzes your target image's dominant colors
- Fetches 200 Unsplash photos matched to those colors
- One click to add any suggestion to your source pool

---

## Tech Stack


| Layer      | Tech                    |
| ---------- | ----------------------- |
| Framework  | Next.js 15 (App Router) |
| Language   | TypeScript              |
| Animation  | Framer Motion           |
| Rendering  | HTML Canvas API         |
| Photo API  | Unsplash                |
| Deployment | Vercel                  |


Everything runs in the browser. Zero server. Zero database. Zero latency on your memories.

---

## File Structure

```
app/
├── page.tsx        — root router between views
├── landing.tsx     — animated pastel landing page
├── upload.tsx      — upload flow + Unsplash suggestion system
├── studio.tsx      — main mosaic studio
├── memory.tsx      — memory letter gifting experience
├── layout.tsx      — metadata
└── globals.css     — global styles
```

---

## Live

**[pixme-ten.vercel.app](https://pixme-ten.vercel.app)**

---

*Built with obsessive attention to detail. Every pixel placed with purpose.*