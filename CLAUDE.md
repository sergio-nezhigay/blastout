# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Shopify theme** (Release v2.0.2 by DigiFist) for the Blastout e-commerce store. It's a custom Liquid-based theme with modular sections, snippets, and JavaScript components.

## Development Commands

```bash
# Start local development server and watch for changes
npm run dev

# Push local theme changes to Shopify store
npm run push

# Pull latest theme from Shopify store
npm run pull
```

All commands target store: `fcbbdb-2.myshopify.com`,

## Project Structure

### Core Directories

- **`layout/`** - Main theme layouts (`theme.liquid`, `password.liquid`)
- **`sections/`** - Reusable section files (60+ sections including header, footer, product, cart, etc.)
- **`snippets/`** - Reusable Liquid components (70+ snippets like `card-product.liquid`, `price.liquid`, etc.)
- **`templates/`** - Page templates (product, collection, page variants, etc.)
  - JSON templates define section configurations
  - Liquid templates for special cases (gift cards, quick-cart)
- **`assets/`** - Static assets (CSS, JavaScript, images)
  - CSS files prefixed by type: `section-*.css`, `component-*.css`, `main-*.css`
  - JavaScript files for interactive components
- **`config/`** - Theme configuration
  - `settings_schema.json` - Theme settings definitions
  - `settings_data.json` - Current theme settings values
  - `markets.json` - Market-specific configurations
- **`locales/`** - Internationalization files (translations for ar, de, en, es, fr, it, etc.)

### Key Files

- **`layout/theme.liquid`** - Main theme wrapper, loads global scripts/styles, defines page structure
- **`assets/global.js`** - Core JavaScript with breakpoint definitions, header logic, and global utilities
- **`assets/base.css`** - Base styles and CSS custom properties
- **`snippets/settings.liquid`** - Renders theme settings as CSS custom properties

## Architecture Patterns

### Liquid Component Pattern

- Snippets accept parameters via Liquid `render` syntax:
  ```liquid
  {%- render 'card-product', product_ref: product, section_id: section.id -%}
  ```
- Common snippet parameters: `product_ref`, `section_id`, `block_index`, `is_small`, `show_variants`

### Section Configuration

- Sections use inline `{%- style -%}` blocks for dynamic CSS custom properties
- Section IDs used for scoping: `#shopify-section-{{ section.id }}`
- Spacing controlled via `--section-spacing-unit-size` multiplied by settings

### JavaScript Architecture

- **Custom Elements** - Web components like `<product-info>`, `<back-to-top>`
- **PubSub Pattern** - `pubsub.js` for event communication between components
- **Deferred Loading** - Scripts use `defer="defer"` attribute
- **Responsive Breakpoints** defined in `global.js`:
  - Mobile: < 750px
  - Tablet: 750px - 990px
  - Desktop: > 990px

### Asset Organization

- **Swiper.js** - Carousel/slider library (`swiper-bundle.min.js`, `swiper-bundle.min.css`)
- **PhotoSwipe** - Lightbox library for product galleries
- **Body Scroll Lock** - Prevents background scrolling in modals/drawers
- **Lazy Loading** - `lazysizes.min.js` for images

## Metafields Configuration

Extensive metafields defined in `.shopify/metafields.json`:

- **Product metafields**: Related products, complementary products, preorder flag, video, color patterns, fabrics, care instructions, etc.
- **Collection metafields**: Background images, recommended products, collection builder
- **Page metafields**: Slogan, intro, contact images
- **Market metafields**: Subscribe text

## Theme Features

### Core Sections

- Header with sticky option, announcement bars, navigation drawers
- Product pages with variant pickers, media galleries, tabs, buy buttons
- Cart drawer and quick cart functionality
- Collection filtering with facets
- Blog and article layouts
- Footer with multiple column options

### Product Features

- Product recommendations and complementary products
- Recently viewed products tracking
- Quick view/quick add to cart
- Product badges (promo, preorder)
- Variant swatches and image switching
- Gift card support
- Pickup availability

### Advanced Components

- Age verification popup
- Newsletter popup
- Store locator with map integration
- Compare slider (before/after)
- Complete the set functionality
- Shop the look
- Countdown timers
- Predictive search

## Development Guidelines

### Image Handling

- **Always use `image_url` filter** (not deprecated `img_url`)
- Example: `{{ settings.favicon | image_url: width: 32, height: 32 }}`

### Responsive Development

- Section settings control mobile vs desktop behavior
- Use CSS custom properties for responsive spacing
- Liquid conditions check device-specific settings

### Shopify Sections API

- Header sections grouped in `header-group`
- Footer sections grouped in `footer-group`
- Overlay sections grouped in `overlay-group`
- Use `{%- sections 'group-name' -%}` to render section groups

### Working with Variants

- Variant selection handled by JavaScript in `product-variants.js`
- Use `window.variantStrings` for localized button text
- Product forms use `product-form` custom element

### Cart Integration

- Global cart state managed via Shopify AJAX API
- Routes available in `window.routes` (cart_url, cart_add_url, etc.)
- Shipping threshold configured in theme settings

## Key Global Variables (JavaScript)

Defined in `layout/theme.liquid`:

- `window.theme.settings` - Money format, cart thresholds, shipping text
- `window.shopUrl` - Store origin URL
- `window.routes` - Shopify route URLs
- `window.cartStrings` - Localized cart messages
- `window.variantStrings` - Localized product messages
- `window.validationStrings` - Form validation messages

## Internationalization

- Translation keys use format: `{{ 'namespace.key' | t }}`
- Default locale: `en.default.json`
- Schema translations: `en.default.schema.json`
- Supports RTL languages (Arabic, Hebrew) with automatic `dir="rtl"` attribute

use
"npm run dev" to debug locally if nesassary
