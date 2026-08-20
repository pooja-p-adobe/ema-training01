/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-content.
 * Base: tabs (Block Collection tabs pattern).
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 * Selector: .tabs.panelcontainer
 *
 * Content model (2 columns, one row per tab): [ Tab Label ] [ Panel content ]
 * First row is the block name. Each subsequent row is a single tab: the label
 * in cell 1, the panel's rich content (paragraphs, images, headings, lists) in
 * cell 2.
 *
 * Source is an AEM Core Components tabs container: a <ol.cmp-tabs__tablist>
 * with <li> tab labels, followed by sibling <div.cmp-tabs__tabpanel> elements
 * (one per tab, in the same order). Panel bodies live under
 * .cmp-contentfragment__elements inside each panel.
 */
export default function parse(element, { document }) {
  const root = element.querySelector('.cmp-tabs') || element;

  // Tab labels, in order.
  const tabLabels = Array.from(root.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tablist > li'))
    .map((li) => (li.textContent || '').trim());

  // Tab panels, in order (matches label order in Core Components markup).
  const panels = Array.from(root.querySelectorAll(':scope > .cmp-tabs__tabpanel'));

  const cells = [];
  panels.forEach((panel, i) => {
    const label = tabLabels[i] || `Tab ${i + 1}`;

    // Prefer the content-fragment body; fall back to the panel itself.
    const body = panel.querySelector('.cmp-contentfragment__elements') || panel;

    // Collect meaningful content nodes: headings, paragraphs, images, lists.
    // Skip empty AEM grid scaffolding divs that carry no text/media.
    let contentNodes = Array.from(
      body.querySelectorAll(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > p, :scope > ul, :scope > ol, :scope > img'),
    );

    // Core Components wraps prose in an intermediate <div>; if the direct
    // scan came up empty, pull rich content from within.
    if (!contentNodes.length) {
      contentNodes = Array.from(
        body.querySelectorAll('h1, h2, h3, h4, p, ul, ol, img'),
      ).filter((node) => {
        // keep images always; keep text nodes with actual content
        if (node.tagName === 'IMG') return true;
        return (node.textContent || '').trim().length > 0;
      });
    }

    // Remove nested nodes already contained in an ancestor we kept, to avoid
    // duplicate extraction (e.g. an <img> inside a kept block).
    const contentCell = contentNodes.filter((node, idx) => (
      !contentNodes.some((other, j) => j !== idx && other !== node && other.contains(node))
    ));

    cells.push([label, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: no tabs/panels found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-content', cells });
  element.replaceWith(block);
}
