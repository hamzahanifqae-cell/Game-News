import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

/** A crawlable social image derived from a real cover, not a separate invented asset. */
export async function shareImage(image: ImageMetadata | undefined) {
  if (!image) return undefined;
  const result = await getImage({ src: image, width: 1200, height: 675, format: 'webp' });
  const width = Number(result.attributes.width);
  const height = Number(result.attributes.height);
  return {
    src: result.src,
    ...(Number.isFinite(width) ? { width } : {}),
    ...(Number.isFinite(height) ? { height } : {}),
  };
}
