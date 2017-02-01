const yo = require('yo-yo')
const co = require('co')
const {Archive} = require('builtin-pages-lib')
const rFileTree = require('./lib/com/file-tree')
const models = require('./lib/models')

const URL = '1f968afe867f06b0d344c11efc23591c7f8c5fb3b4ac938d6000f330f6ee2a03'
const archive = new Archive()
archive.dirtyFiles = {} // which files have been modified?

co(function * () {
  // load the archive
  console.log('Loading', URL)
  yield archive.fetchInfo(URL)
  archive.on('changed', onArchiveChanged)
  renderNav()

  // debug
  window.models = models
  window.archive = archive
}).catch(console.error.bind(console, 'Failed to load'))

function renderNav () {
  // nav
  yo.update(
    document.querySelector('.layout-nav'),
    yo`<div class="layout-nav">
      <div class="sitetitle">${archive.info.title}</div>
      ${rFileTree(archive)}
    </div>`
  )
  // header
  const currentNode = archive.files.currentNode
  const isChanged = archive.dirtyFiles[currentNode.entry.path] ? '*' : ''
  yo.update(
    document.querySelector('.header'),
    yo`<div class="header">
      <div class="btn"><span class="icon icon-floppy"></span> Save</div>
      <div class="sep"></div>
      <div class="file-info">
        ${currentNode.entry.path}${isChanged}
        ${window.editor && editor.getModel()
          ? yo`<span class="muted thin">${editor.getModel().getModeId()}</span>`
          : ''}
      </div>
      <div class="flex-fill"></div>
      <div class="sep"></div>
      <div class="btn"><span class="icon icon-flow-branch"></span> Fork</div>
      <div class="sep"></div>
      <div class="btn"><span class="icon icon-info"></span> Site Info</div>
      <div class="sep"></div>
      <div class="btn"><span class="icon icon-popup"></span> Open</div>
    </div>`
  )
}

window.addEventListener('editor-created', () => {
  models.setActive(archive, 'index.html')
})

window.addEventListener('open-file', e => {
  models.setActive(archive, e.detail.path)
})

window.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.keyCode === 83/*'S'*/) {
    models.save(archive, archive.files.currentNode.entry.path)
    e.preventDefault()
  }
})

window.addEventListener('set-active-model', renderNav)
window.addEventListener('model-dirtied', renderNav)
window.addEventListener('model-cleaned', renderNav)

function onArchiveChanged () {
  const activeModel = models.getActive()
  if (!activeModel) return
  archive.files.setCurrentNodeByPath(activeModel.path, {allowFiles: true})
  renderNav()
}