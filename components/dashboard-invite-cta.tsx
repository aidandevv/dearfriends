'use client'

export function DashboardInviteCta() {
  function scrollToInvite() {
    document.getElementById('invite')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <button
      type="button"
      onClick={scrollToInvite}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 18px',
        background: 'var(--paper)',
        color: 'var(--ink)',
        border: '1px solid var(--line)',
        borderRadius: 999,
        fontFamily: 'var(--font-dm-sans), sans-serif',
        fontSize: 13.5,
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 1px 0 rgba(255,255,255,.6) inset',
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 4v12M4 10h12" stroke="var(--periwinkle)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      Share invite link
    </button>
  )
}
