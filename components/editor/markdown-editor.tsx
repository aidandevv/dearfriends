'use client'

import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { warmExtensions } from './warm-theme'

export type { ReactCodeMirrorRef }

type Props = {
  value: string
  onChange: (value: string) => void
  editorRef?: React.RefObject<ReactCodeMirrorRef | null>
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, editorRef, placeholder }: Props) {
  return (
    <CodeMirror
      ref={editorRef as React.Ref<ReactCodeMirrorRef>}
      value={value}
      onChange={onChange}
      extensions={[markdown(), ...warmExtensions, EditorView.lineWrapping]}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: false,
        bracketMatching: false,
        closeBrackets: false,
        autocompletion: false,
        rectangularSelection: false,
        crosshairCursor: false,
        highlightActiveLine: false,
        highlightSelectionMatches: false,
        closeBracketsKeymap: false,
        searchKeymap: false,
      }}
      placeholder={placeholder}
      className="min-h-[420px]"
    />
  )
}
