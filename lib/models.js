const co = require('co')

// globals
// =

var models = {}

// exported api
// =

const load = co.wrap(function * (archive, path) {
  path = normalizePath(path)
  const url = getUrl(archive, path)
  const res = yield fetch(url)
  const str = yield res.text()
  const type = getType(url)
  models[path] = monaco.editor.createModel(str, type, url)
})

const setActive = co.wrap(function * (archive, path) {
  path = normalizePath(path)

  // load if not yet loaded
  if (!(path in models)) {
    yield load(archive, path)
  }

  // set active
  var names = path.split('/')
  archive.files.setCurrentNodeByPath(names, {allowFiles: true})
  editor.setModel(models[path])
  window.dispatchEvent(new Event('change-model'))
})

module.exports = {load, setActive}

// internal methods
// =

function normalizePath (path) {
  if (path.startsWith('/')) return path.slice(1)
  return path
}

function getUrl (archive, path) {
  return `dat://${archive.info.key}/${path}`
}

function getType (url) {
  // TODO
  return 'html'
}