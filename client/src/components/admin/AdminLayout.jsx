import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const ml = sidebarOpen ? '240px' : '64px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div style={{ flex: 1, marginLeft: ml, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.22s cubic-bezier(.4,0,.2,1)' }}>
        <Header sidebarOpen={sidebarOpen} />
        <main style={{ flex: 1, padding: '88px 36px 48px', minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
