const planColors = {
  Free:       { bg: '#1A0D06', color: '#9C7A60' },
  Starter:    { bg: '#1E100A', color: '#D4B896' },
  Pro:        { bg: '#2A1608', color: '#E8A94F' },
  Enterprise: { bg: '#3D2410', color: '#C97C3A' },
};

function statusBadge(status) {
  const map = {
    Active:    { bg: '#0A200F', color: '#4ADE80', dot: '#22C55E' },
    Suspended: { bg: '#221505', color: '#FCD34D', dot: '#F59E0B' },
    Expired:   { bg: '#200810', color: '#FB7185', dot: '#F43F5E' },
  };
  const s = map[status] || { bg: '#2A1608', color: '#9C7A60', dot: '#7A5A42' };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '4px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: '700', letterSpacing: '0.04em',
      display: 'inline-flex', alignItems: 'center', gap: '5px',
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

function TenantRow({ tenant, onStatusChange, onDelete, onEdit }) {
  const planStyle = planColors[tenant.subscriptionPlan] || planColors.Free;
  const btn = (bg, color, hoverBg) => ({
    background: bg, color, border: 'none',
    padding: '5px 12px', borderRadius: '7px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '600', marginRight: '5px',
    transition: 'opacity 0.15s',
  });

  return (
    <tr style={{ borderBottom: '1px solid #2A1608', transition: 'background 0.15s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1E100A')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '13px 16px' }}>
        <div style={{ color: '#FFF8F0', fontWeight: '600', fontSize: '14px' }}>{tenant.cafeName}</div>
        <div style={{ color: '#7A5A42', fontSize: '11px', marginTop: '2px' }}>{tenant.phone || ''}</div>
      </td>
      <td style={{ padding: '13px 16px', color: '#D4B896', fontSize: '13px' }}>{tenant.ownerName}</td>
      <td style={{ padding: '13px 16px', color: '#9C7A60', fontSize: '13px' }}>{tenant.email}</td>
      <td style={{ padding: '13px 16px' }}>
        <span style={{
          background: planStyle.bg, color: planStyle.color,
          padding: '3px 9px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
          border: '1px solid rgba(201,124,58,0.2)',
        }}>{tenant.subscriptionPlan}</span>
      </td>
      <td style={{ padding: '13px 16px' }}>{statusBadge(tenant.status)}</td>
      <td style={{ padding: '13px 16px', color: '#7A5A42', fontSize: '12px' }}>
        {new Date(tenant.createdAt).toLocaleDateString()}
      </td>
      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
        <button style={btn('#2A1E0A', '#E8A94F')} onClick={() => onEdit(tenant)}>✏ Edit</button>
        {tenant.status === 'Active' ? (
          <button style={btn('#221505', '#FCD34D')} onClick={() => onStatusChange(tenant._id, 'Suspended')}>
            ⏸ Suspend
          </button>
        ) : (
          <button style={btn('#0A200F', '#4ADE80')} onClick={() => onStatusChange(tenant._id, 'Active')}>
            ▶ Activate
          </button>
        )}
        <button style={btn('#200810', '#FB7185')} onClick={() => onDelete(tenant._id)}>🗑 Del</button>
      </td>
    </tr>
  );
}

export default TenantRow;
