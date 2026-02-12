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

    // Check if product is in pre-order state - try multiple selectors
    const productForm = button.closest('product-form') ||
                       button.closest('form.product__form') ||
                       button.closest('form[data-is-preorder]') ||
                       document.querySelector('product-form[data-is-preorder]');
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

              // Also set up attribute observers for any new forms
              node.querySelectorAll('product-form, form.product__form').forEach(observeFormAttributes);
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
   * Observe a single form for data-is-preorder attribute changes
   */
  const observedForms = new WeakSet();
  function observeFormAttributes(form) {
    // Skip if already observing this form
    if (observedForms.has(form)) return;

    const attrObserver = new MutationObserver(() => {
      // Force re-translation of all payment buttons
      document.querySelectorAll(BUTTON_SELECTOR).forEach(button => {
        translateButton(button, true);
      });
    });

    attrObserver.observe(form, {
      attributes: true,
      attributeFilter: ['data-is-preorder']
    });

    observedForms.add(form);
  }

  /**
   * Setup attribute observer to re-translate when data-is-preorder changes
   */
  function setupAttributeObserver() {
    // Watch both <product-form> and regular <form> elements
    const forms = document.querySelectorAll('product-form, form[data-is-preorder], form.product__form');
    forms.forEach(observeFormAttributes);
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
