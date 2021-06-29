export function getValFromQuery (valKey, query = '') {
  if (!query && window) {
    query = window.location.search || ''
  }
  valKey = `${valKey}=`
  const searchTokens = query.slice(1).split('&')
  const targetString = searchTokens.find(token => token.startsWith(valKey))
  if (!targetString) {
    return
  }
  return targetString.slice(valKey.length)
}

export function getSlugFromPath (slugKey) {
  const pathTokens = window ? window.location.pathname.split('/') : []
  // example: /collection/col-id/product-prod-id
  for (let i = pathTokens.length - 2; i > 0; i -= 2) {
    if (pathTokens[i] === slugKey) {
      return pathTokens[i + 1]
    }
  }
}

export function genUuid () {
  const tempUrl = URL.createObjectURL(new Blob())
  const uuid = tempUrl.toString()
  URL.revokeObjectURL(tempUrl)
  // remove prefix (e.g. blob:null/, blob:www.test.com/, ...)
  return uuid.substr(uuid.lastIndexOf('/') + 1)
}