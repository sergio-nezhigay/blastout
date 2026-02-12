/**
 * Payment Button Translation System
 * Translates Shopify dynamic payment buttons across all locales.
 * Uses MutationObserver to handle dynamically injected buttons (quick cart, variant changes).
 */
(function() {
  'use strict';

  // Configuration
  const BUTTON_SELECTOR = '.shopify-payment-button__button--unbranded';
  const DEBOUNCE_DELAY = 100; // milliseconds
  const MAX_RETRIES = 3;

  // Early exit if translations not loaded
  if (!window.paymentButtonStrings?.buttonText) {
    console.warn('[Payment Button Translator] Translation data not available');
    return;
  }

  const translatedText = window.paymentButtonStrings.buttonText;
  const preorderText = window.paymentButtonStrings.preorderButtonText;
  const processedButtons = new WeakSet();

  /**
   * Translates a single payment button
   * @param {HTMLElement} button - The button element to translate
   * @param {boolean} forceUpdate - Force translation even if already processed
   */
  function translateButton(button, forceUpdate = false) {
    // Skip if already processed (unless forced)
    if (!forceUpdate && processedButtons.has(button)) return;

    // Validate it's a payment button
    if (!button.matches(BUTTON_SELECTOR)) return;

    // Check if product is in pre-order state
    const productForm = button.closest('product-form') || document.querySelector('product-form[data-is-preorder]');
    const isPreorder = productForm?.hasAttribute('data-is-preorder');

    // Apply appropriate translation
    button.textContent = isPreorder ? preorderText : translatedText;
    processedButtons.add(button);
  }

  /**
   * Debounced mutation handler to batch rapid DOM changes
   */
  let debounceTimer;
  function handleMutations(mutations) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // Only process element nodes (nodeType 1)
          if (node.nodeType === 1) {
            // Check if the node itself is a payment button
            if (node.matches && node.matches(BUTTON_SELECTOR)) {
              translateButton(node);
            }
            // Check for payment buttons in descendants
            if (node.querySelectorAll) {
              node.querySelectorAll(BUTTON_SELECTOR).forEach(translateButton);
            }
          }
        });
      });
    }, DEBOUNCE_DELAY);
  }

  /**
   * Initialize: translate existing buttons on page
   */
  function init() {
    document.querySelectorAll(BUTTON_SELECTOR).forEach(translateButton);
  }

  /**
   * Setup MutationObserver to watch for dynamically added buttons
   */
  function setupObserver() {
    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Setup attribute observer to re-translate when data-is-preorder changes
   */
  function setupAttributeObserver() {
    const productForm = document.querySelector('product-form');
    if (!productForm) return;

    const attrObserver = new MutationObserver(() => {
      // Force re-translation of all payment buttons
      document.querySelectorAll(BUTTON_SELECTOR).forEach(button => {
        translateButton(button, true);
      });
    });

    attrObserver.observe(productForm, {
      attributes: true,
      attributeFilter: ['data-is-preorder']
    });
  }

  /**
   * Retry mechanism for race conditions
   * (handles cases where script runs before Shopify injects buttons)
   */
  let retryCount = 0;
  function initWithRetry() {
    init();

    const buttonsFound = document.querySelectorAll(BUTTON_SELECTOR).length;
    if (buttonsFound === 0 && retryCount < MAX_RETRIES) {
      retryCount++;
      setTimeout(initWithRetry, 500);
    } else {
      setupObserver();
      setupAttributeObserver();
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWithRetry);
  } else {
    initWithRetry();
  }
})();
