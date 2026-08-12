import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Dynamic article cards. Reads a query-index JSON feed path from the block
 * content, fetches it, and renders one card per entry — the EDS equivalent of
 * AEM's List component (add an entry to the index → a card appears here).
 *
 * Authoring: a single cell containing the feed path, e.g.
 *   | cards-dynamic            |
 *   | /content/wknd-articles.json |
 *
 * Each feed entry uses: { title, path, image, description }.
 */

const DEFAULT_FEED = '/content/wknd-articles.json';

/**
 * Resolve the feed path from the block content (link href or plain text),
 * falling back to the default feed.
 * @param {Element} block
 * @returns {string} feed URL path
 */
function readFeedPath(block) {
  const link = block.querySelector('a');
  if (link) return link.getAttribute('href');
  const text = block.textContent.trim();
  if (text && text.endsWith('.json')) return text;
  return DEFAULT_FEED;
}

/**
 * Fetch the feed. Try the authored path first; if that 404s and the path is
 * root-relative, retry under /content (aem up serves local JSON there).
 * @param {string} path
 * @returns {Promise<Array>} the data array
 */
async function fetchFeed(path) {
  const candidates = [path];
  if (path.startsWith('/') && !path.startsWith('/content/')) {
    candidates.push(`/content${path}`);
  }
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const resp = await fetch(candidates[i]);
      if (resp.ok) {
        // eslint-disable-next-line no-await-in-loop
        const json = await resp.json();
        return Array.isArray(json) ? json : (json.data || []);
      }
    } catch (e) {
      // try next candidate
    }
  }
  return [];
}

/**
 * Build a single card <li> matching the cards-article structure so the
 * cards-article styling applies unchanged.
 * @param {Object} entry feed entry
 * @returns {Element} li
 */
function buildCard(entry) {
  const li = document.createElement('li');

  const imageDiv = document.createElement('div');
  imageDiv.className = 'cards-dynamic-card-image';
  const link = document.createElement('a');
  link.href = entry.path;
  if (entry.image) {
    const picture = createOptimizedPicture(entry.image, entry.title || '', false, [{ width: '750' }]);
    link.append(picture);
  }
  imageDiv.append(link);

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'cards-dynamic-card-body';
  const titleLink = document.createElement('a');
  titleLink.href = entry.path;
  titleLink.className = 'cards-dynamic-card-title';
  titleLink.textContent = entry.title || '';
  bodyDiv.append(titleLink);
  if (entry.description) {
    const desc = document.createElement('div');
    desc.className = 'cards-dynamic-card-description';
    desc.textContent = entry.description;
    desc.title = entry.description;
    bodyDiv.append(desc);
  }

  li.append(imageDiv, bodyDiv);
  return li;
}

/**
 * loads and decorates the dynamic cards block
 * @param {Element} block
 */
export default async function decorate(block) {
  const feedPath = readFeedPath(block);
  const entries = await fetchFeed(feedPath);

  const ul = document.createElement('ul');
  entries.forEach((entry) => ul.append(buildCard(entry)));

  block.replaceChildren(ul);
}
