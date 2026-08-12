/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsFeatureParser from './parsers/columns-feature.js';
import cardsArticleParser from './parsers/cards-article.js';
import cardsTeaserParser from './parsers/cards-teaser.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-feature': columnsFeatureParser,
  'cards-article': cardsArticleParser,
  'cards-teaser': cardsTeaserParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'wknd-magazine',
  description: 'WKND Magazine article-listing page.',
  urls: [
    'https://wknd.site/us/en/magazine.html',
  ],
  blocks: [
    {
      name: 'columns-feature',
      instances: ['.teaser.cmp-teaser--featured'],
    },
    {
      name: 'cards-article',
      instances: ['.image-list.list'],
    },
    {
      name: 'cards-teaser',
      instances: ['.teaser.cmp-teaser--secure'],
    },
  ],
  sections: [
    {
      id: 'mag-section-1',
      name: 'Magazine Title',
      selector: 'main.cmp-layout-container--fixed div.title:not(.cmp-title--underline)',
      style: null,
      blocks: [],
      defaultContent: ['div.title'],
    },
    {
      id: 'mag-section-2',
      name: 'Featured Article',
      selector: '.teaser.cmp-teaser--featured',
      style: null,
      blocks: ['columns-feature'],
      defaultContent: [],
    },
    {
      id: 'mag-section-3',
      name: 'All Articles',
      selector: '.image-list.list',
      style: null,
      blocks: ['cards-article'],
      defaultContent: ['div.title.cmp-title--underline'],
    },
    {
      id: 'mag-section-4',
      name: 'Members Only',
      selector: '.teaser.cmp-teaser--secure',
      style: null,
      blocks: ['cards-teaser'],
      defaultContent: ['div.title.cmp-title--underline', 'div.text'],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, section breaks after (afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. parse each block (skip already-replaced elements)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. sanitized path (map root to /index defensively)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
