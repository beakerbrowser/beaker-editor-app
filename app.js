const yo = require('yo-yo')
const co = require('co')
const {Archive} = require('builtin-pages-lib')
const rFileTree = require('./com/file-tree')

const URL = 'ff34725120b2f3c5bd5028e4f61d14a45a22af48a7b12126d5d588becde88a93'

co(function * () {
  // load the archive
  console.log('Loading', URL)
  var archive = new Archive()
  yield archive.fetchInfo(URL)

  // render
  yo.update(
    document.querySelector('.layout-nav'),
    yo`<div class="layout-nav">
      <div class="header">
        <div class="btn flex-fill">Hostless Website Portal</div>
      </div>
      ${rFileTree(archive)}
    </div>`
  )
  console.log('done')
}).catch(console.error.bind(console, 'Failed to load'))