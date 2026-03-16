import { IconAlert, IconX, IconCheck, IconTrash } from './icons';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fade-in 0.15s ease-out',
    }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px 32px', maxWidth: '420px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
            background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(198,124,78,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: danger ? '#ef4444' : '#C67C4E',
          }}>
            {danger ? <IconTrash width={18} height={18} /> : <IconAlert width={18} height={18} />}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--text-1)' }}>
              {title}
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-3)', lineHeight: 1.6 }}>
              {message}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 18px', borderRadius: '8px', fontSize: '13px',
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <IconX width={13} height={13} /> Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              background: danger ? '#ef4444' : 'linear-gradient(135deg, #C67C4E, #E09A6E)',
              color: '#fff', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <IconCheck width={13} height={13} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
