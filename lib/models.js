const co = require('co')

// globals
// =

var models = {}
var active

// exported api
// =

const load = co.wrap(function * (archive, path) {
  try {
    path = normalizePath(path)

    // load the file content
    const url = getUrl(archive, path)
    const res = yield fetch(url)
    const str = yield res.text()

    // setup the model
    models[path] = monaco.editor.createModel(str, null, monaco.Uri.parse(url))
    models[path].path = path
    models[path].onDidChangeContent(onDidChange(archive, path))
  } catch (e) {
    console.error(e)
    throw e
  }
})

const save = co.wrap(function * (archive, path) {
  try {
    // lookup the file entry
    const fileNode = archive.files.getNodeByPath(path, {allowFiles: true})
    if (!fileNode) throw new Error('Not a file on the archive')
    const model = models[path]
    if (!model) throw new Error('Model not found')

    if (!archive.dirtyFiles[path]) return

    // write the file content
    yield datInternalAPI.writeArchiveFileFromData(
      archive.info.key,
      path,
      model.getValue(),
      {encoding: 'utf-8'}
    )

    // update state
    archive.dirtyFiles[path] = false
    const evt = new Event('model-cleaned')
    evt.detail = {path}
    window.dispatchEvent(evt)
  } catch (e) {
    console.log(path, models, models[path])
    console.error(e)
    throw e
  }
})

const setActive = co.wrap(function * (archive, path) {
  try {
    path = normalizePath(path)

    // load if not yet loaded
    if (!(path in models)) {
      yield load(archive, path)
    }

    // set active
    active = models[path]
    archive.files.setCurrentNodeByPath(path, {allowFiles: true})
    editor.setModel(models[path])
    window.dispatchEvent(new Event('set-active-model'))
  } catch (e) {
    console.error(e)
    throw e
  }
})

function getActive () {
  return active
}

module.exports = {load, save, setActive, getActive}

// internal methods
// =

function onDidChange (archive, path) {
  return e => {
    // lookup the file entry
    const fileNode = archive.files.getNodeByPath(path, {allowFiles: true})
    if (!fileNode) throw new Error('Not a file on the archive')

    // inform the press
    if (!archive.dirtyFiles[path]) {
      archive.dirtyFiles[path] = true
      const evt = new Event('model-dirtied')
      evt.detail = {path}
      window.dispatchEvent(evt)
    }
  }
}

function normalizePath (path) {
  if (path.startsWith('/')) return path.slice(1)
  return path
}

function getUrl (archive, path) {
  return `dat://${archive.info.key}/${path}`
}