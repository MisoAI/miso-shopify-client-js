export async function cart() {
  const response = await window.fetch(`${window.Shopify.routes.root}cart.js`);
  return await getBodyOrThrow(response);
}

export async function product(handle) {
  const response = await window.fetch(`${window.Shopify.routes.root}products/${handle}.js`);
  return await getBodyOrThrow(response);
}

async function getBodyOrThrow(response) {
  const body = await response.json();
  if (response.status >= 400 || body.status >= 400) {
    throw new Error(`[${body.status}] ${body.message}: ${body.description}.`);
  }
  return body;
}
