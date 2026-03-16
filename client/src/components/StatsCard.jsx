function StatsCard({ title, value }) {
  return (
    <div style={{
      background: "#1E293B",
      padding: "20px",
      borderRadius: "10px",
      color: "white",
      width: "200px"
    }}>
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
}

export default StatsCard;