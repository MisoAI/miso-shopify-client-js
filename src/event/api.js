export async function cart() {
  const response = await window.fetch(`${window.Shopify.routes.root}cart.js`);
  return await getBodyOrThrow(response);
}

export async function product(handle) {
  const response = await window.fetch(`${window.Shopify.routes.root}products/${handle}.js`);
  return await getBodyOrThrow(response);
}

async function getBodyOrThrow(response) {
  if (response.status >= 400) {
    throw new Error(`[${response.status}] ${response.message}: ${response.description}.`);
  }
  return await response.json();
}
