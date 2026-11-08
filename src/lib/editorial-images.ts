import hero from '../assets/editorial/digital-everyday.png';
import guides from '../assets/editorial/practical-guides.png';
import troubleshooting from '../assets/editorial/everyday-fixes.png';

// Original illustrations created for GameNews and stored in src/assets/editorial/.
// These are site-owned artwork, not publisher capsules, screenshots, or key art.
// Terms: created for this site and used only with alt text that describes them as illustrations.
// See src/assets/editorial/rights.json.
export const editorialImages = {
  news: { src: hero, alt: 'Illustrative editorial artwork.' },
  review: { src: hero, alt: 'Editorial artwork of a smartphone, notebook, headphones, and coffee on a sunlit desk.' },
  tutorial: { src: guides, alt: 'Editorial artwork of a hand holding a phone beside a notebook and laptop.' },
  troubleshooting: { src: troubleshooting, alt: 'Editorial artwork of a smartphone and charging cable beside a laptop on a sage desk.' },
};
