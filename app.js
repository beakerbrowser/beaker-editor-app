const yo = require('yo-yo')
const co = require('co')
const {Archive} = require('builtin-pages-lib')
const rFileTree = require('./lib/com/file-tree')
const models = require('./lib/models')

const URL = '469eb4ed1089ee7fa9705455ea0a372bfa5b2995e55f54bc7f2bfa4eafea114b'
const archive = new Archive()

co(function * () {
  // load the archive
  console.log('Loading', URL)
  yield archive.fetchInfo(URL)
  renderNav()
}).catch(console.error.bind(console, 'Failed to load'))

function renderNav () {
  yo.update(
    document.querySelector('.layout-nav'),
    yo`<div class="layout-nav">
      <div class="sitetitle">${archive.info.title}</div>
      ${rFileTree(archive)}
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