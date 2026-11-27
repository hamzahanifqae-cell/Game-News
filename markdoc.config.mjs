import { defineMarkdocConfig, nodes, Markdoc } from '@astrojs/markdoc/config';
import { adsterraBanners, adsterraBannerTag, adsterraWriteScript } from './src/lib/adsterra.ts';

const { Tag } = Markdoc;

/**
 * Article pages render their content with `<Content inArticleAd={true} />`. For those pages only,
 * the Adsterra 300x250 tag is inserted after the 2nd top-level paragraph, so Adsterra's own tag
 * (inline atOptions + invoke script, unaltered) sits in the HTML where the ad appears. Legal pages
 * and app profiles are rendered without the variable and get no ad.
 *
 * Plain HTML tags are used here (not an Astro component) so the markup matches AdBanner.astro.
 */
function inArticleAdTag() {
  const { adKey, width, height } = adsterraBanners.rectangle300x250;
  // Same consent-gated writer as AdBanner.astro: the exact Adsterra tag, base64-encoded so
  // Markdoc's quote escaping cannot change it.
  const write = adsterraWriteScript(adsterraBannerTag(adKey, width, height));
  return new Tag('div', { class: 'ad-banner in-article-ad not-prose', 'data-pagefind-ignore': '' }, [
    new Tag('div', { class: 'ad-banner-inner' }, [
      new Tag('p', { class: 'ad-label' }, ['Advertisement']),
      new Tag('div', { class: 'ad-slot', style: `width:${width}px;min-height:${height}px` }, [
        new Tag('script', {}, [write]),
      ]),
    ]),
  ]);
}

export default defineMarkdocConfig({
  nodes: {
    document: {
      ...nodes.document,
      transform(node, config) {
        const children = node.transformChildren(config);
        if (config.variables?.inArticleAd) {
          let paragraphs = 0;
          const index = children.findIndex((child) => child?.name === 'p' && ++paragraphs === 2);
          children.splice(index >= 0 ? index + 1 : children.length, 0, inArticleAdTag());
        }
        return new Tag('article', node.transformAttributes(config), children);
      },
    },
  },
});
