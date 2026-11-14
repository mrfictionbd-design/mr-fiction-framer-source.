# MR. FICTION Motion Demo

A separate Next.js + Framer Motion study inspired by the interaction patterns of the original MR. FICTION Framer site.

## Run locally
`npm install`
`npm run dev`

## Preview routes
- `/` — MR. FICTION motion-led landing page and interactive depth gallery.
- `/collection` — product-image grid with scroll reveals.
- `/compare` — original Framer site versus this rebuilt demo.

## Motion mapping
- Gallery: four depth planes, cursor parallax, idle drift, pointer drag, wheel zoom, click-to-focus.
- Scroll reveals: text from y=20px + 8px blur, image from scale 1.03 + 14px blur, 0.07s stagger.
- Page curtain: 0.7s cover/reveal using cubic-bezier(0.65, 0, 0.35, 1).
- House easing: cubic-bezier(0.22, 1, 0.36, 1).
- Header: frosted glass after scroll.

This is an independent implementation of the motion behaviours, not a pixel-perfect port of Framer's runtime or CMS. Product pricing, inventory, checkout, payment, delivery claims and customer data are not included.
