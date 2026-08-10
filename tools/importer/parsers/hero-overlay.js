/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-overlay.
 * Base block: hero
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--hero.cmp-teaser--imagebottom)
 * Generated: 2026-08-10
 *
 * Block structure (from library-description.txt): 1 column, 3 rows.
 * Row 1 = block name (handled by createBlock).
 * Row 2 single cell = background image (optional).
 * Row 3 single cell = title (heading) + subheading (description) + CTA (optional).
 */
export default function parse(element, { document }) {
  // INPUT extraction — validated against source.html
  const image = element.querySelector('.cmp-teaser__image img, img.cmp-image__image, img');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, [class*="description"]');
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'));

  // OUTPUT: hero is 1-column. Build the content cell (heading + description + CTA).
  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  ctas.forEach((cta) => contentCell.push(cta));

  // Empty-block guard.
  if (!image && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Row 2: background image (single-cell row) — only if present.
  if (image) cells.push([image]);
  // Row 3: content (single-cell row holding all text/CTA elements).
  if (contentCell.length) cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-overlay', cells });
  element.replaceWith(block);
}
