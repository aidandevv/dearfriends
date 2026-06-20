'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { updateShareSlug, updateShareMessage } from '@/lib/actions/user'
import { ShareLinkActions } from '@/components/share-link-actions'

const DEFAULT_MESSAGE = "Hey — I'm putting together an address book."

export function ShareLinkEditor({
  shareSlug,
  shareMessage,
  siteDisplay,
  siteUrl,
}: {
  shareSlug: string
  shareMessage: string | null
  siteDisplay: string
  siteUrl: string
}) {
  const [slug, setSlug] = useState(shareSlug)
  const [message, setMessage] = useState(shareMessage ?? DEFAULT_MESSAGE)
  const [slugDraft, setSlugDraft] = useState(shareSlug)
  const [messageDraft, setMessageDraft] = useState(shareMessage ?? DEFAULT_MESSAGE)
  const [editingSlug, setEditingSlug] = useState(false)
  const [editingMessage, setEditingMessage] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const currentUrl = `${siteUrl}/share/${slug}`

  function openSlug() {
    setSlugDraft(slug)
    setSlugError(null)
    setEditingSlug(true)
  }

  function cancelSlug() {
    setSlugDraft(slug)
    setSlugError(null)
    setEditingSlug(false)
  }

  function saveSlug() {
    setSlugError(null)
    startTransition(async () => {
      const result = await updateShareSlug(slugDraft)
      if (result?.error) {
        setSlugError(
          result.error === 'slug_taken' ? 'That slug is already taken.' :
          result.error === 'slug_limit' ? 'Slug limit reached.' :
          result.error
        )
      } else {
        setSlug(slugDraft)
        setEditingSlug(false)
      }
    })
  }

  function openMessage() {
    setMessageDraft(message)
    setMessageError(null)
    setEditingMessage(true)
  }

  function cancelMessage() {
    setMessageDraft(message)
    setMessageError(null)
    setEditingMessage(false)
  }

  function saveMessage() {
    setMessageError(null)
    startTransition(async () => {
      const result = await updateShareMessage(messageDraft)
      if (result?.error) {
        setMessageError(result.error)
      } else {
        setMessage(messageDraft)
        setEditingMessage(false)
      }
    })
  }

  return (
    <>
      {/* URL row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: 'var(--paper)',
        border: '1px solid var(--line)',
        borderRadius: 8, overflow: 'hidden',
        marginBottom: slugError ? 6 : 14,
      }}>
        {editingSlug ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6, height: 44 }}>
            <span style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5, color: 'var(--muted)', whiteSpace: 'nowrap',
            }}>
              {siteDisplay}/share/
            </span>
            <input
              aria-label="Share link slug"
              autoFocus
              value={slugDraft}
              onChange={e => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') saveSlug(); if (e.key === 'Escape') cancelSlug() }}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent', minWidth: 0,
                fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5, color: 'var(--periwinkle)', fontWeight: 600,
              }}
            />
            <button onClick={saveSlug} disabled={pending} title="Save" style={{ color: 'var(--periwinkle)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <Check size={14} />
            </button>
            <button onClick={cancelSlug} title="Cancel" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div style={{
              flex: 1, padding: '12px 14px',
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 12.5, color: 'var(--ink-soft)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontFeatureSettings: '"tnum"',
            }}>
              <span style={{ color: 'var(--muted)' }}>{siteDisplay}/share/</span>
              <span style={{ color: 'var(--periwinkle)', fontWeight: 600 }}>{slug}</span>
            </div>
            <button
              onClick={openSlug}
              title="Edit slug"
              style={{
                height: 44, padding: '0 14px', display: 'flex', alignItems: 'center',
                color: 'var(--muted)', background: 'none', border: 'none',
                borderLeft: '1px solid var(--line)', cursor: 'pointer',
              }}
            >
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>

      {slugError && (
        <p style={{ fontSize: 12, color: 'var(--stamp)', margin: '0 0 10px' }}>{slugError}</p>
      )}

      <ShareLinkActions url={currentUrl} />

      {/* Dashed divider */}
      <div style={{
        height: 1,
        background: 'repeating-linear-gradient(to right, var(--line) 0 6px, transparent 6px 12px)',
        margin: '18px -4px 16px',
      }} />

      {/* Message preview / editor */}
      {editingMessage ? (
        <div style={{
          background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8, padding: '14px 16px',
        }}>
          <textarea
            aria-label="Invite message"
            autoFocus
            value={messageDraft}
            onChange={e => setMessageDraft(e.target.value)}
            maxLength={200}
            rows={3}
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              resize: 'none', boxSizing: 'border-box',
              fontFamily: 'var(--font-ppwriter), Georgia, serif',
              fontStyle: 'italic', fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.45,
            }}
          />
          {messageError && (
            <p style={{ fontSize: 12, color: 'var(--stamp)', margin: '4px 0 6px' }}>{messageError}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 11, color: 'var(--muted)' }}>
              {messageDraft.length}/200
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={cancelMessage}
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 12,
                  color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveMessage}
                disabled={pending}
                style={{
                  fontFamily: 'var(--font-dm-sans), sans-serif', fontSize: 12, fontWeight: 600,
                  color: 'white', background: 'var(--periwinkle)', border: 'none',
                  borderRadius: 999, padding: '4px 12px', cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Edit invite message"
          onClick={openMessage}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              openMessage()
            }
          }}
          style={{
            background: 'var(--paper)', border: '1px solid var(--line)',
            borderRadius: 8, padding: '14px 16px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
            position: 'relative', cursor: 'pointer',
          }}
        >
          <div style={{
            width: 36, height: 44, flexShrink: 0,
            background: 'var(--cream)',
            border: '1.5px dashed var(--paper)',
            outline: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-ppwriter), Georgia, serif',
            fontStyle: 'italic', fontSize: 14, color: 'var(--periwinkle)',
            transform: 'rotate(-4deg)',
          }}>
            df
          </div>
          <div style={{
            fontFamily: 'var(--font-ppwriter), Georgia, serif',
            fontSize: 13.5, color: 'var(--ink-soft)',
            lineHeight: 1.45, flex: 1, minWidth: 0,
          }}>
            <b style={{ color: 'var(--ink)', fontWeight: 500 }}>
              &ldquo;{message}&rdquo;
            </b>
            <br />
            They fill it out in a minute. No account required.
            <span style={{
              fontFamily: 'var(--font-dm-sans), sans-serif',
              fontSize: 11, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '0.16em',
              display: 'block', marginTop: 6,
            }}>
              click to edit message
            </span>
          </div>
          <Pencil size={13} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 2 }} />
        </div>
      )}
    </>
  )
}
