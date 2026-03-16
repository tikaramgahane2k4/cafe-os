import Sidebar from "../../components/superAdmin/Sidebar";
import StatsCard from "../../components/superAdmin/StatsCard";
import TenantTable from "../../components/superAdmin/TenantTable";
import FeatureToggle from "../../components/superAdmin/FeatureToggle";

function Dashboard() {
  return (
    <div style={{ display: "flex" }}>

      <Sidebar />

      <div style={{ marginLeft: "240px", padding: "20px" }}>
        <h1>Super Admin Dashboard</h1>

        <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
          <StatsCard title="Total Cafes" value="120" />
          <StatsCard title="Total Orders" value="32,400" />
          <StatsCard title="Active Users" value="3,200" />
        </div>

        <TenantTable />

        <div style={{ marginTop: "40px" }}>
          <h2>Platform Features</h2>
          <FeatureToggle label="Rewards System" />
          <FeatureToggle label="CRM System" />
          <FeatureToggle label="Review System" />
        </div>

      </div>

    </div>
  );
}

export default Dashboard;