/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-feature.
 * Base block: columns
 * Source: https://wknd.site/us/en.html (.teaser.cmp-teaser--featured)
 * Generated: 2026-08-10
 *
 * Block structure (from library-description.txt): flexible columns/rows; first row = block name.
 * Featured article teaser = 1 content row, 2 columns:
 *   col 0 = image
 *   col 1 = text content: pretitle, heading (title), description, CTA
 */
export default function parse(element, { document }) {
  // INPUT extraction — validated against source.html
  const image = element.querySelector('.cmp-teaser__image img, img.cmp-image__image, img');
  const pretitle = element.querySelector('.cmp-teaser__pretitle, [class*="pretitle"]');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, [class*="description"]');
  const ctas = Array.from(element.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'));

  // OUTPUT: col 1 holds the text stack (pretitle + heading + description + CTA).
  const contentCell = [];
  if (pretitle) contentCell.push(pretitle);
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  ctas.forEach((cta) => contentCell.push(cta));

  // Empty-block guard.
  if (!image && contentCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Single 2-column content row: [image] | [content].
  const cells = [
    [image || '', contentCell.length ? contentCell : ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-feature', cells });
  element.replaceWith(block);
}
