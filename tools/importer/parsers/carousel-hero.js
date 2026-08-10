/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero.
 * Base block: carousel
 * Source: https://wknd.site/us/en.html (.carousel.cmp-carousel--hero)
 * Generated: 2026-08-10
 *
 * Block structure (from library-description.txt): 2 columns, multiple rows.
 * First row = block name (handled by createBlock). Each subsequent row = one slide:
 *   cell 0 (mandatory) = slide image
 *   cell 1 (optional)  = text content: heading (title), description, CTA
 */
export default function parse(element, { document }) {
  // Each slide panel in the WKND carousel (excludes indicator <li> and action buttons).
  const slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));

  const cells = [];
  slides.forEach((slide) => {
    // INPUT extraction — validated against source.html
    const image = slide.querySelector('.cmp-teaser__image img, img.cmp-image__image, img');
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3');
    const description = slide.querySelector('.cmp-teaser__description, [class*="description"]');
    const ctas = Array.from(slide.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a'));

    // Skip slides that have neither an image nor any text (defensive).
    if (!image && !title && !description && ctas.length === 0) return;

    // OUTPUT: cell 1 holds the text content (heading + description + CTA).
    const contentCell = [];
    if (title) contentCell.push(title);
    if (description) contentCell.push(description);
    ctas.forEach((cta) => contentCell.push(cta));

    // 2-column row: [image] | [content]. Pad missing cells to keep column count even.
    cells.push([image || '', contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: nothing extracted -> unwrap.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
