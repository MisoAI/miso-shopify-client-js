# Miso Shopify JS SDK

This library integrates Miso's personalization service into Shopify with minimum engineering effort. For how personalization works in Miso, please visit [documentation site](https://docs.miso.ai).

This SDK provides the following Miso services:

1. Auto-collect user interaction using interaction API, so to train personalization model.

## Usage

This SDK is installed & enable automatically once Shopify integration is setup via [Dojo](https://dojo.askmiso.com/), the web dashboard for Miso.

Install manually using script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/miso-shopify-js-sdk@0.1.0?api_key=YOUR_MISO_PUBLISHABLE_KEY"></script>
```

Note that SDK will not started if `api_key` is missing. The `api_key` can also be specified during runtime:

```html
<script src="https://cdn.jsdelivr.net/npm/miso-shopify-js-sdk@0.1.0?api_key=YOUR_MISO_PUBLISHABLE_KEY"></script>

<script>
misoSDK.init({ apiKey: 'yourMisoPublishableKey' })
</script>
```

## Technical Detail

### Interaction collection

Miso Shopify JS SDK parse Shopify page and find important interaction signal at best. As theme of each Shopify store differ, the SDK might failed to catch interaction in some cases. Please [report an issue](https://github.com/askmiso/miso-shopify-client-js/issues) if you find this happens.

The SDK supports capturing the following interaction:

1. `product_detail_page_view` in product page and article page.
2. `category_page_view` in collection page.
3. `add_to_cart` in all pages.
4. `remove_from_cart` in all pages.

For detail usage of each interactions, please visit [Miso API document](https://api.askmiso.com/#operation/interaction_upload_api_v1_interactions_post).

## Developer How-to

## System Requirements

- Node 12

## Environment Variable

Create .env file from env.sample, and webpack will pick variable in .env automatically.

```bash
cp env.sample .env
```

## Dev Requirement

1. Setup git commit template by

   ```bash
   git config commit.template .gitmessage
   ```

1. Setup pre-push hook to check commit log, run linter, and unit test.

   ```bash
   ln -s ../../pre-push .git/hooks/pre-push
   ```

1. Use `Default` template for merge request
