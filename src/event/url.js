// TODO: verify this
const ROUTES_ROOT = window.Shopify && window.Shopify.routes && window.Shopify.routes.root || '/';

function normalizePathname(pathname) {
  if (pathname.startsWith(ROUTES_ROOT)) {
    pathname = pathname.substring(ROUTES_ROOT.length);
  }
  if (pathname.charAt(0) === '/') {
    pathname = pathname.substring(1);
  }
  const len = pathname.length;
  if (pathname.charAt(len - 1) === '/') {
    pathname = pathname.substring(0, len - 1);
  }
  return pathname;
}

function addVariantIdIfPresent(data, params) {
  const variantId = params.get('variant');
  if (variantId) {
    data.variantId = variantId;
  }
}

// TODO: implement in a more systematic way

export function parse(urlString) {
  const url = new URL(urlString);
  const pathname = normalizePathname(url.pathname);

  if (pathname.length === 0) {
    return { type: 'home' };
  }

  const params = url.searchParams;
  const segments = pathname.split('/');
  const len = segments.length;
  const data = { type: 'unknown' };

  switch (segments[0]) {
    case 'account':
    case 'cart':
    case 'recommendations':
      data.type = segments[0];
      if (len > 1) {
        data.subtype = segments[1];
      }
      break;
    case 'search':
      data.type = segments[0];
      if (len > 1) {
        data.subtype = segments[1];
      }
      const searchTerm = params.get('q');
      if (searchTerm) {
        data.searchTerm = searchTerm;
      }
      break;
    case 'blogs':
      switch (len) {
        case 2:
          data.type = 'blog';
          data.blogName = segments[1];
          break;
        case 3:
          data.type = 'article';
          data.blogName = segments[1];
          data.articleHandle = segments[2];
          break;
      }
      break;
    case 'collections':
      switch (len) {
        case 1:
          data.type = 'collection-list';
          break;
        case 2:
          data.type = 'collection';
          data.collectionHandle = segments[1];
          break;
        case 3:
          data.type = 'collection-tag';
          data.collectionHandle = segments[1];
          data.tag = segments[2];
          break;
        case 4:
          if (segments[2] === 'products') {
            data.type = 'product';
            data.collectionHandle = segments[1];
            data.productHandle = segments[3];
            addVariantIdIfPresent(data, params);
          }
          break;
      }
      break;
    case 'pages':
      switch (len) {
        case 2:
          data.type = 'page';
          data.pageHandle = segments[1];
          break;
      }
      break;
    case 'products':
      switch (len) {
        case 1:
          data.type = 'collection-list';
          break;
        case 2:
          data.type = 'product';
          data.productHandle = segments[1];
          addVariantIdIfPresent(data, params);
          break;
      }
      break;
  }
  return data;
}
