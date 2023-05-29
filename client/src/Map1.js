import React, { useEffect } from 'react';
import L, { Icon } from 'leaflet';
import { MapContainer, TileLayer, Polyline, useMap, Marker, Popup, } from 'react-leaflet';


function ChangeView({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

function MapComponent({ routeGeometry,userLat, userLng  }) {
  const center = [39.86559212247091, 32.73417273791947];
  const zoom = 17;

  const routePositions = routeGeometry.map((coord) => [coord[1], coord[0]]);

  const bounds = routePositions.length > 0 ? L.latLngBounds(routePositions) : null;
  const startPosition = routePositions.length > 0 ? routePositions[0] : null;
  const endPosition = routePositions.length > 0 ? routePositions[routePositions.length - 1] : null;

  const startIcon = new Icon({
    iconUrl: 'assets/logos/location.png',
    iconSize: [24, 24],
    iconAnchor: [12.5, 25],
    popupAnchor: [0, 10],
  });
  
  const endIcon = new Icon({
    iconUrl: 'assets/logos/son.png',
    iconSize: [25, 30],
    iconAnchor: [12.5, 30],
    popupAnchor: [0, -41],
  });
  const currentLocationIcon = new Icon({
    iconUrl: 'assets/logos/full-moon.png',
    iconSize: [15, 15],
    iconAnchor: [12.5, 30],
    popupAnchor: [0, -41],
  });



  return (
    <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%' }}>
      <ChangeView center={center} zoom={zoom} bounds={bounds} />
      <TileLayer
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {routePositions.length > 0 && (
        <Polyline positions={routePositions} color={'red'} dashArray={[10, 5]} weight={3} />
      )}
  
      {startPosition && (
        <Marker position={startPosition} icon={startIcon}>
          <Popup>
            <span>Başlangıç Noktası</span>
          </Popup>
        </Marker>
      )}
  
      {endPosition && (
        <Marker position={endPosition} icon={endIcon}>
          <Popup>
            <span>Bitiş Noktası</span>
          </Popup>
        </Marker>
      )}
      {userLat && userLng && (
        <Marker position={[userLat, userLng]} icon= {currentLocationIcon}>
          <Popup>Şu an Buradasınız.</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

export default MapComponent;