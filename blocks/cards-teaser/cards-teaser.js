import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards-teaser — WKND "Members Only" locked/secure teasers.
 * Content model (2 cells per row): [ image ] [ title · description · CTA ].
 * Renders as distinct teaser cards laid out side-by-side. The image is placed
 * BELOW the text content (via CSS ordering) to match the WKND secure-teaser
 * layout. The CTA ("Read More") is styled as a link-like affordance; when the
 * teaser is locked the source provides plain text (no href), so we render it as
 * a static label rather than promoting it to a button.
 *
 * Project-compatible: imports only createOptimizedPicture from aem.js. This
 * project's boilerplate does NOT export moveInstrumentation/fetchPlaceholders,
 * so those are intentionally not used.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-teaser-card-image';
      } else {
        div.className = 'cards-teaser-card-body';
      }
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img
    .closest('picture')
    .replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  /* tag title, description and CTA inside each card body */
  ul.querySelectorAll('.cards-teaser-card-body').forEach((body) => {
    const heading = body.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) heading.classList.add('cards-teaser-card-title');

    // The last paragraph/link that reads like a call-to-action ("Read More").
    const paras = [...body.querySelectorAll(':scope > p')];
    const last = paras[paras.length - 1];
    if (last) {
      const link = last.querySelector('a');
      const isCta = last.textContent.trim().length > 0
        && (link ? last.textContent.trim() === link.textContent.trim() : paras.length > 1);
      if (isCta) {
        last.classList.add('cards-teaser-card-cta');
        if (link) link.classList.add('cards-teaser-card-cta-link');
      }
    }

    // Remaining non-title, non-CTA paragraphs are the description.
    body.querySelectorAll(':scope > p').forEach((p) => {
      if (!p.classList.contains('cards-teaser-card-cta')) {
        p.classList.add('cards-teaser-card-description');
      }
    });
  });

  block.replaceChildren(ul);
}
