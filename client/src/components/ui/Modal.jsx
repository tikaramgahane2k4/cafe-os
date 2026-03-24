import Button from './Button';

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  actions = null,
  children,
  width = 560,
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(23,17,13,0.58)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: `min(${width}px, 100%)`,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: 22, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
          <div>
            {title ? <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{title}</div> : null}
            {subtitle ? <div style={{ marginTop: 5, fontSize: 13, color: 'var(--text-3)' }}>{subtitle}</div> : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <div style={{ padding: 22 }}>
          {children}
        </div>
        {actions ? (
          <div style={{ padding: '0 22px 22px', display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
