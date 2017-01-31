require.config({ paths: { 'vs': 'beaker:editor/vs' }});
require(['vs/editor/editor.main'], function() {
  window.editor = monaco.editor.create(document.getElementById('code'), {
    lineNumbersMinChars: 4,
    automaticLayout: true,
    fixedOverflowWidgets: true,
    roundedSelection: false
  })
  window.dispatchEvent(new Event('editor-created'))

  // moved, probably not needed anymore
  // editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
  //   window.dispatchEvent(new Event('save-current-model'))
  // })
})