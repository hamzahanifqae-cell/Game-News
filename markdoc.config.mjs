import { defineMarkdocConfig, nodes, Markdoc } from '@astrojs/markdoc/config';
import { adsterraBanners, ADSTERRA_BANNER_SRC } from './src/lib/adsterra.ts';

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
  // Markdoc HTML-escapes ' and " in text, and a browser does not decode entities inside
  // <script>, so the same atOptions object is written with backtick strings.
  const options = `
  atOptions = {
    key : \`${adKey}\`,
    format : \`iframe\`,
    height : ${height},
    width : ${width},
    params : {}
  };
`;
  return new Tag('div', { class: 'ad-banner in-article-ad not-prose', 'data-pagefind-ignore': '' }, [
    new Tag('div', { class: 'ad-banner-inner' }, [
      new Tag('p', { class: 'ad-label' }, ['Advertisement']),
      new Tag('div', { class: 'ad-slot', style: `width:${width}px;min-height:${height}px` }, [
        new Tag('script', {}, [options]),
        new Tag('script', { 'data-cfasync': 'false', src: `${ADSTERRA_BANNER_SRC}${adKey}` }, []),
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
