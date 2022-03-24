export function getConfigFromScript (valKey) {
  const me = document.currentScript
  if (me) {
    const urlParser = document.createElement('a')
    urlParser.href = me.src
    const val = getValFromQuery(valKey, urlParser.search)
    return val
  }
}

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
