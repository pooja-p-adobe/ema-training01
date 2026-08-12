import { createOptimizedPicture } from '../../scripts/aem.js';

const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest'];

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-profile-card-image';
      else div.className = 'cards-profile-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  /* structure each card body: name, role subtitle, and a social icon-link row */
  ul.querySelectorAll('.cards-profile-card-body').forEach((body) => {
    const headings = [...body.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    if (headings[0]) headings[0].classList.add('cards-profile-card-name');
    if (headings[1]) headings[1].classList.add('cards-profile-card-role');

    /* collect all links into a single social icon-link row */
    const links = [...body.querySelectorAll('a')];
    if (links.length) {
      const social = document.createElement('div');
      social.className = 'cards-profile-social';
      links.forEach((link) => {
        const label = link.textContent.trim();
        const key = label.toLowerCase();
        link.classList.add('cards-profile-social-link');
        if (SOCIAL_PLATFORMS.includes(key)) link.classList.add(`cards-profile-social-${key}`);
        if (label) {
          link.setAttribute('aria-label', label);
          link.dataset.social = label.charAt(0).toUpperCase();
          link.textContent = '';
        }
        social.append(link);
      });
      body.append(social);
      /* remove wrappers left empty after moving the links out */
      body.querySelectorAll('p').forEach((p) => {
        if (!p.textContent.trim() && !p.querySelector('picture, img, a')) p.remove();
      });
    }
  });

  block.replaceChildren(ul);
}
