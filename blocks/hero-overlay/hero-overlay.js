/**
 * hero-overlay — full-bleed image with an overlaid white content box.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // Buttonize the CTA link (the WKND source renders it as a yellow button).
  // The global decorateButtons only styles links with authored <strong>/<em>
  // formatting, which this authored link lacks, so promote it here.
  const cta = block.querySelector(':scope > div:last-child a[href]');
  if (cta && !cta.classList.contains('button')) {
    const p = cta.closest('p');
    if (p && p.textContent.trim() === cta.textContent.trim()) {
      cta.classList.add('button');
      p.classList.add('button-wrapper');
    }
  }
}
