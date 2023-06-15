// SelectedBuildingMarker.jsx
import React from 'react';
import { Marker, Popup, Icon } from 'react-leaflet';

const binaIcon = new Icon({
  iconUrl: 'assets/logos/location.png',
  iconSize: [36, 36],
});

function SelectedBuildingMarker({ selectedBuilding }) {
  if (!selectedBuilding) return null;

  return (
    <Marker position={[selectedBuilding.latitude, selectedBuilding.longitude]} icon={binaIcon}>
      <Popup>
        <span>{selectedBuilding.bina_name}</span>
        <br />
        <p>
          Website: <a href={selectedBuilding.web_site} target="_blank" rel="noopener noreferrer">{selectedBuilding.web_site}</a>
        </p>
      </Popup>
    </Marker>
  );
}

export default SelectedBuildingMarker;