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
  const processedButtons = new WeakSet();

  /**
   * Translates a single payment button
   * @param {HTMLElement} button - The button element to translate
   */
  function translateButton(button) {
    // Skip if already processed (WeakSet prevents memory leaks)
    if (processedButtons.has(button)) return;

    // Validate it's a payment button
    if (!button.matches(BUTTON_SELECTOR)) return;

    // Apply translation
    button.textContent = translatedText;
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
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWithRetry);
  } else {
    initWithRetry();
  }
})();
