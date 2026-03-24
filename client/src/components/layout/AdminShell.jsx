import { useEffect, useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

export default function AdminShell({ children }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 960);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 960);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 960;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 88 : 264);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top right, rgba(198,124,78,0.12), transparent 28%), linear-gradient(180deg, var(--bg-base) 0%, #f7efe7 100%)',
      }}
    >
      <AdminSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        isMobile={isMobile}
        onToggle={() => setSidebarCollapsed((current) => !current)}
        onClose={() => setSidebarOpen(false)}
      />

      <div
        style={{
          marginLeft: sidebarWidth,
          transition: 'margin-left 0.22s ease',
          minHeight: '100vh',
        }}
      >
        <AdminHeader
          isMobile={isMobile}
          onToggleSidebar={() => {
            if (isMobile) {
              setSidebarOpen((current) => !current);
            } else {
              setSidebarCollapsed((current) => !current);
            }
          }}
        />

        <main style={{ padding: isMobile ? '16px 18px 32px' : '18px 24px 40px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
