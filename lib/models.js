const co = require('co')

// globals
// =

var models = {}

// exported api
// =

const load = co.wrap(function * (archive, path) {
  path = normalizePath(path)

  // lookup the file entry
  const fileNode = archive.files.getNodeByPath(path, {allowFiles: true})
  if (!fileNode) return console.error('Not a file on the archive')

  // load the file content
  const url = getUrl(archive, path)
  const res = yield fetch(url)
  const str = yield res.text()

  // setup the model
  models[path] = monaco.editor.createModel(str, null, monaco.Uri.parse(url))
  models[path].onDidChangeContent(e => {
    // inform the press
    if (!fileNode.isChanged) {
      fileNode.isChanged = true
      const evt = new Event('model-dirtied')
      evt.detail = {path}
      window.dispatchEvent(evt)
    }
  })
})

const save = co.wrap(function * (archive, path) {
  // lookup the file entry
  const fileNode = archive.files.getNodeByPath(path, {allowFiles: true})
  if (!fileNode) return console.error('Not a file on the archive')

  if (!fileNode.isChanged) return

  // write the file content
  // TODO

  // update state
  fileNode.isChanged = false
  const evt = new Event('model-cleaned')
  evt.detail = {path}
  window.dispatchEvent(evt)
})

const setActive = co.wrap(function * (archive, path) {
  path = normalizePath(path)

  // load if not yet loaded
  if (!(path in models)) {
    yield load(archive, path)
  }

  // set active
  archive.files.setCurrentNodeByPath(path, {allowFiles: true})
  editor.setModel(models[path])
  window.dispatchEvent(new Event('set-active-model'))
})

module.exports = {load, save, setActive}

// internal methods
// =

function normalizePath (path) {
  if (path.startsWith('/')) return path.slice(1)
  return path
}

function getUrl (archive, path) {
  return `dat://${archive.info.key}/${path}`
}