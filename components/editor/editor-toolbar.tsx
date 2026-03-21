'use client'

import type { ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'

type Props = {
  editorRef: React.RefObject<ReactCodeMirrorRef | null>
}

function wrapSelection(view: EditorView, before: string, after: string) {
  const { state } = view
  const changes = state.selection.ranges.map(range => {
    if (range.empty) {
      return { from: range.from, to: range.from, insert: before + after }
    }
    const text = state.sliceDoc(range.from, range.to)
    return { from: range.from, to: range.to, insert: before + text + after }
  })
  // For empty selections, place cursor between the markers after insert
  const newSelection = state.selection.ranges.every(r => r.empty)
    ? EditorSelection.cursor(state.selection.main.from + before.length)
    : undefined
  view.dispatch({ changes, ...(newSelection ? { selection: newSelection } : {}) })
  view.focus()
}

function prefixLine(view: EditorView, prefix: string) {
  const { state } = view
  const line = state.doc.lineAt(state.selection.main.from)
  const hasPrefix = line.text.startsWith(prefix)
  view.dispatch({
    changes: hasPrefix
      ? { from: line.from, to: line.from + prefix.length, insert: '' }
      : { from: line.from, insert: prefix },
  })
  view.focus()
}

function insertAtCursor(view: EditorView, text: string) {
  const pos = view.state.selection.main.from
  view.dispatch({ changes: { from: pos, insert: text } })
  view.focus()
}

function ToolbarButton({
  onClick,
  title,
  children,
  className = '',
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-8 min-w-[32px] px-2 rounded-lg text-sm text-ink-muted hover:bg-linen hover:text-ink transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

export function EditorToolbar({ editorRef }: Props) {
  const getView = () => editorRef.current?.view

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-1 py-1.5 border-b border-border/80 bg-surface rounded-t-xl">
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) wrapSelection(v, '**', '**') }}
        title="Bold"
        className="font-bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) wrapSelection(v, '*', '*') }}
        title="Italic"
        className="italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) prefixLine(v, '# ') }}
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) prefixLine(v, '## ') }}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) prefixLine(v, '- ') }}
        title="Bullet list"
      >
        &#8212;
      </ToolbarButton>
      <div className="w-px h-5 bg-border/60 mx-1" />
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) insertAtCursor(v, '{{first_name}}') }}
        title="Insert first name"
        className="font-mono text-terra text-[11px] px-2"
      >
        {'{{first_name}}'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => { const v = getView(); if (v) insertAtCursor(v, '{{last_name}}') }}
        title="Insert last name"
        className="font-mono text-terra text-[11px] px-2"
      >
        {'{{last_name}}'}
      </ToolbarButton>
    </div>
  )
}
