import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Convert the social link list into an icon row. The link text (Facebook /
 * Twitter / Instagram) keys the icon; the visible text is replaced with an
 * accessible label so only the glyph shows.
 * @param {Element} list the social <ul>
 */
function decorateSocial(list) {
  list.classList.add('footer-social');
  list.querySelectorAll('a').forEach((a) => {
    const label = a.textContent.trim();
    const platform = label.toLowerCase();
    a.classList.add('footer-social-link', `footer-social-link-${platform}`);
    a.setAttribute('aria-label', label);
    a.setAttribute('title', label);
    a.textContent = '';
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment — try local content path first (aem up serves
  // authored docs under /content), then fall back to the site-root footer doc.
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  let fragment = await loadFragment('/content/footer');
  if (!fragment || !fragment.firstElementChild) {
    fragment = await loadFragment(footerPath);
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // tag the four sections: brand, nav, social, legal
  const classes = ['brand', 'nav', 'social', 'legal'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(`footer-${c}`);
  });

  // strip button styling from the logo link
  const brand = footer.querySelector('.footer-brand');
  if (brand) {
    const brandLink = brand.querySelector('a');
    if (brandLink) {
      brandLink.className = '';
      const bc = brandLink.closest('.button-container');
      if (bc) bc.className = '';
    }
  }

  // build the social icon row
  const social = footer.querySelector('.footer-social ul');
  if (social) decorateSocial(social);

  block.append(footer);
}
