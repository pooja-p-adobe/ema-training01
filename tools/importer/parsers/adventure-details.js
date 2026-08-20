/* eslint-disable */
/* global WebImporter */
/**
 * Parser for adventure-details.
 * Base: adventure-details (custom spec key/value list — no library base block).
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 * Selector: article.cmp-contentfragment dl.cmp-contentfragment__elements
 *
 * Content model (one row per spec, 2 cells): [ Label ] [ Value ]
 * e.g. Activity | Surfing, Adventure Type | Overnight Trip, ...
 *
 * Source is a <dl> whose children are <div class="cmp-contentfragment__element">
 * wrappers, each holding a <dt> (label) and <dd> (value).
 */
export default function parse(element, { document }) {
  // Each spec pair is wrapped in a div; fall back to direct children if the
  // wrapper class differs across pages.
  let pairs = Array.from(element.querySelectorAll(':scope > .cmp-contentfragment__element'));
  if (!pairs.length) {
    pairs = Array.from(element.querySelectorAll(':scope > div'));
  }

  const cells = [];
  pairs.forEach((pair) => {
    const labelEl = pair.querySelector('.cmp-contentfragment__element-title, dt');
    const valueEl = pair.querySelector('.cmp-contentfragment__element-value, dd');

    const label = labelEl ? (labelEl.textContent || '').trim() : '';
    // Preserve rich value markup (links/emphasis) when present, else plain text.
    let value;
    if (valueEl && valueEl.children.length) {
      value = valueEl;
    } else {
      value = valueEl ? (valueEl.textContent || '').trim() : '';
    }

    if (!label && !(typeof value === 'string' ? value : value.textContent.trim())) return;
    cells.push([label, value]);
  });

  // Empty-block guard: no spec rows found — unwrap rather than emit empty block.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'adventure-details', cells });
  element.replaceWith(block);
}
