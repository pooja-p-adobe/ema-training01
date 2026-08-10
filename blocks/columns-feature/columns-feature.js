/**
 * columns-feature — WKND "Featured Article" teaser.
 * Content model (2 cells): [ image ] [ pretitle · title · description · CTA ].
 * Tags cells/elements with semantic classes and buttonizes the CTA link
 * (this project's global decorateButtons only styles strong/em links, so the
 * plain teaser link is promoted to a button here).
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-feature-${cols.length}-cols`);

  block.querySelectorAll(':scope > div > div').forEach((col) => {
    const pic = col.querySelector('picture');
    if (pic && col.children.length === 1) {
      // picture-only column = image column
      col.classList.add('columns-feature-img-col');
      return;
    }

    // otherwise this is the text/content column
    col.classList.add('columns-feature-content');

    const paras = [...col.querySelectorAll(':scope > p')];
    paras.forEach((p) => {
      const link = p.querySelector('a');
      const isButton = link && p.textContent.trim() === link.textContent.trim();

      if (isButton) {
        // CTA — promote to the global yellow button
        p.classList.add('button-wrapper');
        link.classList.add('button');
      } else if (!col.querySelector('.columns-feature-pretitle')) {
        // first non-button paragraph = pretitle ("Featured Article")
        p.classList.add('columns-feature-pretitle');
      } else {
        p.classList.add('columns-feature-description');
      }
    });
  });
}
