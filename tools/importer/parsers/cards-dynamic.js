/* eslint-disable */
/* global WebImporter */

/**
 * cards-dynamic parser — emits a query-index-driven article list block.
 *
 * This is a DYNAMIC variant of cards: rather than one authored row per card
 * (image cell + text cell, per the cards convention), the list is generated at
 * runtime from a query-index feed. The block therefore carries a single
 * configuration row whose only cell is the feed path; the cards-dynamic block
 * JS fetches that feed and renders one card (image + title + description) per
 * entry — matching the cards layout visually. The authored path is the
 * production root path (/wknd-articles.json); the block falls back to
 * /content/... for local dev.
 *
 * Table shape (createBlock): row 0 = block name; row 1 = [ feed-path link ].
 */

const FEED_PATH = '/wknd-articles.json';

export default function parse(element, { document }) {
  const link = document.createElement('a');
  link.href = FEED_PATH;
  link.textContent = FEED_PATH;

  const cells = [[link]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-dynamic', cells });
  element.replaceWith(block);
}
