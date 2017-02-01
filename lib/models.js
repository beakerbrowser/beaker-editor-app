const co = require('co')
const yo = require('yo-yo')

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
    models[path].isEditable = true
    models[path].lang = models[path].getModeId()
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

    // load according to editability
    const isEditable = checkIfIsEditable(path)
    console.log(isEditable)
    if (isEditable) {
      yield setEditableActive(archive, path)
    } else {
      yield setUneditableActive(archive, path)
    }

    // set active
    active = models[path]
    archive.files.setCurrentNodeByPath(path, {allowFiles: true})
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

function checkIfIsEditable (path) {
  // no extension?
  if (path.split('/').pop().indexOf('.') === -1) {
    return true // assume plaintext
  }
  // do we have this language?
  const l = monaco.languages.getLanguages()
  for (var i=0; i < l.length; i++) {
    for (var j=0; j < l[i].extensions.length; j++) {
      if (path.endsWith(l[i].extensions[j])) {
        return true
      }
    }
  }
  return false
}

const setEditableActive = co.wrap(function * (archive, path) {
  // load if not yet loaded
  if (!(path in models)) {
    yield load(archive, path)
  }
  editor.setModel(models[path])
  document.getElementById('uneditable-container').classList.add('hidden')
  document.getElementById('editable-container').classList.remove('hidden')
})

const setUneditableActive = co.wrap(function * (archive, path) {
  // set the entry info
  models[path] = {
    path,
    isEditable: false,
    lang: ''
  }
  document.getElementById('editable-container').classList.add('hidden')  
  yo.update(document.getElementById('uneditable-container'), yo`
    <div id="uneditable-container">
      <img src=${getUrl(archive, path)} />
    </div>
  `)
})