/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-gallery.
 * Base block: cards
 * Source: https://wknd.site/us/en.html (main.cmp-layout-container--fixed:nth-of-type(2) div.image-list.list)
 * Generated: 2026-08-10
 *
 * Block structure (from library-description.txt): 2 columns, multiple rows.
 * First row = block name. Each subsequent row = one card:
 *   cell 0 (mandatory) = card image
 *   cell 1 (mandatory) = text content: title (heading/link) + description
 */
export default function parse(element, { document }) {
  // Each adventure card is a list item in the WKND image list.
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item, li'));

  const cells = [];
  items.forEach((item) => {
    // INPUT extraction — validated against source.html
    const image = item.querySelector('.cmp-image-list__item-image img, img.cmp-image__image, img');
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link, .cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description, [class*="description"]');

    // Skip empty items (defensive).
    if (!image && !titleLink && !titleText && !description) return;

    // OUTPUT: cell 1 holds the text content (title link + description).
    const contentCell = [];
    if (titleLink) {
      contentCell.push(titleLink);
    } else if (titleText) {
      contentCell.push(titleText);
    }
    if (description) contentCell.push(description);

    // 2-column row: [image] | [content]. Pad missing cells to keep column count even.
    cells.push([image || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-gallery', cells });
  element.replaceWith(block);
}
