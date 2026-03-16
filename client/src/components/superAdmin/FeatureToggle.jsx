import { useState } from "react";

function FeatureToggle({ label }) {

  const [enabled, setEnabled] = useState(false);

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "15px"
    }}>
      <span>{label}</span>

      <input
        type="checkbox"
        checked={enabled}
        onChange={() => setEnabled(!enabled)}
      />
    </div>
  );
}

export default FeatureToggle;