// ParentComponent.jsx
import React, { useState } from 'react';
import MapComponent from './MapComponent';
import SelectedBuildingMarker from './SelectedBuildingMarker';

function ParentComponent() {
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  // ...

  // Handle selected building change
  const handleSelectedBuildingChange = (building) => {
    setSelectedBuilding(building);
  };

  return (
    <div>
      {/* ... */}
      <MapComponent
        routeGeometry={routeGeometry}
        userLat={userLat}
        userLng={userLng}
      />
      <SelectedBuildingMarker selectedBuilding={selectedBuilding} />
    </div>
  );
}

export default ParentComponent;