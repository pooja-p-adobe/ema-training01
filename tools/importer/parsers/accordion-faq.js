/* eslint-disable */
/* global WebImporter */
/**
 * Parser for the "accordion-faq" block variant.
 * Base block: accordion (Block Collection).
 * Source: https://wknd.site/us/en/faqs.html (.accordion.panelcontainer)
 * Generated: 2026-08-12
 *
 * Content model (per library-description.txt + blocks/accordion-faq/accordion-faq.js):
 *   2 columns. First row = block name (added by createBlock).
 *   Each subsequent row = ONE Q&A item with 2 cells:
 *     cell[0] = Question (title -> <summary>)
 *     cell[1] = Answer  (body  -> collapsible panel)
 *
 * Source structure (AEM Core Components accordion):
 *   .cmp-accordion__item (x7)
 *     > h3.cmp-accordion__header > button.cmp-accordion__button > span.cmp-accordion__title  (QUESTION)
 *     > .cmp-accordion__panel ... .cmp-text > p                                              (ANSWER)
 */
export default function parse(element, { document }) {
  // Locate accordion items. Prefer the exact Core Components class; fall back
  // to a partial match only if the primary selector finds nothing (avoids
  // double-selecting the same node via overlapping comma selectors).
  let items = Array.from(element.querySelectorAll('.cmp-accordion__item'));
  if (!items.length) {
    items = Array.from(element.querySelectorAll('[class*="accordion__item"], [data-cmp-hook-accordion="item"]'));
  }

  const cells = [];

  items.forEach((item) => {
    // --- QUESTION (title / summary) -------------------------------------
    // Prefer the dedicated title span; fall back through header/button.
    const titleEl = item.querySelector('.cmp-accordion__title')
      || item.querySelector('.cmp-accordion__button')
      || item.querySelector('.cmp-accordion__header, h2, h3, h4, button');
    const question = titleEl
      ? titleEl.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim()
      : '';

    // --- ANSWER (panel body) --------------------------------------------
    const panel = item.querySelector('.cmp-accordion__panel')
      || item.querySelector('[class*="__panel"]');

    let answerNodes = [];
    if (panel) {
      // Pull the meaningful content elements out of the nested container
      // wrappers (.container > .cmp-container > .text > .cmp-text > p ...).
      answerNodes = Array.from(
        panel.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, img'),
      ).filter((el) => (
        el.tagName === 'IMG'
        || el.querySelector('img')
        || el.textContent.replace(/ /g, ' ').trim() !== ''
      ));
      // Fallback: if no recognised content elements were found, keep whatever
      // the panel contains so nothing is silently dropped.
      if (!answerNodes.length && panel.textContent.replace(/ /g, ' ').trim()) {
        answerNodes = Array.from(panel.childNodes);
      }
    }

    // Skip fully empty items.
    if (!question && answerNodes.length === 0) return;

    // 2-column row: [question, answer]. Pad the answer cell if empty so every
    // row keeps the same column count.
    cells.push([question, answerNodes.length ? answerNodes : '']);
  });

  // Empty-block guard: nothing extracted -> unwrap rather than emit an empty block.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
