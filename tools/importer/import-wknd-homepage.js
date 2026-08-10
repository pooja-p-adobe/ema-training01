/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import cardsArticleParser from './parsers/cards-article.js';
import heroOverlayParser from './parsers/hero-overlay.js';
import cardsGalleryParser from './parsers/cards-gallery.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  'columns-feature': columnsFeatureParser,
  'cards-article': cardsArticleParser,
  'hero-overlay': heroOverlayParser,
  'cards-gallery': cardsGalleryParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'wknd-homepage',
  description: 'WKND homepage (AEM Core Components / WKND reference site).',
  urls: [
    'https://wknd.site/us/en.html',
  ],
  blocks: [
    {
      name: 'carousel-hero',
      instances: ['.carousel.cmp-carousel--hero'],
    },
    {
      name: 'columns-feature',
      instances: ['.teaser.cmp-teaser--featured'],
    },
    {
      name: 'cards-article',
      instances: ['main.cmp-layout-container--fixed:nth-of-type(1) div.image-list.list'],
    },
    {
      name: 'hero-overlay',
      instances: ['.teaser.cmp-teaser--hero.cmp-teaser--imagebottom'],
    },
    {
      name: 'cards-gallery',
      instances: ['main.cmp-layout-container--fixed:nth-of-type(2) div.image-list.list'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Hero Carousel',
      selector: '.carousel.cmp-carousel--hero',
      style: null,
      blocks: ['carousel-hero'],
      defaultContent: [],
    },
    {
      id: 'section-2',
      name: 'Featured Article',
      selector: '.teaser.cmp-teaser--featured',
      style: null,
      blocks: ['columns-feature'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Recent Articles',
      selector: 'main.cmp-layout-container--fixed:nth-of-type(1) div.image-list.list',
      style: null,
      blocks: ['cards-article'],
      defaultContent: ['div.title.cmp-title--underline', 'div.button.cmp-button--primary'],
    },
    {
      id: 'section-4',
      name: 'Next Adventures Banner',
      selector: '.teaser.cmp-teaser--hero.cmp-teaser--imagebottom',
      style: null,
      blocks: ['hero-overlay'],
      defaultContent: ['div.title.cmp-title--underline'],
    },
    {
      id: 'section-5',
      name: 'Adventures Gallery',
      selector: 'main.cmp-layout-container--fixed:nth-of-type(2) div.image-list.list',
      style: null,
      blocks: ['cards-gallery'],
      defaultContent: ['div.title', 'div.button.cmp-button--primary'],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first, section breaks run after (in afterTransform)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - The hook name ('beforeTransform' or 'afterTransform')
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - The payload containing { document, url, html, params }
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
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
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

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
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

    // 4. Execute afterTransform transformers (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (map root/homepage to /index to avoid empty-path crash)
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
