/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-teaser.
 * Base block: cards
 * Source: https://wknd.site/us/en/magazine.html (.teaser.cmp-teaser--secure)
 * Generated: 2026-08-12
 *
 * WKND "Members Only" locked/secure teasers. The page selector
 * `.teaser.cmp-teaser--secure` matches EACH secure teaser individually (there
 * are 2: "Alaskan Adventure" and "Fly Fishing the Amazon"), so the importer
 * calls this parser once PER teaser element. cards-teaser.js decorate() expects
 * a SINGLE block whose rows each become one card (one <li>). To satisfy both, we
 * AGGREGATE: the first matched teaser builds one 2-column block with a row per
 * teaser and removes the remaining secure teasers; later invocations receive an
 * already-consumed (detached) element and no-op.
 *
 * Block structure (from library-description.txt — "Cards", 2 columns):
 *   First row  = block name.
 *   Each card  = one row:
 *     cell 0 (mandatory) = card image.
 *     cell 1 (mandatory) = text content: title (heading) + description + CTA.
 * The image renders BELOW the text via the variant CSS ordering; the "Read More"
 * CTA is plain text in the locked source (no href), so it is emitted as a plain
 * <p> (decorate() treats the last body paragraph as the CTA).
 */

/**
 * Build one 2-cell card row [imageCell, bodyCell] from a single secure teaser.
 * Selectors validated against migration-work/block-context/cards-teaser/source.html.
 */
function buildCardRow(teaser, document) {
  // INPUT extraction — validated against source.html, with fallbacks for variation.
  const image = teaser.querySelector('.cmp-teaser__image img, img.cmp-image__image, img');
  const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3, h4, h5, h6');

  // Description: source varies — teaser 1 wraps text in <p>, teaser 2 puts the
  // text directly in the div. Reuse the inner <p> when present, else wrap the
  // div's text in a fresh <p> so decorate() can classify it as the description.
  const descEl = teaser.querySelector('.cmp-teaser__description, [class*="description"]');
  let descP = null;
  if (descEl) {
    const innerP = descEl.querySelector('p');
    if (innerP && innerP.textContent.trim()) {
      descP = innerP;
    } else if (descEl.textContent.trim()) {
      descP = document.createElement('p');
      descP.textContent = descEl.textContent.trim();
    }
  }

  // CTA ("Read More"): locked teaser => plain text, usually no href. Emit as a
  // <p> so decorate() tags it as the CTA (last body paragraph). Preserve a link
  // if one is present (unlocked variation).
  const actionEl = teaser.querySelector('.cmp-teaser__action-container, .cmp-teaser__action, [class*="action"]');
  let ctaP = null;
  if (actionEl) {
    const link = actionEl.querySelector('a[href]');
    if (link) {
      ctaP = document.createElement('p');
      ctaP.append(link);
    } else if (actionEl.textContent.trim()) {
      ctaP = document.createElement('p');
      ctaP.textContent = actionEl.textContent.trim();
    }
  }

  // OUTPUT: cell 1 = text content (title + description + CTA), in reading order.
  const bodyCell = [];
  if (title) bodyCell.push(title);
  if (descP) bodyCell.push(descP);
  if (ctaP) bodyCell.push(ctaP);

  // Skip fully-empty teasers (defensive against cross-page variation).
  if (!image && bodyCell.length === 0) return null;

  // 2-column row: [image] | [content]. Pad missing cells to keep the column
  // count even (a short row produces a malformed block table).
  return [image || '', bodyCell.length ? bodyCell : ''];
}

export default function parse(element, { document }) {
  // The importer calls this once per matched secure teaser. We fold ALL secure
  // teasers into ONE block on the first call and remove the siblings, so later
  // calls receive a detached element (parentNode === null) and no-op. `parentNode`
  // is the robust connectivity check across both the validation browser and the
  // real jsdom import (where `.remove()` clears parentNode).
  if (!element.parentNode) return;

  const allTeasers = Array.from(document.querySelectorAll('.teaser.cmp-teaser--secure'));
  // Aggregate only on the first still-present secure teaser; any others no-op.
  if (allTeasers.length && allTeasers[0] !== element) return;

  const teasers = allTeasers.length ? allTeasers : [element];

  const cells = [];
  teasers.forEach((teaser) => {
    const row = buildCardRow(teaser, document);
    if (row) cells.push(row);
  });

  // Empty-block guard: nothing extractable — unwrap rather than emit an empty block.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-teaser', cells });
  element.replaceWith(block);

  // Remove the other secure teasers now folded into this block so their raw
  // content is not duplicated in the output; their parse calls will then no-op.
  teasers.forEach((teaser) => {
    if (teaser !== element && teaser.isConnected) teaser.remove();
  });
}
