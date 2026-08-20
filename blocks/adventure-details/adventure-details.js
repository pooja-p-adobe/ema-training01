/**
 * adventure-details — key/value spec list for WKND adventure detail pages.
 *
 * Content model (one row per spec, 2 cells):
 *   [ Label ] [ Value ]
 * e.g.
 *   | Activity       | Surfing        |
 *   | Adventure Type | Overnight Trip |
 *   | Trip Length    | 6 Days         |
 *   | Group Size     | 6              |
 *   | Difficulty     | Beginner       |
 *   | Price          | 5000.0         |
 *
 * Renders a definition list (<dl>) where each spec is a small uppercase label
 * with its value below, separated by a left accent rule. Rows with an empty
 * label or value are skipped gracefully.
 *
 * Self-contained: no external plugin deps (no fetchPlaceholders /
 * moveInstrumentation), no imports required.
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const dl = document.createElement('dl');
  dl.className = 'adventure-details-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;

    const label = (cells[0].textContent || '').trim();
    const valueCell = cells[1];
    const value = (valueCell.textContent || '').trim();
    if (!label && !value) return;

    const item = document.createElement('div');
    item.className = 'adventure-details-item';

    const dt = document.createElement('dt');
    dt.className = 'adventure-details-label';
    dt.textContent = label;

    const dd = document.createElement('dd');
    dd.className = 'adventure-details-value';
    // preserve any rich value markup (links, emphasis) if present
    if (valueCell.children.length) {
      dd.append(...valueCell.childNodes);
    } else {
      dd.textContent = value;
    }

    item.append(dt, dd);
    dl.append(item);
  });

  block.replaceChildren(dl);
}
