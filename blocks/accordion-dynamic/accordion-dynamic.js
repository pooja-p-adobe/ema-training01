/*
 * accordion-dynamic — query-index-driven FAQ accordion.
 *
 * The EDS equivalent of an AEM List/accordion fed from a content source: reads
 * a query-index JSON feed and renders one collapsible <details>/<summary> item
 * per entry (question -> summary, answer -> panel). Add an entry to the feed
 * (or the embedded fallback) and a new FAQ appears — no content edit needed.
 *
 * Authoring: a single cell with the feed path, e.g.
 *   | accordion-dynamic        |
 *   | /wknd-faqs.json          |
 *
 * Each feed entry uses: { question, answer }.
 */

const DEFAULT_FEED = '/wknd-faqs.json';

/**
 * Embedded fallback dataset. Edge Delivery only serves JSON that comes from a
 * query-index or authored spreadsheet — an uploaded raw .json blob 404s on the
 * hosted environment. This built-in list guarantees the accordion always
 * renders; when a real query-index feed is published, the fetch below wins and
 * this is ignored. Add/remove an entry here (or in the feed) -> items update.
 */
const FALLBACK_FAQS = [
  {
    question: "Who is WKND's intended audience?",
    answer: 'We believe the best adventures and activities are those that are accessible to everyone. WKND is designed to be inclusive of all age ranges, abilities, and budget-levels. We strive to cater to the thrill-seeking adrenaline junkie BASE-jumpers as well as novices that have a spare weekend and interest in trying something new.',
  },
  {
    question: 'How does WKND pay for itself?',
    answer: 'WKND charges a small fee for local promoters that want to sponsor their adventures and events on the WKND site. Sponsored Adventures may get sorted to more prominent positions in our Adventures listings pages.',
  },
  {
    question: 'Can I contribute to WKND?',
    answer: 'Yes! If you have the expertise and experiences to share, we’ll provide the platform to spread it. As a Guest Writer, you will play an integral role in helping people find fun and cool things to do in your community.',
  },
  {
    question: 'How often is WKDN updated?',
    answer: 'WKND is updated daily to provide you with the latest in-depth articles on fun activities that we’ve recently exploring and new adventures that are available for you to discover. Come back often to see the latest or subscribe to our social feeds.',
  },
  {
    question: 'When was WKND founded?',
    answer: 'WKND was created in 2015 when our founders, Daniel and Kilian, realized that their friends and family were constantly using them as resources to find fun things to do while they were in Los Angeles. They loved sharing ideas about fun events and activities they knew of, but wanted to be able to do it at larger scale across communities. They decided to start WKND as a way to share their insights and experiences with as many people as possible.',
  },
  {
    question: 'Is a hot dog a sandwich?',
    answer: 'While it may be described as meat between two pieces of bread, a hot dog is just a sandwich in the same way Michael Jordan was just a basketball player or William Shakespeare was just a playwright. Technically true, but vastly understated.',
  },
  {
    question: 'Is WKND a real company?',
    answer: 'No. The WKND is a fictional online magazine and adventure company that focuses on outdoor activities and trips across the globe. The WKND site is designed to demonstrate functionality for Adobe Experience Manager. There is also a corresponding tutorial that walks a developer through the development. Special thanks to Lorenzo Buosi and Kilian Amendola who created the beautiful design for the WKND site.',
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
 * Fetch the feed, trying several path forms (authored, /content for local dev).
 * Returns the embedded fallback if none resolve — so the accordion always
 * renders, on localhost and on the hosted environment alike.
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
  return FALLBACK_FAQS;
}

/**
 * Build one collapsible accordion item from a FAQ entry.
 * @param {Object} entry { question, answer }
 * @returns {Element} details
 */
function buildItem(entry) {
  const details = document.createElement('details');
  details.className = 'accordion-dynamic-item';

  const summary = document.createElement('summary');
  summary.className = 'accordion-dynamic-item-label';
  summary.textContent = entry.question || '';

  const body = document.createElement('div');
  body.className = 'accordion-dynamic-item-body';
  const p = document.createElement('p');
  p.textContent = entry.answer || '';
  body.append(p);

  details.append(summary, body);
  return details;
}

/**
 * loads and decorates the dynamic FAQ accordion
 * @param {Element} block
 */
export default async function decorate(block) {
  const feedPath = readFeedPath(block);
  const entries = await fetchFeed(feedPath);

  const wrapper = document.createElement('div');
  wrapper.className = 'accordion-dynamic-list';
  entries.forEach((entry) => wrapper.append(buildItem(entry)));

  block.replaceChildren(wrapper);
}
