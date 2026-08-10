import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) {
        div.className = 'cards-gallery-card-image';
      } else {
        div.className = 'cards-gallery-card-body';
        // The first link is the card title; the remaining text is the description.
        // EDS may wrap both in a <p>, so read the text before restructuring.
        const titleLink = div.querySelector('a');
        if (titleLink) {
          titleLink.classList.add('cards-gallery-card-title');
          const descText = div.textContent.replace(titleLink.textContent, '').trim();
          div.replaceChildren(titleLink);
          if (descText) {
            const p = document.createElement('p');
            p.className = 'cards-gallery-card-description';
            p.textContent = descText;
            div.append(p);
          }
        }
      }
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);
}
