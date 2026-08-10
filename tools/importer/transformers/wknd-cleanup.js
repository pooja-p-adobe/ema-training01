/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 *
 * Removes non-authorable site chrome and layout noise so the import contains
 * only page-level authorable content. Every selector below was validated
 * against migration-work/cleaned.html for https://wknd.site/us/en.html.
 *
 * Non-authorable content removed (afterTransform):
 *  - Header experience fragment  : <header class="experiencefragment cmp-experiencefragment--header"> (cleaned.html line 5)
 *  - Footer experience fragment  : <footer class="experiencefragment cmp-experiencefragment--footer"> (cleaned.html line 471)
 *  - Adobe demdex tracking iframe: <iframe id="destination_publishing_iframe_wkndsite_0"> (cleaned.html line 566)
 *  - Mobile nav toggle/drawer    : #toggleNav (line 568), #mobileNav (line 574)
 *  - Decorative AEM separators   : .separator (lines 351, 460, 542) each wrap a cmp-separator__horizontal-rule <hr>
 *  - Stray empty <meta> tags     : emitted inside cmp-image wrappers (lines 183, 204, 227, 271, 334, 378)
 *
 * Grid wrapper noise: aem-Grid* / aem-GridColumn* utility classes are stripped
 * from every element (they are AEM responsive-grid layout artifacts, never
 * authorable). Block parser selectors (.carousel.cmp-carousel--hero,
 * .teaser.cmp-teaser--featured, .image-list.list, main.cmp-layout-container--fixed,
 * .teaser.cmp-teaser--hero.cmp-teaser--imagebottom) and section selectors do
 * not depend on any aem-Grid* class, so stripping them is non-destructive.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome and layout noise (selectors from cleaned.html).
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header', // header experience fragment (site chrome)
      'footer.cmp-experiencefragment--footer', // footer experience fragment (site chrome)
      '.separator', // decorative AEM separators wrapping cmp-separator__horizontal-rule <hr>
      'iframe', // Adobe demdex ID-syncing tracking iframe
      '#toggleNav', // mobile nav toggle button
      '#mobileNav', // mobile nav drawer
      'meta', // stray empty <meta> emitted inside cmp-image wrappers
    ]);

    // Strip AEM responsive-grid utility classes (grid wrapper noise). Removes
    // aem-Grid, aem-Grid--*, aem-GridColumn, aem-GridColumn--* while preserving
    // every semantic cmp-* class the parsers and section transformer rely on.
    element.querySelectorAll('[class]').forEach((el) => {
      const kept = Array.from(el.classList).filter((c) => !c.startsWith('aem-Grid'));
      if (kept.length !== el.classList.length) {
        if (kept.length === 0) {
          el.removeAttribute('class');
        } else {
          el.setAttribute('class', kept.join(' '));
        }
      }
    });
  }
}
