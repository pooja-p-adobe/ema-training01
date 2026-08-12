/*
 * Accordion (FAQ) Block
 * Standard accessible collapsible accordion for FAQ-style Q&A content.
 * Base: Block Collection "accordion" (https://www.aem.live/developer/block-collection/accordion)
 *
 * Content model (one row per Q&A, 2 cells):
 *   [ Question ] [ Answer ]
 *
 * Each row becomes a native <details>/<summary> disclosure: the question is the
 * clickable summary, the answer is the collapsible body. Native <details>
 * gives keyboard accessibility (Enter/Space toggle), correct semantics, and
 * expand/collapse out of the box. All panels start collapsed; each toggles
 * independently.
 *
 * Self-contained: no external plugin deps. This project's scripts.js does NOT
 * export moveInstrumentation/fetchPlaceholders, so they are intentionally not
 * imported (unlike the vanilla Block Collection accordion).
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 1) return;

    // decorate accordion item label (the question)
    const label = cells[0];
    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    summary.append(...label.childNodes);

    // decorate accordion item body (the answer)
    const body = cells[1] || document.createElement('div');
    body.className = 'accordion-faq-item-body';

    // decorate accordion item
    const details = document.createElement('details');
    details.className = 'accordion-faq-item';
    details.append(summary, body);
    row.replaceWith(details);
  });
}
