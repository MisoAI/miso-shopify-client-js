# Miso Shopify Client Script

This script integrates Miso's personalization service into Shopify with minimum engineering effort. For how personalization works in Miso, please visit [documentation site](https://docs.miso.ai).

This script serves for the following purposes:

1. Collect user interaction events automatically for personalization model training.
2. Provide custom elements to render recommendation results with ease.

## Usage

This script is installed automatically once Shopify integration is setup via [Dojo](https://dojo.askmiso.com/), the web dashboard for Miso.

## Technical Detail

### Interaction collection

Miso Shopify JS SDK parse Shopify page and find important interaction signal at best. As theme of each Shopify store differ, the SDK might failed to catch interaction in some cases. Please [report an issue](https://github.com/askmiso/miso-shopify-client-js/issues) if you find this happens.

The SDK supports capturing the following interaction:

1. `home_page_view` in home page.
1. `product_detail_page_view` in product page.
1. `category_page_view` in collection page.
1. `add_to_cart` in all pages.
1. `remove_from_cart` in all pages.

For detail usage of each interactions, please visit [Miso API document](https://api.askmiso.com/#operation/interaction_upload_api_v1_interactions_post).
