/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section boundaries.
 *
 * Adds EDS section breaks (<hr>) and Section Metadata blocks derived from
 * payload.template.sections. Runs in afterTransform only (section transformers
 * never run in beforeTransform).
 *
 * Template wknd-homepage has 5 sections (all style: null), so this inserts
 * 4 section breaks (sections.length - 1) and 0 Section Metadata blocks.
 *
 * Section start resolution
 * ------------------------
 * A section's true start is the earliest element (document order) among its
 * `selector` and its `defaultContent` selectors. This matters because sections
 * 3/4/5 begin with default-content headings that precede their block, and the
 * defaultContent selectors are shared/ambiguous across sections:
 *   - `div.title.cmp-title--underline` matches BOTH "Recent Articles" (s3) and
 *     "Next Adventures" (s4)
 *   - `div.title` (s5) matches every `.title` including the underlined ones and
 *     the footer "Follow Us"
 *   - `div.button.cmp-button--primary` matches BOTH "All Articles" (s3) and
 *     "All Trips" (s5)
 * To assign the correct element to each section we walk sections in order and,
 * per section, pick the earliest candidate that (a) is not already claimed by a
 * previous section and (b) comes at/after the previous section's start. This
 * yields, for wknd-homepage (validated against migration-work/cleaned.html):
 *   s1 carousel.cmp-carousel--hero (first section, no <hr>)
 *   s2 teaser.cmp-teaser--featured
 *   s3 title.cmp-title--underline ("Recent Articles")
 *   s4 title.cmp-title--underline ("Next Adventures")
 *   s5 title ("Where do you want to go?")
 *
 * Selectors depend only on semantic cmp-* classes, so this works whether or not
 * the cleanup transformer (which strips aem-Grid* classes and site chrome) has
 * already run.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// True when element `a` appears after element `b` in document order.
function isAfter(a, b) {
  // eslint-disable-next-line no-bitwise
  return !!(b.compareDocumentPosition(a) & 4 /* Node.DOCUMENT_POSITION_FOLLOWING */);
}

// Resolve, per section, the earliest not-yet-claimed element (document order)
// among the section's selector + defaultContent selectors.
function resolveSectionAnchors(root, sections) {
  const anchors = [];
  const claimed = new Set();
  let lastStart = null;

  sections.forEach((section, idx) => {
    const selectors = [];
    if (section.selector) selectors.push(section.selector);
    (section.defaultContent || []).forEach((sel) => selectors.push(sel));

    let candidates = [];
    selectors.forEach((sel) => {
      try {
        root.querySelectorAll(sel).forEach((el) => candidates.push(el));
      } catch (e) {
        // Ignore selectors that are not valid in querySelectorAll context.
      }
    });

    candidates = candidates.filter((el) => !claimed.has(el));
    if (lastStart) {
      candidates = candidates.filter((el) => isAfter(el, lastStart));
    }

    let anchor = null;
    candidates.forEach((el) => {
      if (!anchor || isAfter(anchor, el)) anchor = el;
    });

    anchors[idx] = anchor;
    if (anchor) {
      claimed.add(anchor);
      lastStart = anchor;
    }
  });

  return anchors;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const sections = payload && payload.template && payload.template.sections;
  if (!sections || !Array.isArray(sections) || sections.length < 2) return;

  const doc = element.ownerDocument;
  const anchors = resolveSectionAnchors(element, sections);

  // Process in reverse so insertions never shift not-yet-processed anchors.
  for (let idx = sections.length - 1; idx >= 0; idx -= 1) {
    const section = sections[idx];
    const anchor = anchors[idx];
    if (!anchor) continue;

    // Section Metadata block for sections that declare a style (none on
    // wknd-homepage — every section.style is null — so this is a no-op here,
    // but kept general so the transformer is reusable for styled sections).
    if (section.style) {
      const block = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.parentElement.insertBefore(block, anchor.nextSibling);
    }

    // Section break before every non-first section (there is always preceding
    // content, so the "content before it" condition holds).
    if (idx > 0) {
      const hr = doc.createElement('hr');
      anchor.parentElement.insertBefore(hr, anchor);
    }
  }
}
