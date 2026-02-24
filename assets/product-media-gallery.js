document.addEventListener(
  "click",
  (e) => {
    const a = e.target.closest("a.product__gallery-toggle");
    if (!a) return;
    e.preventDefault();
  },
  true
);

/**
 * ✅ GLOBAL PHOTOSWIPE INIT (FIXED FOR SINGLE IMAGE)
 * Инициализируется по фактическим ссылкам a.product__gallery-toggle,
 * а не только по .photoswipe-wrapper (которого может не быть при 1 фото).
 */
(function () {
  function initPhotoSwipeOnContainer(container) {
    if (!container) return;
    if (container.dataset.pswpInited === "true") return;

    if (!window.PhotoSwipeLightbox || !window.PhotoSwipe) return;

    // Если в контейнере вообще нет ссылок — не инициализируем
    if (!container.querySelector("a.product__gallery-toggle")) return;

    container.dataset.pswpInited = "true";

    const closeIcon = document.querySelector("[data-close-icon]");
    const prevIcon = document.querySelector("[data-prev-icon]");
    const nextIcon = document.querySelector("[data-next-icon]");

    const isPhone = () => window.innerWidth < 750;

    const lightbox = new window.PhotoSwipeLightbox({
      gallery: container,
      children: "a.product__gallery-toggle",
      mainClass: "pswp--product-media-gallery",
      loop: false,
      showHideAnimationType: "zoom",
      initialZoomLevel: (z) => (isPhone() ? z.vFill : z.fit),
      secondaryZoomLevel: (z) => (isPhone() ? z.fit : 1),
      pswpModule: window.PhotoSwipe,
    });

    lightbox.addFilter("uiElement", (element, data) => {
      if (data.name === "close" && closeIcon) element.innerHTML = closeIcon.innerHTML;
      if (data.name === "arrowPrev" && prevIcon) element.innerHTML = prevIcon.innerHTML;
      if (data.name === "arrowNext" && nextIcon) element.innerHTML = nextIcon.innerHTML;
      return element;
    });

    lightbox.addFilter("itemData", (itemData) => {
      if (itemData.type === "html" && itemData.element) {
        return { html: itemData.element.dataset.pswpHtml };
      }
      return itemData;
    });

    lightbox.init();

    lightbox.on("beforeOpen", () => {
      document.body.classList.add("oveflow-hidden");
      const videos = container.querySelectorAll("video");
      Array.from(videos).forEach((video) => {
        video.play().catch(() => video.pause());
      });
    });

    lightbox.on("closingAnimationStart", () => {
      document.body.classList.remove("oveflow-hidden");
    });
  }

  function getContainerFromAnchor(a) {
    return (
      a.closest(".photoswipe-wrapper") ||
      a.closest("swiper-product-gallery") ||
      a.closest(".main-product__media--slider") ||
      a.closest(".main-product__media--grid-item") ||
      a.closest(".main-product__media") ||
      a.closest(".media") ||
      a.parentElement
    );
  }

  function initAll() {
    // 1) старый путь (если wrapper есть)
    document.querySelectorAll(".photoswipe-wrapper").forEach(initPhotoSwipeOnContainer);

    // 2) новый путь: по всем ссылкам (работает и при 1 фото без wrapper)
    const anchors = document.querySelectorAll("a.product__gallery-toggle");
    const containers = new Set();
    anchors.forEach((a) => {
      const c = getContainerFromAnchor(a);
      if (c) containers.add(c);
    });
    containers.forEach((c) => initPhotoSwipeOnContainer(c));
  }

  function waitAndInit() {
    if (window.PhotoSwipeLightbox && window.PhotoSwipe) {
      initAll();
      return;
    }
    setTimeout(waitAndInit, 60);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitAndInit, { once: true });
  } else {
    waitAndInit();
  }

  document.addEventListener("shopify:section:load", waitAndInit);
})();

class InstanceSwiper extends HTMLElement {
  constructor() {
    super();
    this.handle = this.getAttribute("handle");
    this.swiperInitialized = false; // Prevent multiple initializations
  }

  static get observedAttributes() {
    return ["handle"];
  }

  init() {
    // Prevent multiple initializations
    if (this.swiperInitialized) return;
    this.swiperInitialized = true;

    this.options = this.setOptions();
    this.instance = new Swiper(".swiper--" + this.handle, this.options);
    this.setInteractions();
  }

  connectedCallback() {
    if (Shopify.designMode) {
      window.addEventListener("shopify:section:load", () => this.init());
      window.addEventListener("shopify:section:select", () => this.init());

      // fallback initialization after delay in design mode
      setTimeout(() => {
        if (!this.swiperInitialized) this.init();
      }, 100);
    } else {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.init(), { once: true });
      } else {
        this.init();
      }
    }
  }

  disconnectedCallback() {
    if (this.instance && this.instance.destroy) this.instance.destroy();
  }

  /**
   * Options before initialization
   */
  setOptions() {
    if (this.debug) console.log("setOptions");
    this._options = this.getOptionsAsJsonScripts();
    return this._options;
  }

  getOptionsAsJsonScripts() {
    if (this.debug) console.log("getOptionsAsJsonScripts");
    const jsonScriptAutomated = this.querySelector(`script#swiper--${this.handle}--automated-options`);
    const jsonScriptOverwrite = this.querySelector(`script#swiper--${this.handle}--overwrite-options`);
    let options = {};
    if (jsonScriptAutomated && jsonScriptAutomated.textContent) {
      try {
        options = { ...options, ...JSON.parse(jsonScriptAutomated.textContent) };
      } catch (error) {
        console.error("Error parsing JSON", error, jsonScriptAutomated?.textContent);
      }
    }
    if (jsonScriptOverwrite && jsonScriptOverwrite.textContent) {
      try {
        options = { ...options, ...JSON.parse(jsonScriptOverwrite.textContent) };
      } catch (error) {
        console.error("Error parsing JSON", error, jsonScriptOverwrite?.textContent);
      }
    }
    return options;
  }

  /** thumbs instance should be mounted before this instance */
  getThumbsInstance() {
    if (!this.isThumbsActive) return;
    return document.querySelector(`[handle="${this.getAttribute("thumbs")}"]`)?.instance;
  }

  /**
   * Interaction after initialization
   */
  setInteractions() {
    if (this.debug) console.log("setInteractions");
  }
}

class InstanceSwiperProductThumbs extends InstanceSwiper {
  constructor() {
    super();
  }

  setOptions() {
    super.setOptions();
    this.setCenteredSlides();
    return this._options;
  }

  setCenteredSlides() {
    if (this.handle !== "product-thumbs") return;
    if (this.debug) console.log("setCenteredSlides");

    const afterInit = (swiper) => {
      if (swiper.activeIndex !== 0) swiper.slideTo(0);
      if (this.debug) console.log("afterInit");
      const swiperWrapper = swiper.wrapperEl;
      const observer = new MutationObserver(resetSwiperWrapperTransform);
      observer.observe(swiperWrapper, { attributes: true });
      function resetSwiperWrapperTransform() {
        if (
          swiperWrapper.hasAttribute("style") &&
          swiperWrapper.style?.transform &&
          swiperWrapper.style?.transform !== "translate3d(0px, 0px, 0px)"
        ) {
          swiperWrapper.style.transform = "translate3d(0px, 0px, 0px)";
          if (this.debug) console.log("swiperWrapper observer removed styles!");
        } else if (
          swiperWrapper.hasAttribute("style") &&
          swiperWrapper.style?.transform &&
          swiperWrapper.style?.transform === "translate3d(0px, 0px, 0px)"
        ) {
          setTimeout(() => {
            if (
              swiperWrapper.hasAttribute("style") &&
              swiperWrapper.style?.transform &&
              swiperWrapper.style?.transform === "translate3d(0px, 0px, 0px)"
            ) {
              observer.disconnect();
              if (this.debug) console.log("swiperWrapper observer disconnect!");
            }
          }, 500);
        }
      }

      const calculateAllThumbHeight =
        (this.querySelector(".swiper-slide").clientHeight + 16) * this.querySelectorAll(".swiper-slide").length;
      const thumbsWrapper = this.parentElement;
      function setThumbsWrapperHeightToAuto() {
        if (thumbsWrapper.offsetHeight > calculateAllThumbHeight) {
          thumbsWrapper.style.height = calculateAllThumbHeight - 16 + "px";
        } else {
          thumbsWrapper.removeAttribute("style");
        }
      }
      window.addEventListener("resize", setThumbsWrapperHeightToAuto);
      setTimeout(() => {
        setThumbsWrapperHeightToAuto();
      }, 2500);
    };

    this._options = {
      ...this._options,
      on: {
        ...(this._options.on || {}),
        afterInit: afterInit,
      },
    };
  }
}

if (!customElements.get("swiper-product-thumbs")) {
  customElements.define("swiper-product-thumbs", InstanceSwiperProductThumbs);
}

class InstanceSwiperProductGallery extends InstanceSwiper {
  constructor() {
    super();
    this.isThumbsActive = this.hasAttribute("thumbs");
    this.isZoomActive = this.hasAttribute("zoom"); // зум теперь глобальный, но оставляем флаг
    this.modelViewerBtn = this.querySelector(".model-viewer-btn");
    this.modelViewer = this.querySelector("model-viewer");
    this.isModelActive = false;
  }

  static get observedAttributes() {
    return ["thumbs", "zoom"];
  }

  setOptions() {
    super.setOptions();
    this.setThumbOptions();
    return this._options;
  }

  setThumbOptions() {
    if (!this.isThumbsActive) return;
    const thumbsInstance = super.getThumbsInstance();
    this._options = {
      ...this._options,
      thumbs: {
        swiper: thumbsInstance,
      },
    };
  }

  setInteractions() {
    if (this.isThumbsActive) this.setThumbsInteraction();
    this.initModelViewer();

    const thumbSlides = document.querySelectorAll('.swiper-slide[data-media-type="model"]');
    thumbSlides.forEach((slide) => {
      slide.addEventListener("click", () => this.enableSwiper());
    });

    this.instance.on("slideChange", (swiper) => {
      if (window.innerWidth < 750) {
        swiper.pagination.update();
      }
    });

    this.instance.on("scroll", (swiper) => {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = setTimeout(() => {
        swiper.pagination.update();
      }, 200);
    });
  }

  initModelViewer() {
    const modelSlides = this.querySelectorAll('.swiper-slide[data-media-type="model"]');

    modelSlides.forEach((slide) => {
      const btn = slide.querySelector(".model-viewer-btn");
      const container = slide.querySelector(".model-viewer-container");
      const modelViewer = container?.querySelector("model-viewer");

      if (btn && container && modelViewer) {
        btn.modelViewer = modelViewer;
        modelViewer.controlButton = btn;

        container.addEventListener("click", (e) => {
          if (!btn.classList.contains("is-active")) {
            e.preventDefault();
            e.stopPropagation();
            btn.click();
          }
        });

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          this.toggleModelViewer(btn, modelViewer);
        });

        modelViewer.addEventListener("mousedown", (e) => {
          if (!btn.classList.contains("is-active")) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
      }
    });

    if (this.instance.navigation) {
      const { nextEl, prevEl } = this.instance.navigation;
      if (nextEl) {
        nextEl.addEventListener("click", () => {
          this.resetAllModelViewers();
          this.enableSwiper(true);
        });
      }
      if (prevEl) {
        prevEl.addEventListener("click", () => {
          this.resetAllModelViewers();
          this.enableSwiper(true);
        });
      }
    }
  }

  resetAllModelViewers() {
    const modelSlides = this.querySelectorAll('.swiper-slide[data-media-type="model"]');

    modelSlides.forEach((slide) => {
      const btn = slide.querySelector(".model-viewer-btn");
      const modelViewer = slide.querySelector("model-viewer");

      if (btn && modelViewer) {
        btn.classList.remove("is-active");
        modelViewer.interactionPrompt = "none";
        modelViewer.cameraControls = false;
      }
    });

    this.isModelActive = false;
    this.instance.allowTouchMove = true;
  }

  toggleModelViewer(btn, modelViewer) {
    const wasActive = btn.classList.contains("is-active");
    this.resetAllModelViewers();

    if (!wasActive) {
      this.isModelActive = true;
      this.instance.allowTouchMove = false;

      modelViewer.interactionPrompt = "auto";
      modelViewer.cameraControls = true;
      btn.classList.add("is-active");
    }
  }

  temporarilyDisableSwiper() {
    this.instance.allowTouchMove = false;

    this.swiperTimeout = setTimeout(() => {
      if (!this.isModelActive) {
        this.enableSwiper();
      }
    }, 100);
  }

  enableSwiper(force = false) {
    if (this.swiperTimeout) {
      clearTimeout(this.swiperTimeout);
    }

    if (force || !this.isModelActive) {
      this.instance.allowTouchMove = true;

      if (force && this.isModelActive) {
        this.isModelActive = false;
        if (this.modelViewer) {
          this.modelViewer.interactionPrompt = "none";
          this.modelViewer.cameraControls = false;
        }
        this.modelViewerBtn.classList.remove("is-active");
      }
    }
  }

  setThumbsInteraction() {
    if (!this.isThumbsActive || !this.instance) return;
    const thumbsSwiper = this.options.thumbs.swiper;

    thumbsSwiper.el.addEventListener("click", () => {
      this.enableSwiper(true);
      this.modelViewerBtn.classList.remove("btn--active");
    });

    this.instance.on("slideChangeTransitionStart", function (swiper) {
      const activeIndex = swiper.activeIndex;
      const thumbsActiveIndex = thumbsSwiper.activeIndex;
      if (activeIndex !== thumbsActiveIndex) {
        thumbsSwiper.slideTo(activeIndex);
      }
    });
  }

  setActiveMedia(id) {
    const mediaFound = Array.from(this.querySelectorAll("[data-media-id]")).find(
      (media) => Number(media.dataset.mediaId) === id
    );
    if (!mediaFound) return;

    if (this.instance && typeof this.instance.slideTo === "function") {
      if (this.dataset.hideOtherVariantsMedia === "false") {
        this.instance.slideTo(Number(mediaFound.dataset.index));
      }
    }
  }
}

if (!customElements.get("swiper-product-gallery")) {
  customElements.define("swiper-product-gallery", InstanceSwiperProductGallery);
}

class ProductMediaInfo extends HTMLElement {
  constructor() {
    super();
    this.init();
    window.addEventListener("resize", this.init.bind(this));
    if (Shopify.designMode) {
      window.addEventListener("shopify:section:load", this.init.bind(this));
    }
  }

  init() {
    let containerOffsetWidth = document.querySelector(".main-product__media--slider").offsetWidth || 330;
    if (document.querySelector(".main-product__media--grid-item") && window.innerWidth > 750) {
      containerOffsetWidth = document.querySelector(".main-product__media--grid-item").offsetWidth;
    }
    const maxWidthForInfo = (containerOffsetWidth - 48) / 2;

    const mediaInfoTextWidth = this.querySelector("p:last-child").offsetWidth;
    const mediaInfoHidden = this.querySelector("p[aria-hidden]");

    if (mediaInfoTextWidth > maxWidthForInfo) {
      this.classList.remove("animation-stopped");
      this.style.cssText = `--marquee-speed: ${(mediaInfoTextWidth / maxWidthForInfo) * 8}s`;
      mediaInfoHidden.style.display = "";
    } else {
      this.classList.add("animation-stopped");
      this.style.cssText = "";
      mediaInfoHidden.style.display = "none";
    }
  }
}

if (!customElements.get("product-media-info")) {
  customElements.define("product-media-info", ProductMediaInfo);
}