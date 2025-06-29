// src/config/mapSettings.js

// Çevre değişkenini parse edip [lat, lng] array’ine çevirir
const parseCoords = (str, fallback) => {
  if (!str) str = fallback;
  return str.split(',').map(s => Number(s.trim()));
};

const mapSettings = {
  center:  parseCoords(process.env.REACT_APP_MAP_CENTER,  '39.8672,32.7454'),
  zoom:    Number(process.env.REACT_APP_MAP_ZOOM || 15),
  communityPosition: parseCoords(
    process.env.REACT_APP_COMMUNITY_POS,
    '39.8729723,32.7335556'
  ),
};

export default mapSettings;
