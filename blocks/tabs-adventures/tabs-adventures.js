import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

/**
 * tabs-adventures — WKND "Current Adventures" tabbed card filter.
 *
 * Content model (one row per adventure card, 3 cells):
 *   [ Category ] [ Image ] [ Title link + description ]
 *
 * The author writes each adventure once and tags it with a single category
 * (Climbing, Cycling, Skiing, Surfing, Travel, ...). The block derives the
 * tab bar automatically: an "All" tab (shows every card) followed by one tab
 * per unique category in first-appearance order. Selecting a tab filters
 * which cards are visible — there is no duplicate authoring for the "All" set.
 *
 * Self-contained: no external plugin deps (no moveInstrumentation /
 * fetchPlaceholders). Keyboard accessible via the WAI-ARIA tabs pattern
 * (roving tabindex, Arrow/Home/End, Enter/Space).
 *
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const ALL_LABEL = 'All';
  const ALL_KEY = 'all';

  // 1. Parse authored rows into card descriptors.
  const orderedCategories = [];
  const cards = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    // Identify cells by content, gracefully (independent of exact column order):
    // image cell = has a picture/img; body cell = has a link; category = text-only.
    const imageCell = cells.find((c) => c.querySelector('picture, img'));
    const bodyCell = cells.find((c) => c.querySelector('a')) || cells.find((c) => c !== imageCell);
    const categoryCell = cells.find((c) => c !== imageCell && c !== bodyCell);

    const label = (categoryCell?.textContent || '').trim();
    const key = label ? toClassName(label) : ALL_KEY;
    if (label && !orderedCategories.some((c) => c.key === key)) {
      orderedCategories.push({ key, label });
    }

    cards.push({ key, imageCell, bodyCell });
  });

  if (!cards.length) return;

  // 2. Build the card grid (<ul>), tagging each <li> with its category key.
  const list = document.createElement('ul');
  list.className = 'tabs-adventures-cards';

  cards.forEach(({ key, imageCell, bodyCell }) => {
    const li = document.createElement('li');
    li.className = 'tabs-adventures-card';
    li.dataset.category = key;

    // image
    if (imageCell) {
      const img = imageCell.querySelector('img');
      const imageWrap = document.createElement('div');
      imageWrap.className = 'tabs-adventures-card-image';
      if (img) {
        const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
        // keep the card image linked if the author wrapped it in an anchor
        const imgLink = imageCell.querySelector('a[href]');
        if (imgLink) {
          const a = document.createElement('a');
          a.href = imgLink.getAttribute('href');
          a.append(picture);
          imageWrap.append(a);
        } else {
          imageWrap.append(picture);
        }
      }
      li.append(imageWrap);
    }

    // body: first link = title, remaining text = description
    const body = document.createElement('div');
    body.className = 'tabs-adventures-card-body';
    const titleLink = bodyCell?.querySelector('a');
    if (titleLink) {
      // description = everything in the body cell that is not the title link
      const clone = bodyCell.cloneNode(true);
      const clonedLink = clone.querySelector('a');
      if (clonedLink) clonedLink.remove();
      const description = clone.textContent.trim();

      titleLink.className = 'tabs-adventures-card-title';
      body.append(titleLink);

      if (description) {
        const desc = document.createElement('div');
        desc.className = 'tabs-adventures-card-description';
        desc.textContent = description;
        desc.title = description;
        body.append(desc);
      }
    } else if (bodyCell) {
      // no link — keep whatever text exists as the title
      const title = document.createElement('span');
      title.className = 'tabs-adventures-card-title';
      title.textContent = bodyCell.textContent.trim();
      body.append(title);
    }
    li.append(body);

    list.append(li);
  });

  // 3. Build the tab bar: "All" first, then each category alphabetically
  // (matches the WKND source tab order).
  const sortedCategories = [...orderedCategories]
    .sort((a, b) => a.label.localeCompare(b.label));
  const tabs = [{ key: ALL_KEY, label: ALL_LABEL }, ...sortedCategories];

  const tablist = document.createElement('div');
  tablist.className = 'tabs-adventures-list';
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Filter adventures by category');

  const panelId = `tabs-adventures-panel-${Math.random().toString(36).slice(2, 8)}`;
  const buttons = [];

  const panel = document.createElement('div');
  panel.className = 'tabs-adventures-panel';
  panel.id = panelId;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('tabindex', '0');
  panel.append(list);

  const applyFilter = (key) => {
    list.querySelectorAll('.tabs-adventures-card').forEach((card) => {
      const show = key === ALL_KEY || card.dataset.category === key;
      card.hidden = !show;
      card.classList.toggle('tabs-adventures-card-hidden', !show);
    });
  };

  const selectTab = (index, { focus = false } = {}) => {
    buttons.forEach((btn, i) => {
      const selected = i === index;
      btn.setAttribute('aria-selected', String(selected));
      btn.tabIndex = selected ? 0 : -1;
      if (selected && focus) btn.focus();
    });
    const active = tabs[index];
    panel.setAttribute('aria-labelledby', buttons[index].id);
    applyFilter(active.key);
  };

  tabs.forEach((tab, i) => {
    const button = document.createElement('button');
    button.className = 'tabs-adventures-tab';
    button.id = `tab-${tab.key}-${Math.random().toString(36).slice(2, 6)}`;
    button.type = 'button';
    button.textContent = tab.label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', panelId);
    button.setAttribute('aria-selected', String(i === 0));
    button.tabIndex = i === 0 ? 0 : -1;

    button.addEventListener('click', () => selectTab(i));
    button.addEventListener('keydown', (e) => {
      const last = buttons.length - 1;
      let target = null;
      if (e.key === 'ArrowRight') target = i === last ? 0 : i + 1;
      else if (e.key === 'ArrowLeft') target = i === 0 ? last : i - 1;
      else if (e.key === 'Home') target = 0;
      else if (e.key === 'End') target = last;
      if (target !== null) {
        e.preventDefault();
        selectTab(target, { focus: true });
      }
    });

    buttons.push(button);
    tablist.append(button);
  });

  // 4. Render: tablist + single filtered panel.
  block.replaceChildren(tablist, panel);
  selectTab(0);
}
