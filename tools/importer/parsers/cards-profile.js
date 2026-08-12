/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-profile.
 * Base block: cards
 * Source: https://wknd.site/us/en/about-us.html (section.cmp-experience-fragment--contributor)
 * Generated: 2026-08-12
 *
 * WKND "About Us" team page. Each person is its OWN
 * `section.cmp-experience-fragment--contributor` (an experience fragment), and
 * the page selector matches ALL 7 of them individually. The importer therefore
 * calls this parser once PER card section. cards-profile.js decorate() expects a
 * SINGLE block whose rows each become one <li> card.
 *
 * The 7 cards are FLAT SIBLINGS interleaved with two "underline" H2 headings in
 * document order:
 *   [h2 "Our Contributors"] [Stacey][Jake][Ian][Jacob]
 *   [h2 "WKND Guides"]      [Sofia][Justin][Kumar]
 * There are TWO logical groups, so we emit TWO cards-profile blocks split at the
 * "WKND Guides" heading (div.title.cmp-title--underline). Each block sits under
 * its own heading in document order: Contributors (4-up) above the "WKND Guides"
 * title, Guides (3-up) below it. The H2 title divs and intro paragraphs are
 * default content OUTSIDE the blocks and MUST stay in place between them.
 *
 * Aggregation per group (like cards-teaser): on the FIRST still-attached card of
 * a group we build that group's block, replace the first card with it, and remove
 * the OTHER cards IN THAT GROUP only — never touching the other group's cards or
 * the heading elements. Later per-instance calls for already-consumed cards
 * receive a detached element (parentNode === null) and no-op.
 *
 * Block structure (from library-description.txt — "Cards", 2 columns):
 *   First row  = block name.
 *   Each card  = one row of 2 cells:
 *     cell 0 (mandatory) = portrait image  -> decorate() -> .cards-profile-card-image
 *     cell 1 (mandatory) = text content    -> decorate() -> .cards-profile-card-body
 *       = name (h3, first heading) + role (h5, second heading) + social links.
 * decorate() reads headings[0]=name, headings[1]=role, and folds every <a> in
 * the body into the social icon row keyed off the link text (Facebook/Twitter/
 * Instagram), so social links are emitted as plain <a> with that platform text.
 */

const BLOCK_SELECTOR = 'section.cmp-experience-fragment--contributor';

/**
 * Build one 2-cell card row [imageCell, bodyCell] from a single person section.
 * Selectors validated against migration-work/block-context/cards-profile/source.html.
 */
function buildCardRow(card, document) {
  // INPUT extraction — validated against source.html, with fallbacks for variation.
  // Portrait image lives in .image > .cmp-image.
  const image = card.querySelector('.cmp-image img, img.cmp-image__image, img');

  // Name (h3) then role (h5). WKND wraps each in .cmp-title > .cmp-title__text;
  // querying all headings returns them in document order: [0]=name, [1]=role.
  const headings = Array.from(card.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const name = headings[0] || null;
  const role = headings[1] || null;

  // Social links: 3 icon-only buttons (<a class="cmp-button">) inside the
  // building-block grid. Use a querySelector-OR chain (no overlapping selectors)
  // so a link is never double-collected. Rebuild each as a clean <a> whose text
  // is the platform name so decorate() can key the icon off link.textContent
  // (source anchors carry the label in a .cmp-button__text span).
  let anchors = Array.from(card.querySelectorAll('a.cmp-button'));
  if (!anchors.length) {
    anchors = Array.from(card.querySelectorAll('.cmp-buildingblock--btn-list a[href], .buildingblock a[href]'));
  }
  // Wrap each anchor in its own <p> (block-level) so that markdown conversion
  // does NOT coalesce adjacent anchors that share an identical href — several
  // cards (Jacob, Sofia, Justin, Kumar) use the same href (e.g. "#" or
  // "#jacob-wester") for all three icons, and bare adjacent same-href <a>s merge
  // into one link ("FacebookTwitterInstagram"), losing 2 of 3 social links.
  // decorate() collects every <a> in the body and drops the emptied <p> wrappers.
  const socialLinks = anchors
    .map((a) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href') || '#';
      const textSpan = a.querySelector('.cmp-button__text');
      link.textContent = (textSpan ? textSpan.textContent : a.textContent).trim();
      if (!link.textContent) return null;
      const p = document.createElement('p');
      p.append(link);
      return p;
    })
    .filter(Boolean);

  // OUTPUT: cell 1 = text content in reading order (name, role, social links).
  const bodyCell = [];
  if (name) bodyCell.push(name);
  if (role) bodyCell.push(role);
  bodyCell.push(...socialLinks);

  // Skip fully-empty cards (defensive against cross-page variation).
  if (!image && bodyCell.length === 0) return null;

  // 2-column row: [image] | [content]. Pad missing cells to keep the column
  // count even (a short row produces a malformed block table).
  return [image || '', bodyCell.length ? bodyCell : ''];
}

/**
 * Locate the "WKND Guides" heading element that separates the two groups.
 * The two group headings are `div.title.cmp-title--underline` with an <h2>; the
 * "Our Contributors" one comes first, "WKND Guides" second. We match on the
 * heading text (robust to attribute ordering) and fall back to the second
 * underline-title if the text lookup fails.
 */
function findGuidesTitle(document) {
  const titles = Array.from(document.querySelectorAll('div.title.cmp-title--underline'));
  const byText = titles.find((t) => /wknd\s+guides/i.test(t.textContent || ''));
  if (byText) return byText;
  // Fallback: the second underline title is the Guides heading in this layout.
  return titles.length > 1 ? titles[1] : null;
}

export default function parse(element, { document }) {
  // The importer calls this once per matched card section. Cards belong to one
  // of two groups split at the "WKND Guides" heading. We aggregate PER GROUP:
  // the first still-attached card of a group builds that group's block and
  // removes the OTHER cards in the SAME group; later calls for consumed cards
  // receive a detached element (parentNode === null) and no-op. parentNode is
  // the robust connectivity check across both the validation browser and the
  // real jsdom import (where .remove() clears parentNode).
  if (!element.parentNode) return;

  const allCards = Array.from(document.querySelectorAll(BLOCK_SELECTOR));
  const guidesTitle = findGuidesTitle(document);

  // Partition cards into group 1 (before the Guides heading = Contributors) and
  // group 2 (after it = Guides) by document position. Without a heading (defensive
  // cross-page fallback) treat every card as a single group.
  // Node.DOCUMENT_POSITION_FOLLOWING (4) => guidesTitle comes AFTER the card,
  // i.e. the card precedes the heading and belongs to group 1 (Contributors).
  const DOCUMENT_POSITION_FOLLOWING = 4;
  const isBeforeGuides = (card) => {
    if (!guidesTitle) return true;
    // eslint-disable-next-line no-bitwise
    return (card.compareDocumentPosition(guidesTitle) & DOCUMENT_POSITION_FOLLOWING) !== 0;
  };

  const group = allCards.filter((card) => isBeforeGuides(card) === isBeforeGuides(element));
  const cards = group.length ? group : [element];

  // Aggregate only on the FIRST still-present card of THIS group; others no-op.
  if (cards[0] !== element) return;

  const cells = [];
  cards.forEach((card) => {
    const row = buildCardRow(card, document);
    if (row) cells.push(row);
  });

  // Empty-block guard: nothing extractable — unwrap rather than emit an empty block.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-profile', cells });
  element.replaceWith(block);

  // Remove the other cards IN THIS GROUP now folded into this block so their raw
  // content is not duplicated; their parse calls will then no-op. The other
  // group's cards and the heading elements are left untouched so each block sits
  // under its own heading in document order.
  cards.forEach((card) => {
    if (card !== element && card.isConnected) card.remove();
  });
}
