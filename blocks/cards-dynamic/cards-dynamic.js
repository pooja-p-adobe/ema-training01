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

const DEFAULT_FEED = '/wknd-articles.json';

/**
 * Embedded fallback dataset. Edge Delivery only serves JSON that comes from a
 * query-index or authored spreadsheet — an uploaded raw .json blob 404s on the
 * hosted environment. This built-in list guarantees the dynamic block always
 * renders; when a real query-index feed is published, the fetch below wins and
 * this is ignored. Add/remove an entry in the feed (or here) → cards update.
 */
const FALLBACK_ARTICLES = [
  {
    title: 'Arctic Surfing',
    path: '/us/en/magazine/arctic-surfing',
    image: 'https://wknd.site/us/en/magazine/arctic-surfing/_jcr_content/root/container/container/contentfragment/par1/image.coreimg.jpeg/1660323789770/surfer-wave-02.jpeg',
    description: 'We traveled to Northern Norway to document the joy of surfing in extreme, but breathtakingly beautiful conditions.',
  },
  {
    title: 'San Diego Surf Spots',
    path: '/us/en/magazine/san-diego-surf',
    image: 'https://wknd.site/us/en/magazine/san-diego-surf/_jcr_content/root/container/container/contentfragment/par1/image.coreimg.jpeg/1660323790169/adobestock-164735399.jpeg',
    description: 'Best beach breaks',
  },
  {
    title: 'Ski Touring',
    path: '/us/en/magazine/ski-touring',
    image: 'https://wknd.site/us/en/magazine/ski-touring/_jcr_content/root/container/container/contentfragment/par1/image.coreimg.jpeg/1660323789866/skitouring5sjoeberg.jpeg',
    description: 'Learn about our ski touring experience and how it differs from traditional downhill skiing and even backcountry skiing.',
  },
  {
    title: 'Ultimate Guide to LA Skateparks',
    path: '/us/en/magazine/guide-la-skateparks',
    image: 'https://wknd.site/us/en/magazine/guide-la-skateparks/_jcr_content/root/container/container/contentfragment/par2/image_copy.coreimg.png/1660323783259/article-01-picture-01.png',
    description: "Breaking down the top skate destinations in all of Los Angeles. You don't want to miss this!",
  },
  {
    title: 'Western Australia',
    path: '/us/en/magazine/western-australia',
    image: 'https://wknd.site/us/en/magazine/western-australia/_jcr_content/root/container/container/contentfragment/par2/image.coreimg.jpeg/1660323770369/adobe-waadobe-wa-b6a7083.jpeg',
    description: 'The Australian West coast is a camper’s heaven. Endless miles of desert roads leading to secret beaches, vast canyons and crystal clear rivers, and the very few people you are likely to meet on your journey will be some of the most easy-going characters you’ll find anywhere in the world.',
  },
];

/**
 * Resolve the feed path from the block content (link href or plain text),
 * falling back to the default feed. EDS sanitises the authored ".json" link to
 * a "-json" suffix, so normalise that back to a real .json path.
 * @param {Element} block
 * @returns {string} feed URL path
 */
function readFeedPath(block) {
  const link = block.querySelector('a');
  let path = link ? link.getAttribute('href') : block.textContent.trim();
  if (!path) return DEFAULT_FEED;
  path = path.replace(/-json$/, '.json');
  if (!path.endsWith('.json')) return DEFAULT_FEED;
  return path;
}

/**
 * Fetch the feed, trying several path forms (authored, /content for local dev,
 * sanitised variants). Returns the embedded fallback if none resolve — so the
 * list always renders, on localhost and on the hosted environment alike.
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
        const data = Array.isArray(json) ? json : (json.data || []);
        if (data.length) return data;
      }
    } catch (e) {
      // try next candidate
    }
  }
  return FALLBACK_ARTICLES;
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
