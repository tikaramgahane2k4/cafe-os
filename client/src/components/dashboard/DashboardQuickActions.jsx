import Card from '../ui/Card';

export default function DashboardQuickActions({ actions }) {
  return (
    <Card title="Quick actions" subtitle="Jump into the tasks that move revenue, adoption, and tenant operations.">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 18,
              background: 'linear-gradient(180deg, rgba(198,124,78,0.08), transparent), var(--bg-card)',
              padding: '18px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'translateY(-2px)';
              event.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'translateY(0)';
              event.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: 22 }}>{action.icon}</div>
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{action.label}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>{action.description}</div>
          </button>
        ))}
      </div>
    </Card>
  );
}
