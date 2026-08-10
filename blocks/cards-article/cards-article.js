import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-article-card-image';
      else div.className = 'cards-article-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  /* split card body into a title link and a description (source: image-list) */
  ul.querySelectorAll('.cards-article-card-body').forEach((body) => {
    const link = body.querySelector('a');
    if (!link) return;
    // description = all text/nodes that follow the title link
    let description = '';
    let node = link.nextSibling;
    while (node) {
      description += node.textContent;
      node = node.nextSibling;
    }
    description = description.trim();

    link.classList.add('cards-article-card-title');
    body.replaceChildren(link);
    if (description) {
      const desc = document.createElement('div');
      desc.className = 'cards-article-card-description';
      desc.textContent = description;
      desc.title = description;
      body.append(desc);
    }
  });

  block.replaceChildren(ul);
}
