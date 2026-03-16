function Sidebar() {
  return (
    <div style={{
      width: "220px",
      height: "100vh",
      background: "#1E293B",
      color: "white",
      padding: "20px",
      position: "fixed"
    }}>
      <h2>Cafe-OS</h2>

      <ul style={{ listStyle: "none", padding: 0, marginTop: "30px" }}>
        <li style={{ marginBottom: "20px" }}>Dashboard</li>
        <li style={{ marginBottom: "20px" }}>Tenants</li>
        <li style={{ marginBottom: "20px" }}>Subscriptions</li>
        <li style={{ marginBottom: "20px" }}>Analytics</li>
        <li style={{ marginBottom: "20px" }}>Feature Controls</li>
        <li style={{ marginBottom: "20px" }}>Settings</li>
      </ul>
    </div>
  );
}

export default Sidebar;