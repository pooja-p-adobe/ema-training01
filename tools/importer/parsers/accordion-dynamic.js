/* eslint-disable */
/* global WebImporter */

/**
 * accordion-dynamic parser — emits a query-index-driven FAQ accordion block.
 *
 * This is a DYNAMIC variant of the accordion block. The standard accordion
 * convention is one authored row per item (Title cell + Content cell); here the
 * items are generated at RUNTIME from a query-index feed, so there is no
 * per-item authored content. The block instead carries a single configuration
 * row whose only cell is the feed path. The accordion-dynamic block JS fetches
 * that feed and renders one collapsible panel per entry (question -> clickable
 * title/summary, answer -> toggled content) — the same expand/collapse UX and
 * visual layout as the static accordion. The authored path is the production
 * root path (/wknd-faqs.json); the block falls back to an embedded dataset when
 * no feed resolves (EDS does not serve raw uploaded .json blobs).
 *
 * Table shape (createBlock): row 0 = block name; row 1 = [ feed-path link ].
 */

const FEED_PATH = '/wknd-faqs.json';

export default function parse(element, { document }) {
  const link = document.createElement('a');
  link.href = FEED_PATH;
  link.textContent = FEED_PATH;

  const cells = [[link]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-dynamic', cells });
  element.replaceWith(block);
}
