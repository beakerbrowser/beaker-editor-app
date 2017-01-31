const yo = require('yo-yo')
const co = require('co')
const {Archive} = require('builtin-pages-lib')
const rFileTree = require('./lib/com/file-tree')
const models = require('./lib/models')

const URL = 'ff34725120b2f3c5bd5028e4f61d14a45a22af48a7b12126d5d588becde88a93'
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

window.addEventListener('change-model', () => {
  renderNav()
})