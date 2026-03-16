function TenantTable() {

  const tenants = [
    { name: "Cafe Aroma", owner: "John", plan: "Pro", status: "Active" },
    { name: "Coffee Hub", owner: "Anna", plan: "Free", status: "Inactive" },
    { name: "Bean Spot", owner: "Mike", plan: "Starter", status: "Active" }
  ];

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Tenant Management</h2>

      <table border="1" cellPadding="10" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Cafe Name</th>
            <th>Owner</th>
            <th>Plan</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {tenants.map((tenant, index) => (
            <tr key={index}>
              <td>{tenant.name}</td>
              <td>{tenant.owner}</td>
              <td>{tenant.plan}</td>
              <td>{tenant.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TenantTable;