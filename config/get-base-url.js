import isDev from './is-dev'

export default function getBaseUrl() {
  let href = '/'
  if (isDev()) return href
  href = getRootHref()
  try {
    console.info('test here')
    if (document.getElementsByTagName('base')[0].href)
      href = document.getElementsByTagName('base')[0].href
  } catch (e) {
    // console.error("Failed to get base href")
  }
  return href + 'gateway'
}

function getRootHref() {
  // return location.href.split('#')[0]
  console.info('DebugURL',location)
  return location.origin + location.pathname
}
