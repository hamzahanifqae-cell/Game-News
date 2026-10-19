# GameNews editorial artwork

Three original AI-generated illustrations created for GameNews on 2026-10-15:

- digital-everyday.png — homepage hero and review fallback
- practical-guides.png — tutorials and guide navigation
- everyday-fixes.png — troubleshooting and help navigation

These are illustrative lifestyle scenes, not photographs of tested products, real app screenshots, or evidence for review claims. CMS cover images take precedence. Replace fallback artwork with relevant authorized screenshots or editorial imagery when publishing real app-specific content.

Astro generates local WebP assets for delivery; the original PNGs are source files only. Homepage hero loads eagerly, navigation and card images load lazily. Do not remove these files while they are imported by src/lib/editorial-images.ts.
