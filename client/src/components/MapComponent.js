// src/components/MapComponent.js

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  GeoJSON,
  useMap,
  Circle,
  useMapEvents,
  Popup as LeafletPopup,
} from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { API_URL } from './config';
import { OSRM_HOST } from './config';
import 'leaflet/dist/leaflet.css';
import { Button, Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
// mevcut require satırının yerine ya da altına ekleyin
import calendarIcon from '../assets/calendar-svgrepo-com.svg';
import DeleteIcon from '@mui/icons-material/Delete';
import ErrorIcon from '@mui/icons-material/Error';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EventCarousel   from './EventCarousel';
import EventDetails from './EventDetails';
import EtkinlikForm from './EtkinlikForm';
import 'swiper/css';
import SchoolIcon from '@mui/icons-material/School';       // seminer
import BuildIcon from '@mui/icons-material/Build';         // workshop
import LocalOfferIcon from '@mui/icons-material/LocalOffer'; 
import { Autocomplete} from '@mui/material';
import * as turf from '@turf/turf';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation, Pagination as SwiperPagination } from 'swiper';
import PropTypes from 'prop-types';
import HataForm from './HataForm';
import blueMarkerIcon from '../assets/marker-icon-blue.png';
import { Checkbox, FormControlLabel } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import toplulukPng from '../assets/topluluk.png';
import EventIcon from '@mui/icons-material/Event';          // Seminer
import MenuBookIcon from '@mui/icons-material/MenuBook';        // Course
import WorkIcon from '@mui/icons-material/Work';                // Career & Entrepreneurship
import ForumIcon from '@mui/icons-material/Forum';              // Symposium
import PaletteIcon from '@mui/icons-material/Palette';          // Cultural & Artistic Events
import mapSettings from './mapSettings'            
import walkingManPng from '../assets/walking-man.png'; // Projende bu dosyayı assets’e ekle
import MapIcon           from '@mui/icons-material/Map';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import { Paper, /* …diğerleri */ } from '@mui/material';
// src/components/MapComponent.js







// ==============================
// 3. Özel İkon Tanımlamaları
// ==============================
const etkinlikIcon = new L.Icon({
  iconUrl: calendarIcon,
  iconSize: [45, 45],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
const walkerIcon = new L.Icon({
  iconUrl: walkingManPng,
  iconSize: [30, 30],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const eventTypeIcons = {
  seminer:                         <SchoolIcon           fontSize="small" sx={{ mr: 1 }} />,
  course:                          <MenuBookIcon         fontSize="small" sx={{ mr: 1 }} />,
  'career and entrepreneurship':  <WorkIcon             fontSize="small" sx={{ mr: 1 }} />,
  symposium:                       <ForumIcon            fontSize="small" sx={{ mr: 1 }} />,
  'cultural and artistic events': <PaletteIcon          fontSize="small" sx={{ mr: 1 }} />,
  workshop:                        <BuildIcon            fontSize="small" sx={{ mr: 1 }} />,
  expo:                            <LocalOfferIcon       fontSize="small" sx={{ mr: 1 }} />,
};
const birimIcon = new L.Icon({
  iconUrl: require('../assets/birim.png'), // Birim ikonunuzun yolunu ekleyin
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});
const bluePinIcon = new L.Icon({
  iconUrl: blueMarkerIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
const BBOX = {
  minLat: 39.859147,
  maxLat: 39.875209,
  minLon: 32.724736,
  maxLon: 32.743655,
};

const groupIcon = (count) => new L.DivIcon({
  html: `<div style="
    background-color: rgba(255, 0, 0, 0.6);
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
  ">
    ${count}
  </div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});
const toplulukIcon = new L.Icon({
  iconUrl: toplulukPng,
  iconSize:   [40, 40],
  iconAnchor: [20, 40],
  popupAnchor:[0, -40],
});
// ==============================
// 4. Yardımcı Bileşenler
// ==============================

// ChangeView Bileşeni
function ChangeView({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}



// ==============================
// 5. Ana MapComponent Bileşeni
// ==============================
const MapComponent = ({
  isLoggedIn,
  userRole,
  userToken,
  startPoint,
  endPoint,
  setStartPoint,
  setEndPoint,
  transportMode,
  selectionMode,
  onMapSelection,
  searchResults,
  setSnackbar,
  selectedBirim,
  setSelectedBirim,
  setSearchResults,
  routeTrigger,
  onRouteDistance,
  currentUserId,
  clearMapTrigger,
  walkerActive,
  setWalkerActive
}) => {
  // ==============================
  // 5.1. Durum (State) Tanımlamaları
  // ==============================
  const toplulukMarkerRef = useRef(null);
  const [hatalar, setHatalar] = useState([]);
  const [birimler, setBirimler] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedHata, setSelectedHata] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [isHataFormOpen, setIsHataFormOpen] = useState(false);
  const [isEtkinlikFormOpen, setIsEtkinlikFormOpen] = useState(false);
  const [selectedEtkinlik, setSelectedEtkinlik] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBirimAddMode, setIsBirimAddMode] = useState(false);
  const [isBirimFormOpen, setIsBirimFormOpen] = useState(false);
  const [newBirimPosition, setNewBirimPosition] = useState(null);
  const [isHataAddMode, setIsHataAddMode] = useState(false);
  const [showEtkinlikler, setShowEtkinlikler] = useState(false);
  const [routeDistance, setRouteDistance] = useState(null);
  const [isStreetViewMode, setIsStreetViewMode] = useState(false);
  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState(null);
  const [showToplulukList, setShowToplulukList] = useState(false);
  const [selectedToplulukEvent, setSelectedToplulukEvent] = useState(null);
  const [boundary, setBoundary] = useState(null);
  const { t } = useTranslation();
  const [newBirimData, setNewBirimData] = useState({
  name: '',
  description: '',
  website: '',
  telefon: ''
 });
const initialWalkerPosition = [39.865564, 32.733942];
const [walkerPosition, setWalkerPosition] = useState(initialWalkerPosition);
const walkerDurations = [5,10];               // dakikalar
const WALKING_SPEED  = 1.0;                   // m/s
const walkerRadii    = walkerDurations.map(min => min * 60 * WALKING_SPEED);
const EARTH_RADIUS   = 6371000;
const isInsideYerleske = (lat, lon) => {
  if (!boundary) return true;            // boundary henüz yüklenmediyse izin ver
  const pt = turf.point([lon, lat]);     // GeoJSON [lng,lat] bekler
  return turf.booleanPointInPolygon(pt, boundary);
};   
// metre cinsinden yarıçaplar
  // Sidebar’dan tetiklenen temizleme
  useEffect(() => {
    // clearMapTrigger her değiştiğinde clearMap’i çağır
    if (clearMapTrigger !== undefined) {
      clearMap();
    }
  }, [clearMapTrigger]);
 // hem sol-click (handleMapClick) hem de sağ-tık (contextmenu) için
 const MapEvents = ({ onMapClick, onContextMenu }) => {
  useMapEvents({
    click: onMapClick,
    contextmenu: (e) => onContextMenu(e.latlng),
  });
  return null;
 };
 
 const handleToplulukMarkerClick = useCallback((e) => {
  const marker = toplulukMarkerRef.current;
  if (!marker) return;

  // e.latlng: tıklandığı yerin koordinatı
  const clickLatLng = e.latlng;
  const markerLatLng = marker.getLatLng();

  // Leaflet LatLng.distanceTo metre cinsinden döner
  const distance = markerLatLng.distanceTo(clickLatLng);

  if (distance < 25) {           // eşiği istediğiniz metreye göre ayarlayın
    setShowToplulukList(true);
  }
 }, []);

  function ContextMenuEvents() {
    useMapEvents({
      // Sağ-tıkta pozisyonu kaydet
      contextmenu: (e) => {
        setContextMenuPos(e.latlng);
      },
      // Haritanın başka bir yerine tıklayınca popup’ı kapat
      click: () => {
        if (contextMenuPos) setContextMenuPos(null);
      }
    });
    return null;
  }
  

  // Etkinlik Düzenleme Durumu
  const [editData, setEditData] = useState({
      title: "",
   date: "",
   time: "",
   location: "",
   event_type: "",
   contact_info: "",
   description: "",
   website: "",
  });

  const [showHatalar, setShowHatalar] = useState(false);
  const [showBirimler, setShowBirimler] = useState(false);

  // Birim Düzenleme Durumu
  const [isBirimEditDialogOpen, setIsBirimEditDialogOpen] = useState(false);
  const [editBirimData, setEditBirimData] = useState({
    name: '',
    description: '',
    website:'',
    telefon:'',
    latitude: '',
    longitude: '',
  });
 const toplulukPos = [39 + 52/60 + 22.7/3600, 32 + 44/60 + 0.8/3600]; // [39.8729723, 32.7335556]
 const LABEL_OFFSET  = 35;
  // Formlar için Seçilen Pozisyon
  const [selectedPosition, setSelectedPosition] = useState(null);

  const mapRef = useRef();

  // Harita Merkez ve Yakınlaştırma Durumu
  const [mapCenter, setMapCenter] = useState(mapSettings.center);; // Ankara koordinatları örnek
  const [mapZoom, setMapZoom] = useState(mapSettings.zoom);

 // Street View açma işleyicisi
 const handleStreetViewOpen = () => {
  setIsStreetViewMode(true);
  setSnackbar({
    open: true,
    message: 'Sokak görünümü için haritadan bir nokta seçin.',
    severity: 'info',
  });
 };
 

  // Yeni: Popup içindeki etkinlik indexini takip etmek için state
  const [activeEtkinlikIndex, setActiveEtkinlikIndex] = useState({});

  // ==============================
  // 5.2. Event Handlers ve Fonksiyonlar
  // ==============================
  // Haritadaki tüm detayları sıfırlar
  const clearMap = () => {
    // 1. Başlangıç / Bitiş noktası
    setStartPoint(null);
    setEndPoint(null);
    onRouteDistance?.(null);
    // 2. Rota
    setRouteData(null);
    setRouteDistance(null);

    // 3. Seçili birim
    setSelectedBirim(null);

    // 4. Arama sonuçları
    setSearchResults([]);

    // 5. Katman görünürlükleri
    setShowEtkinlikler(false);
    setShowBirimler(false);
    setShowHatalar(false);

    // 6. Ek modları kapat
    setIsHataAddMode(false);
    setIsBirimAddMode(false);
    setIsEtkinlikFormOpen(false);
    setIsHataFormOpen(false);

    setSnackbar({
      open: true,
      message: 'Harita temizlendi.',
      severity: 'info',
    });
  };

  const handleSelectEvent = (etkinlik) => {
    if (etkinlik.latitude && etkinlik.longitude) {
      // Haritanın merkezini etkinliğin konumuna kaydır
      setMapCenter([etkinlik.latitude, etkinlik.longitude]);
      setMapZoom(20); // İstediğiniz yakınlaştırma seviyesini ayarlayın

      // Ayrıca, etkinlik detaylarını göstermek için bir dialog açabilirsiniz
      setSelectedEtkinlik(etkinlik);
      setIsEditDialogOpen(true); // Bu durumu yönetmek için mevcut dialog state'lerinizi kullanabilirsiniz
    } else {
      console.warn('Seçilen etkinliğin geçerli koordinatları yok:', etkinlik);
    }
  };

  const handleNewBirimChange = (e) => {
  const { name, value } = e.target;
  setNewBirimData(prev => ({ ...prev, [name]: value }));
};

const handleAddBirimSubmit = async () => {
  const { name, description, website, telefon } = newBirimData;
  if (!name) {
    return setSnackbar({ open: true, message: 'Ad gereklidir.', severity: 'warning' });
  }
  const { lat, lng } = newBirimPosition;
  try {
    const { data } = await axios.post(
      `${API_URL}/birimler`,
      { name, description, latitude: lat, longitude: lng, website, telefon },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    if (data.success) {
      setBirimler(prev => [...prev, data.birim]);
      setSnackbar({ open: true, message: 'Birim başarıyla eklendi.', severity: 'success' });
      setIsBirimFormOpen(false);
      setNewBirimData({ name: '', description: '', website: '', telefon: '' });
      setNewBirimPosition(null);
    }
  } catch (err) {
    setSnackbar({ open: true, message: err.response?.data?.message || 'Birim eklenirken hata oluştu.', severity: 'error' });
  }
};

const handleEditBirimChange = (e) => {
  const { name, value } = e.target;
  setEditBirimData(prev => ({ ...prev, [name]: value }));
};

const handleEditBirimSubmit = async () => {
  const { name, description, website, telefon, latitude, longitude } = editBirimData;
  if (!name || !latitude || !longitude) {
    return setSnackbar({ open: true, message: 'Ad, enlem ve boylam gereklidir.', severity: 'warning' });
  }
  try {
    const { data: updated } = await axios.put(
      `${API_URL}/birimler/${selectedBirim.id}`,
      { name, description, latitude: parseFloat(latitude), longitude: parseFloat(longitude), website, telefon },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    setSnackbar({ open: true, message: 'Birim başarıyla güncellendi.', severity: 'success' });
    setIsBirimEditDialogOpen(false);
    setBirimler(prev => prev.map(b => b.id === updated.id ? { ...b, ...updated } : b));
    if (selectedBirim.id === updated.id) setSelectedBirim(updated);
  } catch (err) {
    setSnackbar({ open: true, message: err.response?.data?.message || 'Güncelleme hatası.', severity: 'error' });
  }
};

  // Etkinlik Düzenleme Fonksiyonları
  const handleEditEvent = (etkinlik) => {
    if (!etkinlik) {
      setSnackbar({ open: true, message: 'Etkinlik verisi bulunamadı.', severity: 'error' });
      return;
    }
    setEditData({
      Etkinlik_Adı: etkinlik.Etkinlik_Adı || '',
      Tarih: etkinlik.Tarih || '',
      Saat: etkinlik.Saat || '',
      Yer: etkinlik.Yer || '',
      Etkinlik_Türü: etkinlik.Etkinlik_Türü || '',
      iletişim_bilgileri: etkinlik.iletişim_bilgileri || '',
      Açıklama: etkinlik.Açıklama || '',
    });
    setSelectedEtkinlik(etkinlik);
    setIsEditDialogOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleEditSubmit = async () => {
    const etkinlikId = selectedEtkinlik?.etkinlik_id;
    console.log('Selected Etkinlik ID:', etkinlikId);

    if (!etkinlikId) {
      setSnackbar({ open: true, message: 'Etkinlik ID bulunamadı.', severity: 'error' });
      return;
    }

    const { Etkinlik_Adı, Tarih, Saat, Yer, Etkinlik_Türü, iletişim_bilgileri, Açıklama } = editData;

    if (!Etkinlik_Adı || !Tarih || !Yer || !Etkinlik_Türü || !iletişim_bilgileri || !Açıklama) {
      setSnackbar({ open: true, message: 'Tüm alanları doldurmanız gerekmektedir.', severity: 'warning' });
      return;
    }

    const data = {
      Etkinlik_Adı, // API'nizin gereksinimlerine göre düzenleyin
      Tarih,
      Saat: Saat || null,
      Yer,
      Etkinlik_Türü,
      iletişim_bilgileri,
      Açıklama,
      latitude: selectedEtkinlik.latitude,
      longitude: selectedEtkinlik.longitude,
    };

    console.log('Gönderilen Veri:', data);

    try {
      const response = await axios.put(
        `${API_URL}/api/events/${etkinlikId}`,
        data, // Axios otomatik olarak JSON'a çevirir
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Güncellenmiş Etkinlik:', response.data);
      setSnackbar({ open: true, message: 'Etkinlik başarıyla güncellendi.', severity: 'success' });
      setIsEditDialogOpen(false);

      // Güncellenmiş etkinliği mevcut etkinliklerle güncelle
      const updatedEtkinlik = response.data;
      setEvents((prevEtkinlikler) =>
        prevEtkinlikler.map((etkinlik) =>
          etkinlik.etkinlik_id === updatedEtkinlik.etkinlik_id
            ? { ...etkinlik, ...updatedEtkinlik }
            : etkinlik
        )
      );
    } catch (error) {
      console.error('Etkinlik güncellenirken bir hata oluştu:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Etkinlik güncellenirken bir hata oluştu.',
        severity: 'error',
      });
    }
  };
 // MapComponent fonksiyon gövdesi içinde:
  const handleGoHere = (etkinlik) => {
  if (etkinlik.latitude != null && etkinlik.longitude != null) {
    onMapSelection('end', {
      display_name: etkinlik.Etkinlik_Adı || etkinlik.Yer,
      lat: etkinlik.latitude,
      lng: etkinlik.longitude,
    });
    setSnackbar({
      open: true,
      message: `${etkinlik.Etkinlik_Adı} noktasına gidiliyor.`,
      severity: 'info',
    });
  }
  };

  // ==============================
  // 5.3. Veri Çekme Fonksiyonları (useCallback ile)
  // ==============================

  const fetchHatalar = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/hatalar`
, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      // API artık sadece active = true kayıtları döndürüyor
    const validHatalar = response.data.filter((hata) => {
      const lat = parseFloat(hata.latitude);
      const lng = parseFloat(hata.longitude);
      return (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    });
    setHatalar(validHatalar);
    console.log('Hatalar yüklendi:', validHatalar);
  } catch (error) {
    console.error('Hatalar yüklenirken bir sorun oluştu:', error);
    setSnackbar({ open: true, message: 'Hatalar yüklenirken bir sorun oluştu.', severity: 'error' });
  }
}, [userToken, setSnackbar]);

  const fetchBirimler = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/birimler`
);
      const validBirimler = response.data
        .filter((birim) => {
          const lat = parseFloat(birim.latitude);
          const lng = parseFloat(birim.longitude);
          return (
            !isNaN(lat) &&
            !isNaN(lng) &&
            lat >= -90 &&
            lat <= 90 &&
            lng >= -180 &&
            lng <= 180
          );
        })
        .map((birim) => ({
          ...birim,
        }));
         validBirimler.sort((a, b) =>
      a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
    );
      setBirimler(validBirimler);
      console.log('Birimler yüklendi:', validBirimler);
    } catch (error) {
      console.error('Birimler yüklenirken bir sorun oluştu:', error);
      setSnackbar({ open: true, message: 'Birimler yüklenirken bir sorun oluştu.', severity: 'error' });
    }
  }, [setSnackbar]);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/events`
, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });
      const validEvents = response.data.filter((etkinlik) => {
        const lat = parseFloat(etkinlik.latitude);
        const lng = parseFloat(etkinlik.longitude);
        return (
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180
        );
      });
      setEvents(validEvents);
      console.log('events yüklendi:', validEvents);
    } catch (error) {
      console.error('events yüklenirken bir sorun oluştu:', error);
      setSnackbar({ open: true, message: 'events yüklenirken bir sorun oluştu.', severity: 'error' });
    }
  }, [userToken, setSnackbar]);

  const hataIcon = new L.Icon({
    iconUrl: require('../assets/hata.png'), // Hata ikonunuzun yolu
    iconSize: [25, 28],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });
  const geocodeAddress = useCallback(async (address, type) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          addressdetails: 1,
          limit: 1,
        },
      });
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
      } else {
        throw new Error('Adres bulunamadı');
      }
    } catch (error) {
      console.error(`${type} adresi geocode edilirken bir hata oluştu:`, error);
      throw error;
    }
  }, []);
 // MapComponent.js içinde import’ların hemen altı:




const calculateRoute = useCallback(async (start, end, mode) => {

  try {
    // Koordinatları hazırla
    const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;

    // mode'a göre tek bir profile ismi üret
    const profile = 
      mode === 'walking' ? 'foot' :
      mode === 'cycling'  ? 'bicycle' :
      /* driving */        'car';
    const port =
      profile === 'foot'    ? 5000 :
      profile === 'car'     ? 5002 :
                              5001;  // bicycle
    // Tek segment'li URL  
    const url = 
      `/route/v1/${profile}/${coords}` +
      `?overview=full&geometries=geojson`

    console.log('Rota Hesaplama URL:', url);

    const { data } = await axios.get(url);
    console.log('Rota hesaplama yanıtı:', data);

    if (data.routes?.length) {
      const { geometry, distance } = data.routes[0];
      setRouteData(geometry);
      setRouteDistance(distance);
      onRouteDistance?.(distance);

      // Haritayı rota sınırlarına sığdır
      const bounds = L.geoJSON(geometry).getBounds();
      mapRef.current?.fitBounds(bounds, { maxZoom: 18, padding: [50, 50] });
    } else {
      setSnackbar({ open: true, message: 'Rota bulunamadı.', severity: 'warning' });
      onRouteDistance?.(null);
    }
  } catch (err) {
    console.error('Rota hesaplama hatası:', err);
    setSnackbar({ open: true, message: 'Rota hesaplanırken hata.', severity: 'error' });
    onRouteDistance?.(null);
  }
}, []);
 useEffect(() => {
  // Eğer başlangıç ya da bitiş noktası yoksa,
  // mevcut rotayı ve mesafe bilgisini temizle
  if (!startPoint || !endPoint) {
    setRouteData(null);
    setRouteDistance(null);
    onRouteDistance?.(null);
  }
}, [startPoint, endPoint]);


  // ==============================
  // 5.4. useEffect Hook'ları
  // ==============================

  // Başlangıçta Veri Çekme
  useEffect(() => {
    if (userRole === 'personel_admin' || userRole === 'student_admin'|| userRole === 'supervisor') {
      fetchHatalar();
    }
    fetchBirimler();
    fetchEvents();
        // boundary.geojson’u public klasöründen al
   // boundary yükleme kısmında
 fetch(`${process.env.PUBLIC_URL}/data/boundaries.geojson`)
  .then(res => res.json())
  .then(json => {
    // json bir FeatureCollection, biz polygon feature’ı alıyoruz
    const polygonFeature = Array.isArray(json.features) ? json.features[0] : json;
    setBoundary(polygonFeature);
  })
  .catch(err => console.error('Boundary load error', err));

  }, [userRole, fetchHatalar, fetchBirimler, fetchEvents]);

  // Seçili Birime Göre Harita Merkezini Güncelle
  useEffect(() => {
    if (selectedBirim) {
      const { latitude, longitude } = selectedBirim;
      if (latitude != null && longitude != null) {
        const latNum = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
        const lngNum = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

        if (
          typeof latNum === 'number' &&
          typeof lngNum === 'number' &&
          latNum >= -90 &&
          latNum <= 90 &&
          lngNum >= -180 &&
          lngNum <= 180
        ) {
          const desiredZoomLevel = 15; // İstenen yakınlaştırma seviyesi
          setMapCenter([latNum, lngNum]);
          setMapZoom(desiredZoomLevel);

          setSnackbar({
            open: true,
            message: `${selectedBirim.name} noktasına gidiliyor.`,
            severity: 'info',
          });
        } else {
          console.warn('Geçersiz koordinatlar:', latNum, lngNum);
        }
      } else {
        console.warn('Seçilen birimin latitude veya longitude değeri eksik:', selectedBirim);
      }
    }
  }, [selectedBirim, setSnackbar]);

  // Rota Hesaplama
  useEffect(() => {
    const getRoute = async () => {
      if (startPoint && endPoint && transportMode) {
        console.log('Rota Hesaplanıyor:');
        console.log('Başlangıç Noktası:', startPoint);
        console.log('Bitiş Noktası:', endPoint);
        console.log('Vasıta Türü:', transportMode);

        try {
          let startCoord = { lat: startPoint.lat, lng: startPoint.lng };
          let endCoord = { lat: endPoint.lat, lng: endPoint.lng };

          // Koordinatlar eksikse geocode et
          if ((!startCoord.lat || !startCoord.lng) && startPoint.display_name) {
            startCoord = await geocodeAddress(startPoint.display_name, 'start');
          }

          if ((!endCoord.lat || !endCoord.lng) && endPoint.display_name) {
            endCoord = await geocodeAddress(endPoint.display_name, 'end');
          }

          console.log('Rota Koordinatları:', startCoord, endCoord);
          await calculateRoute(startCoord, endCoord, transportMode);
        } catch (err) {
          console.error('Rota hesaplanırken bir hata oluştu:', err);
          setSnackbar({ open: true, message: 'Rota hesaplanırken bir sorun oluştu.', severity: 'error' });
        }
      }
    };

    getRoute();
  }, [startPoint, endPoint, transportMode, calculateRoute, setSnackbar, geocodeAddress]);

  // ==============================
  // 5.5. Harita Üzerinde Tıklama İşlemleri
  // ==============================
  // Haversine Formülü ile iki nokta arasındaki mesafeyi kilometre cinsinden hesaplar
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Mesafe (km)
    return d;
  };

  const groupEventsByDistance = (events, distanceThreshold = 0.075) => { // distanceThreshold km cinsinden
    const groups = [];
    const visited = new Array(events.length).fill(false);

    for (let i = 0; i < events.length; i++) {
      if (visited[i]) continue;

      const group = [events[i]];
      visited[i] = true;

      for (let j = i + 1; j < events.length; j++) {
        if (visited[j]) continue;

        const distance = getDistanceFromLatLonInKm(
          events[i].latitude,
          events[i].longitude,
          events[j].latitude,
          events[j].longitude
        );

        if (distance <= distanceThreshold) {
          group.push(events[j]);
          visited[j] = true;
        }
      }

      groups.push(group);
    }

    return groups;
  };

  // Mevcut iki tanımlamayı kaldırın ve aşağıdaki tek tanımlamayı kullanın:

  const handleMapClick = (e) => {
    if (isStreetViewMode) {
      const { lat, lng } = e.latlng;
      if (lat != null && lng != null) {
        // Seçilen koordinatlarla Yandex Haritalar URL’sini oluştur
        const yandexUrl = `https://yandex.com.tr/harita/11503/ankara/?l=stv%2Csta&ll=${lng}%2C${lat}&panorama%5Bpoint%5D=${lng}%2C${lat}&z=15`;
        
        // Yeni sekmede aç
        window.open(yandexUrl, '_blank');

        // Modu kapat ve bilgi ver
        setIsStreetViewMode(false);
        setSnackbar({
          open: true,
          message: 'Yandex Haritalar Sokak Görünümü açılıyor...',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Geçersiz koordinatlar seçildi.',
          severity: 'error',
        });
      }
    } else if (isBirimAddMode) {
      const { lat, lng } = e.latlng;
      setNewBirimPosition({ lat, lng });
      setIsBirimFormOpen(true);
      setIsBirimAddMode(false);
      setSnackbar({ open: true, message: 'Yeni birim için bilgileri girin.', severity: 'info' });
    } else if (isHataAddMode) {
      const { lat, lng } = e.latlng;
      setSelectedHata({ lat, lng });
      setIsHataFormOpen(true);
      setIsHataAddMode(false);
      setSnackbar({ open: true, message: 'Yeni hata için bilgileri girin.', severity: 'info' });
    } else if (selectionMode === 'start' || selectionMode === 'end') {
      const { lat, lng } = e.latlng;
            if (!isInsideYerleske(lat, lng)) {
        setSnackbar({
          open: true,
          message: 'Beytepe Yerleşkesi dışında rotalama hizmeti çalışmaz. Lütfen Yerleşke içinden noktalar seçiniz!',
          severity: 'warning',
        });
        return;
      }
      axios
        .get('https://nominatim.openstreetmap.org/reverse', {
          params: { lat, lon: lng, format: 'json' },
        })
        .then((response) => {
          const display_name = response.data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;
          const point = { display_name, lat, lng };
          onMapSelection(selectionMode, point);
          setSnackbar({
            open: true,
            message: `${selectionMode === 'start' ? 'Başlangıç' : 'Bitiş'} noktası seçildi.`,
            severity: 'success',
          });
        })
        .catch((error) => {
          console.error('Reverse geocoding error:', error);
          setSnackbar({ open: true, message: 'Seçilen noktayı tanımlarken bir hata oluştu.', severity: 'error' });
        });
    }  else if (( userRole === 'supervisor'|| userRole === 'etkinlik') && isEtkinlikFormOpen) {

      const { lat, lng } = e.latlng;
      setSelectedPosition({ lat, lng });
      setIsEtkinlikFormOpen(true);
    }
  };


  // ==============================
  // 5.6. Birim Marker'ının Sürüklenmesi Sonrası İşlemler
  // ==============================

  const handleBirimDragEnd = async (e, birim) => {
    const { lat, lng } = e.target.getLatLng();
    console.log(`Marker dragged to new position: ${lat}, ${lng}`);

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    if (isNaN(latNum) || isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      setSnackbar({
        open: true,
        message: 'Geçerli koordinatlar giriniz.',
        severity: 'warning',
      });
      return;
    }

    try {
      // Birimin yeni koordinatlarını API üzerinden güncelle
      const response = await axios.put(
        `${API_URL}/birimler/${birim.id}`,
        {
          name: birim.name,
          description: birim.description,
          latitude: latNum,
          longitude: lngNum,
        },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Birim konumu güncellendi:', response.data);
      setSnackbar({ open: true, message: 'Birim konumu başarıyla güncellendi.', severity: 'success' });

      // Güncellenmiş birimi mevcut birimler içinde güncelle
      const updatedBirim = response.data;
      setBirimler((prevBirimler) =>
        prevBirimler.map((b) =>
          b.id === updatedBirim.id
            ? { ...b, ...updatedBirim, latitude: latNum, longitude: lngNum }
            : b
        )
      );

      // Seçili birim sürüklenen birimse güncelle
      if (selectedBirim && selectedBirim.id === birim.id) {
        setSelectedBirim((prevBirim) => ({
          ...prevBirim,
          ...updatedBirim,
          latitude: latNum,
          longitude: lngNum,
        }));
      }
    } catch (error) {
      if (error.response) {
        // Sunucu 2xx dışı bir durum kodu döndürdü
        console.error('API Hatası:', error.response.data);
        setSnackbar({ open: true, message: `Hata: ${error.response.data.message || 'Bilinmeyen bir hata oluştu.'}`, severity: 'error' });
      } else if (error.request) {
        // İstek yapıldı ama yanıt alınamadı
        console.error('Sunucu Yanıt Vermiyor:', error.request);
        setSnackbar({ open: true, message: 'Sunucu yanıt vermiyor.', severity: 'error' });
      } else {
        // Diğer hatalar
        console.error('Hata:', error.message);
        setSnackbar({ open: true, message: `Hata: ${error.message}`, severity: 'error' });
      }
    }
  };

  // Birim Düzenleme İkonuna Tıklama
  const handleEditIconClick = () => {
    if (selectedBirim) {
      setEditBirimData({
        name: selectedBirim.name || '',
        description: selectedBirim.description || '',
        latitude: selectedBirim.latitude || '',
        longitude: selectedBirim.longitude || '',
      });
      setIsBirimEditDialogOpen(true);
    }
  };

  // Hataları Göster/Gizle Butonu
  const toggleShowHatalar = () => {
    setShowHatalar((prev) => !prev);
  };

  // Birimleri Göster/Gizle Butonu
  const toggleShowBirimler = () => {
    setShowBirimler((prev) => !prev);
  };

const getRouteMidpoint = (geoJsonData) => {
  const coordinates = geoJsonData.coordinates; // GeoJSON'dan koordinat dizisini al
  if (!coordinates || coordinates.length === 0) return [0, 0];

  const midIndex = Math.floor(coordinates.length / 2); // Orta indeksi bul
  const midCoord = coordinates[midIndex]; // Orta koordinatı al [lng, lat]

  return [midCoord[1], midCoord[0]]; // Leaflet için [lat, lng] formatına çevir
};
  // "Etkinlik Ekle" Butonu
  const handleAddEtkinlikClick = async () => {
    // personel_admin → kendi biriminin koordinatını al
    if (userRole === 'personel_admin') {
      try {
        const { data: birim } = await axios.get(
          `${API_URL}/birimler/me`,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setSelectedPosition({ lat: birim.latitude, lng: birim.longitude });
        setIsEtkinlikFormOpen(true);
      } catch {
        setSnackbar({ open: true, message: 'Birim bilgisi alınamadı.', severity: 'error' });
      }
      return;
    }

    // student_admin → sabit “Öğrenci Toplulukları” noktasına al
    if (userRole === 'student_admin') {
      const [lat, lng] = mapSettings.communityPosition;
      setSelectedPosition({ lat, lng });
      setIsEtkinlikFormOpen(true);
      return;
    }

    // supervisor → haritadan tıklayacak
    if (userRole === 'supervisor'|| userRole === 'etkinlik') {
      setIsEtkinlikFormOpen(true);
      setSnackbar({
        open: true,
        message: 'Etkinlik eklemek için haritaya tıklayın.',
        severity: 'info',
      });
    }
  };

  // Birim Silme
  const handleDeleteBirim = async (birimId) => {
    if (window.confirm('Bu birimi silmek istediğinizden emin misiniz?')) {
      try {
        await axios.delete(`${API_URL}/birimler/${birimId}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });
        setSnackbar({ open: true, message: 'Birim başarıyla silindi.', severity: 'success' });
        // Silinen birimi mevcut birimler içinden çıkar
        setBirimler((prevBirimler) => prevBirimler.filter((birim) => birim.id !== birimId));
        // Silinen birim seçiliyse seçimi temizle
        if (selectedBirim && selectedBirim.id === birimId) {
          setSelectedBirim(null);
        }
      } catch (error) {
        console.error('Birim silinirken bir sorun oluştu:', error);
        setSnackbar({ open: true, message: 'Birim silinirken bir sorun oluştu.', severity: 'error' });
      }
    }
  };

  // ==============================
  // 5.9. useMemo ile Etkinlikleri Gruplandırma
  // ==============================
  const groupedEvents = useMemo(() => {
    return groupEventsByDistance(events);
  }, [events]);
  // ==============================
  // 5.10. JSX Render Bölümü
  // ==============================
  return (
    <>
    <Box
  sx={{
    position: 'absolute',
    top: 10,
    left: 50,
    zIndex: 1000,
    background: 'rgba(255,255,255,0.9)',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
  }}
>
  {/* ① Arama Kutucuğu */}
 <Paper
  elevation={3}
  sx={{
    position: 'absolute',
    top: 10,
    left: 50,
    zIndex: 1000,
    p: 1,             // 16px padding
    borderRadius: 2,  // 16px köşe yuvarlama
    bgcolor: 'rgba(255,255,255,0.95)',
    minWidth: 240,
  }}
>
<Box
  sx={{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    width: '100%',
  }}
>
  {/* ① Arama Kutusu */}
  <Box sx={{ flex: 1, minWidth: 240 }}>
    <Autocomplete
      size="small"
      options={birimler}
      getOptionLabel={(opt) => opt.name}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={t('searchInUnits')}
          variant="outlined"
          InputProps={{ ...params.InputProps, style: { padding: '4px 8px' } }}
          fullWidth
        />
      )}
      onChange={(_, birim) => {
        if (birim) {
          setSelectedBirim(birim);
          setMapCenter([birim.latitude, birim.longitude]);
          setMapZoom(15);
          setSnackbar({
            open: true,
            message: `${birim.name} noktasına gidiliyor.`,
            severity: 'info',
          });
        }
      }}
    />
  </Box>
      
  {/* ② Kontrol Kutuları */}
  <List disablePadding sx={{ display: 'flex', flexDirection: 'row', p: 0 }}>
    {[
          {
      key: 'events',
      label: t('events'),
      checked: showEtkinlikler,
      onToggle: () => setShowEtkinlikler(s => !s),
      // yalnızca personel_admin, student_admin veya supervisor için "+"
      withAdd: ['personel_admin','student_admin','supervisor','etkinlik'].includes(userRole),
      onAdd: handleAddEtkinlikClick,
    },
    {
        key: 'hatalar',
        label: t('hatalar'),
        checked: showHatalar,
        onToggle: () => setShowHatalar((s) => !s),
        roles: ['student_admin','personel_admin','supervisor'],
        withAdd: true,
        onAdd: () => setIsHataAddMode(true),
      },
      {
        key: 'units',
        label: t('units'),
        checked: showBirimler,
        onToggle: () => setShowBirimler((s) => !s),
        withAdd: userRole === 'supervisor',
        onAdd: () => setIsBirimAddMode(true),
      },
      
    ].map(({ key, label, checked, onToggle, roles, withAdd, onAdd }) => {
      // Eğer roles tanımlıysa ve kullanıcı rolü uygun değilse atla
      if (roles && !roles.includes(userRole)) return null;
      return (
        <ListItem key={key} disablePadding sx={{ width: 'auto', pr: 1 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Checkbox
              checked={checked}
              onChange={onToggle}
              sx={{ color: 'black', '&.Mui-checked': { color: 'black' } }}
            />
          </ListItemIcon>
          <ListItemText primary={label} />
          {withAdd && (
                <IconButton
      size="small"
      onClick={onAdd}
      sx={{
        ml: 0.5,               // ikon ile label arası boşluk
        p: 0.5,               // iç boşluk
          color: 'black',
        borderRadius: 1,
        '&:hover': {
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
        }
      }}
    >
      <AddCircleOutlineIcon fontSize="small" />
    </IconButton>
          )}
          {/* listeyi ayırmak için dikey çizgi */}
        </ListItem>
      );
    })}
  </List>
</Box>
</Paper>
</Box> 
      {/* ==============================
      5.7.1. Kontrol Butonları
      ============================== */}
          {/* "Add Event" Button - Only for Admins */}


      {/* "Street View Aç" Butonu */}
      <Button
  onClick={handleStreetViewOpen}
  startIcon={<MapIcon />}
  variant="contained"
  color="inherit"
  sx={{
    position: 'absolute',
    bottom: 80,
    right: 20,
    zIndex: 2000,
    borderRadius: 2,
    boxShadow: 3,
    p: 1,
    bgcolor: 'rgba(255,255,255,0.8)',
    '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
    minWidth: 182
  
  }}
>
  {t('street_view')}
</Button>
      {/* ==============================
      5.7.2. MapContainer ve İçeriği
      ============================== */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100vh', width: '100%' }}
        whenCreated={(mapInstance) => {
          console.log('Map instance created');
          mapRef.current = mapInstance;
        }}
      >
        {contextMenuPos && (
  <Popup
    position={[contextMenuPos.lat, contextMenuPos.lng]}
    closeButton={false}
    autoPan={false}
    onClose={() => setContextMenuPos(null)}
  >
    <Button
      size="small"
      variant="outlined"
      sx={{
        color: 'black',       // Yazı rengi siyah
        borderColor: 'black', // İsterseniz border da siyah olur
        textTransform: 'none' // Yazının tamamını olduğu gibi gösterir
      }}
      onClick={() => {
        onMapSelection('end', {
          display_name: `Lat: ${contextMenuPos.lat.toFixed(6)}, Lng: ${contextMenuPos.lng.toFixed(6)}`,
          lat: contextMenuPos.lat,
          lng: contextMenuPos.lng,
        });
        setContextMenuPos(null);
      }}
    >
      {t('goto_here')}
    </Button>
  </Popup>
 )}
 {walkerActive && (
  <>
    {/* — Walkeri sürüklenebilir marker olarak ekle — */}
    <Marker
      position={walkerPosition}
      icon={walkerIcon}
      draggable={true}
      eventHandlers={{
        dragend: e => {
          const { lat, lng } = e.target.getLatLng();
          setWalkerPosition([lat, lng]);
        }
      }}
    />

    {/* — Her çember için: çiz, sonra label marker’ı koy — */}
    {walkerDurations.map((min, idx) => {
      const radius = walkerRadii[idx];

      // Çemberin kuzey ucunun koordinatını hesapla
      const latOffset = ((radius + LABEL_OFFSET) / EARTH_RADIUS) * (180 / Math.PI);
      const labelLat = walkerPosition[0] + latOffset;
      const labelLng = walkerPosition[1];

      return (
        <React.Fragment key={min}>
          <Circle
            center={walkerPosition}
            radius={radius}
            pathOptions={{
              color: 'maroon',
              dashArray: '6,10',
              fill: false
            }}
          />
          <Marker
            position={[labelLat, labelLng]}
            interactive={false}
            icon={new L.DivIcon({
              className: '',
              html: `<div style="
                font-size:12px;
                font-weight:bold;
                color:maroon;
                background:none;
                white-space: nowrap;
              ">${min} ${t('minutes')}</div>`
            })}
          />
        </React.Fragment>
      );
    })}
  </>
)}


        {/* Change View Component ile merkez ve zoom güncelleme */}
        <ChangeView center={mapCenter} zoom={mapZoom} />
        <ContextMenuEvents />
        {/* Harita Katmanı */}
        <TileLayer
           attribution={
            isSatelliteView
              ? 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              : '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          }
          url={
            isSatelliteView
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          }
        />

        {/* ==============================
        5.7.2.1. Hatalar (Admin için ve Hatalar Göster Butonuyla Kontrol Ediliyor)
        ============================== */}
        {(userRole === 'personel_admin' || userRole === 'student_admin'|| userRole === 'supervisor') && showHatalar &&
          hatalar.map((hata) => {
    const { id, creator_name, creator_surname, update_type, description, latitude, longitude, record_time } = hata;
    if (isNaN(latitude) || isNaN(longitude)) return null;
    return (
      <Marker key={id} position={[latitude, longitude]} icon={hataIcon}>
        <Popup>
          <Typography variant="subtitle2">
            {update_type}
          </Typography>
          <Typography variant="body2">
            {description}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {`Ekleyen: ${creator_name} ${creator_surname} • ${new Date(record_time).toLocaleString()}`}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <IconButton
              color="primary" size="small"
              onClick={() => {
                setSelectedHata(hata);
                setIsHataFormOpen(true);
              }}
              title="Hata Düzenle"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color="secondary" size="small"
              onClick={async () => {
                if (window.confirm('Bu hatayı silmek istediğinizden emin misiniz?')) {
                  try {
                    await axios.delete(`${API_URL}/hatalar/${id}`, {
                      headers: { Authorization: `Bearer ${userToken}` }
                    });
                    setSnackbar({ open: true, message: 'Hata başarıyla silindi.', severity: 'success' });
                    setHatalar(prev => prev.filter(h => h.id !== id));
                  } catch (err) {
                    console.error(err);
                    setSnackbar({ open: true, message: 'Silme sırasında hata!', severity: 'error' });
                  }
                }
              }}
              title="Hata Sil"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Popup>
      </Marker>
    );
  })
}



  {routeData && (
  <>
    <GeoJSON
      data={routeData}
      style={{ color: 'red', weight: 5 }} // Çizgi stilini ayarlayabilirsiniz
    />




  </>
 )}
    {/* Yeni Birim Ekleme Formu Dialog'u */}
  {isBirimFormOpen && newBirimPosition && (
  <Dialog
    open={isBirimFormOpen}
    onClose={() => setIsBirimFormOpen(false)}
    fullWidth
    maxWidth="sm"
    disablePortal
  >
    <DialogTitle>{t('add_unit')}</DialogTitle>
    <DialogContent>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
      >
        <TextField
          label={t('name')}
          name="name"
          value={newBirimData.name}
          onChange={handleNewBirimChange}
          required
          fullWidth
        />
        <TextField
          label={t('description')}
          name="description"
          value={newBirimData.description}
          onChange={handleNewBirimChange}
          multiline
          rows={2}
          fullWidth
        />
        <TextField
          label={t('website')}
          name="website"
          value={newBirimData.website}
          onChange={handleNewBirimChange}
          fullWidth
        />
        <TextField
          label={t('telephone')}
          name="telefon"
          value={newBirimData.telefon}
          onChange={handleNewBirimChange}
          fullWidth
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('location')}: {newBirimPosition.lat.toFixed(6)}, {newBirimPosition.lng.toFixed(6)}
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions sx={{ pr: 3, pb: 2 }}>
      <Button onClick={() => setIsBirimFormOpen(false)}>
        {t('cancel')}
      </Button>
      <Button onClick={handleAddBirimSubmit} variant="contained">
        {t('add')}
      </Button>
    </DialogActions>
  </Dialog>
  )}
    {/* "Hata Ekle" Butonu - Sadece Adminler için */}
  {( userRole === 'personel_admin' || userRole === 'student_admin'|| userRole === 'supervisor') && (
  <Box sx={{ position: 'absolute', top: 250, left: 10, zIndex: 1000 }}>
  </Box>
)}

  <Button
  onClick={() => setIsSatelliteView(prev => !prev)}
  startIcon={<SatelliteAltIcon />}
  variant="contained"
  color="inherit"
  sx={{
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 2000,
    borderRadius: 2,
    boxShadow: 3,
    p: 1,
    bgcolor: 'rgba(255,255,255,0.8)',
    '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
    minWidth: 182
  }}
>
  {isSatelliteView ? t('standart_page') : t('satellite_page')}
</Button>





        {/* ==============================
        5.7.2.2. Birimler (Göster/Gizle Butonuyla Kontrol Ediliyor)
        ============================== */}
       {showBirimler && birimler.map((birim) => (
  <Marker
    key={birim.id}
    position={[birim.latitude, birim.longitude]}
    icon={birimIcon}
    draggable={userRole === 'personel_admin' || userRole === 'student_admin' || userRole === 'supervisor'}
    eventHandlers={{ dragend: (e) => handleBirimDragEnd(e, birim) }}
  >
    <Popup>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b>{birim.name}</b>
        {userRole === 'personel_admin' || userRole === 'student_admin'|| userRole === 'supervisor' && (
          <>
            <IconButton size="small" onClick={() => { setSelectedBirim(birim); handleEditIconClick(); }} title="Birim Düzenle">
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => handleDeleteBirim(birim.id)} title="Birim Sil">
              <DeleteIcon />
            </IconButton>
          </>
        )}
      </Box>
      <Divider sx={{ my: 1 }} />

      {/* — Mevcut description yerine website gösterimi — */}
      {birim.website && (
          <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      mb: 0.5,
      // İsterseniz Box’a da eklersiniz:
       wordBreak: 'break-all',
       overflowWrap: 'break-word',
    }}
  >
          <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Link
            href={birim.website.startsWith('http') ? birim.website : `https://${birim.website}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
          >
            {birim.website}
          </Link>
        </Box>
      )}

      {/* — Telefon numarası — */}
      {birim.telefon && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">{birim.telefon}</Typography>
        </Box>
      )}
    </Popup>
  </Marker>
))}
 
        {/* ==============================
        5.7.2.3. events (Gruplandırılmış)
        ============================== */}
        {showEtkinlikler && 
          groupedEvents
          .filter(group => group[0].creator_role !== 'student_admin')
          .map((etkinlikGroup, index) => {
          const { latitude, longitude } = etkinlikGroup[0];
          const etkinlik = etkinlikGroup[0]; 

          // Sadece koordinatları kontrol et
          if (
            typeof latitude !== 'number' ||
            typeof longitude !== 'number' ||
            isNaN(latitude) ||
            isNaN(longitude)
          ) {
            console.warn(`Geçersiz koordinatlar için etkinlik grubu ID: ${index}`, etkinlikGroup);
            return null;
          }

          const isMultiple = etkinlikGroup.length > 1;

          return (
            <Marker
              key={`etkinlik-group-${index}`}
              position={[latitude, longitude]}
              icon={isMultiple ? groupIcon(etkinlikGroup.length) : etkinlikIcon}
            >
              <Popup>
              <Box sx={{ maxWidth: 'auto',minWidth:200 , maxHeight: 'auto',minHeight: 'auto', overflow: 'hidden' }}>
                {isMultiple ? (
                     <EventCarousel
                           eventGroup={etkinlikGroup}   // <- burası çok önemli!
                           userRole={userRole}
                           userToken={userToken}
                           currentUserId={currentUserId}
                          //setEvents={setEvents}
                           setSnackbar={setSnackbar}
                          onEditEvent={handleEditEvent}
                          onGoHere={handleGoHere}
                          setEvents={setEvents}
                        />
                ) : (
                  <Box>
                   <EventDetails
                   event={etkinlikGroup[0]}             // <- burada “event=” olacak!
                   userRole={userRole}
                   userToken={userToken}
                   setEvents={setEvents}
                   currentUserId={currentUserId}                // setEvents değil setEvents
                   setSnackbar={setSnackbar}
                   onEditEvent={handleEditEvent}        // onEditEtkinlik değil onEditEvent
/>
                    {/* Detaylara tıklanabilirlik eklemek için bir buton */}
                                 {/* —— Yeni “Bu Noktaya Git” butonu —— */}
              <Button
                fullWidth
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => {
                  // Sidebar’daki End Point’i güncelle
                 onMapSelection('end', {
                    display_name: etkinlik.Etkinlik_Adı || etkinlik.Yer,
                    lat: etkinlik.latitude,
                    lng: etkinlik.longitude
                  });
               }}
             >
               {t('goto_here') /* çeviride "Bu Noktaya Git" */}
             </Button>
                  </Box>
                )}
                </Box>
              </Popup>
            </Marker>
          );
        })}
 
  {/* === Öğrenci Toplulukları Etkinlikleri Marker’ı === */}
   {showEtkinlikler && (
   <Marker
     ref={toplulukMarkerRef}
     position={mapSettings.communityPosition}
     icon={toplulukIcon}
     // İstersen pasif de bırakabilirsin, popup direkt gösterilsin:
     >
     <Popup>
       <Box sx={{ width: 300, height: 425, p: 1, overflow: 'auto' }}>
         <Typography variant="h6" gutterBottom>
           {t('student_communities')}
         </Typography>
         {events
            .filter(ev => ev.creator_role === 'student_admin')
            .length > 0 ? (
           <EventCarousel
             eventGroup={events.filter(ev => ev.creator_role === 'student_admin')}
             userRole={userRole}
             userToken={userToken}
             setEvents={setEvents}
             setSnackbar={setSnackbar}
             currentUserId={currentUserId}
           />
         ) : (
           <Typography variant="body2" color="textSecondary">
             {t('no_community_events')}
           </Typography>
         )}
       </Box>
     </Popup>
   </Marker>
 )}

  {/* === Seçilen Topluluk Etkinliği için Popup’lu Marker === */}
  {selectedToplulukEvent && (
    <Marker
  ref={toplulukMarkerRef}
  position={mapSettings.communityPosition}
  icon={toplulukIcon}
  eventHandlers={{ click: handleToplulukMarkerClick }}
>
  {showToplulukList && (
    <Popup onClose={() => {
        setShowToplulukList(false);
        setSelectedToplulukEvent(null);
      }}
      minWidth={300}
      maxWidth={400}
    >
      <Box sx={{ p:1 }}>
        <Typography variant="h6" gutterBottom>
          Öğrenci Toplulukları Etkinlikleri
        </Typography>

        {selectedToplulukEvent ? (
          // Detay görünümü
          <EventDetails
            event={selectedToplulukEvent}
            userRole={userRole}
            userToken={userToken}
            setEvents={setEvents}
            setSnackbar={setSnackbar}
            currentUserId={currentUserId}
          />
        ) : (
          // Liste / karosel görünümü
          <EventCarousel
            eventGroup={events.filter(ev => ev.creator_role === 'student_admin')}
            userRole={userRole}
            userToken={userToken}
            setEvents={setEvents}
            setSnackbar={setSnackbar}
            onSlideClick={ev => setSelectedToplulukEvent(ev)}
            currentUserId={currentUserId}
          />
        )}

      </Box>
    </Popup>
  )}
</Marker>
  )}

        {/* ==============================
        5.7.2.4. Seçili Birim Marker'ı
        ============================== */}
        {selectedBirim && (
  <Marker
    position={[selectedBirim.latitude, selectedBirim.longitude]}
    icon={birimIcon}
    draggable={userRole === 'supervisor'}
    eventHandlers={{
      dragend: (e) => handleBirimDragEnd(e, selectedBirim),
    }}
  >
    <Popup>
      {/* ① Birim Adı ve Admin İşlemleri */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b>{selectedBirim.name}</b>
        {userRole === 'personel_admin' || userRole === 'student_admin' || userRole === 'supervisor' && (
          <>
            <IconButton size="small" onClick={handleEditIconClick} title="Birim Düzenle">
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => handleDeleteBirim(selectedBirim.id)} title="Birim Sil">
              <DeleteIcon />
            </IconButton>
          </>
        )}
      </Box>

      {/* ② Ayracı Koyalım */}
      <Divider sx={{ my: 1 }} />

      {/* ③ Web Sitesi */}
      {selectedBirim.website && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Link
            href={selectedBirim.website.startsWith('http')
              ? selectedBirim.website
              : `https://${selectedBirim.website}`}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
          >
            {selectedBirim.website}
          </Link>
        </Box>
      )}

      {/* ④ Telefon Numarası */}
      {selectedBirim.telefon && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">{selectedBirim.telefon}</Typography>
        </Box>
      )}
    </Popup>
  </Marker>
)}
        {/* ==============================
        5.7.2.5. Etkinlik Ekleme Modu: Seçilen Pozisyon
        ============================== */}
      {isEtkinlikFormOpen && selectedPosition && (
  <EtkinlikForm
    open={isEtkinlikFormOpen}
    handleClose={() => setIsEtkinlikFormOpen(false)}
    selectedPosition={selectedPosition}
    userToken={userToken}
   refreshEvents={(newEvent) => {
  // ① newEvent’in latitude/longitude içerdiğini kontrol edin
  if (newEvent && newEvent.latitude && newEvent.longitude) {
    // ② events dizisine ekle
    setEvents(prev => [...prev, newEvent]);

    // ③ “Etkinlikleri Göster” katmanını aktif et
    setShowEtkinlikler(true);

    // ④ Haritayı yeni etkinliğe yakınlaştır
    setMapCenter([newEvent.latitude, newEvent.longitude]);
    setMapZoom(18);

    // ⑤ Kullanıcıya kısa bilgi mesajı göster
    setSnackbar({
      open: true,
      message: 'Yeni etkinlik haritaya eklendi.',
      severity: 'success',
    });
  }
}}
    setSnackbar={setSnackbar}
  />
)}

        {/* ==============================
        5.7.2.6. Arama Sonuçları
        ============================== */}
        {searchResults.map((result) => {
          const { lat, lon, type, category, place_id, display_name } = result;

          // lat ve lon sayısal mı kontrol et
          const latNum = parseFloat(lat);
          const lonNum = parseFloat(lon);

          if (isNaN(latNum) || isNaN(lonNum)) {
            console.warn(`Geçersiz koordinatlar için arama sonucu ID: ${place_id}`, result);
            return null;
          }

          // Sonucun bir kafe olup olmadığını belirl

          // Uygun ikonu seç
          const icon = bluePinIcon; // İstediğiniz ikonla değiştirin

          return (
            <Marker
              key={place_id}
              position={[latNum, lonNum]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  // Seçilen arama sonucuna yakınlaştır
                  setMapCenter([latNum, lonNum]);
                  setMapZoom(15);
                },
              }}
            >
              <Popup>{display_name}</Popup>
            </Marker>
          );
        })}
 
        {/* ==============================
        5.7.2.7. Başlangıç ve Bitiş Noktaları
        ============================== */}
        {/* Start Point */}
        {startPoint && (
          <Marker
            position={[startPoint.lat, startPoint.lng]}
            icon={bluePinIcon} // Başlangıç için farklı bir ikon kullanabilirsiniz
            draggable={true} // Sürüklenebilir hale getirildi
            eventHandlers={{
                   dragend: async (e) => {
       const { lat, lng } = e.target.getLatLng();
       // poligon dışına çıkarsa uyarı ver, state'i değiştirme
       if (!isInsideYerleske(lat, lng)) {
         setSnackbar({
           open: true,
           message: 'Yerleşke dışına çıkamazsınız!',
           severity: 'warning',
         });
         return;
       }
                try {
                  // Reverse Geocoding ile display_name al
                  const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                    params: {
                      lat,
                      lon: lng,
                      format: 'json',
                    },
                  });
                  const display_name = response.data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

                  const newPoint = {
                    display_name,
                    lat,
                    lng,
                  };

                  setStartPoint(newPoint);
                  setSnackbar({ open: true, message: 'Başlangıç noktası güncellendi.', severity: 'info' });
                } catch (error) {
                  console.error('Reverse geocoding error:', error);
                  setSnackbar({ open: true, message: 'Yeni konumun adı alınırken bir hata oluştu.', severity: 'error' });
                }
              },
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
            {t('baslangic')}
            </Tooltip>
            <Popup>{t('baslangic')}: {startPoint.display_name}</Popup>
          </Marker>
        )}

        {/* End Point */}
        {endPoint && (
          <Marker
            position={[endPoint.lat, endPoint.lng]}
            icon={bluePinIcon} // Bitiş için farklı bir ikon kullanabilirsiniz
            draggable={true} // Sürüklenebilir hale getirildi
            eventHandlers={{
              dragend: async (e) => {
       const { lat, lng } = e.target.getLatLng();
       if (!isInsideYerleske(lat, lng)) {
         setSnackbar({
           open: true,
           message: 'Yerleşke dışına çıkamazsınız!',
           severity: 'warning',
         });
         return;
       }
                try {
                  // Reverse Geocoding ile display_name al
                  const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
                    params: {
                      lat,
                      lon: lng,
                      format: 'json',
                    },
                  });
                  const display_name = response.data.display_name || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`;

                  const newPoint = {
                    display_name,
                    lat,
                    lng,
                  };

                  setEndPoint(newPoint);
                
                } catch (error) {
                  console.error('Reverse geocoding error:', error);
                  setSnackbar({ open: true, message: 'Yeni konumun adı alınırken bir hata oluştu.', severity: 'error' });
                }
              },
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
            {t('bitis')}
            </Tooltip>
            <Popup>{t('bitis')}: {endPoint.display_name}</Popup>
          </Marker>
        )}
{/* sınırı görsel olarak da ekleyelim */}
      {boundary && (selectionMode === 'start' || selectionMode === 'end' || startPoint || endPoint) && (
  <GeoJSON
          data={boundary}
          style={{
      color: 'black',      // dış çizgi siyah
      weight: 2,           // çizgi kalınlığı
      opacity: 0.5,          // çizgi opaklığı
      fill: true,          // isterseniz içi doldurulsun
      fillOpacity: 0.1,    // doldurma saydamlığı
      fillColor: 'transparent' // veya istediğiniz başka bir renk
    }}
        />
      )}

        {/* ==============================
        5.7.2.8. Rota Gösterimi
        ============================== */}
        {routeData && <GeoJSON data={routeData} style={{ color: 'red' }} />}

        {/* ==============================
        5.7.2.9. Harita Olayları
        ============================== */}
       <MapEvents
        onMapClick={handleMapClick}
        onContextMenu={(latlng) => setContextMenuPos(latlng)}
      />  
      </MapContainer>

      {/* ==============================
      5.7.3. Form ve Dialog Bileşenleri
      ============================== */}

      {/* Hata Formu (Ekle/Düzenle) */}
  {isHataFormOpen && selectedHata && (
  <HataForm
    open={isHataFormOpen}
    handleClose={() => setIsHataFormOpen(false)}
    selectedHata={selectedHata}
    userToken={userToken}
    loadHatalar={fetchHatalar}
    setSnackbar={setSnackbar}
  />
  )}


      {/* Etkinlik Detayları Dialog'u */}
      {isEditDialogOpen && selectedEtkinlik && (
        <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
          <DialogTitle>{t('etkinlik_detaylari')}</DialogTitle>
          <DialogContent>
            <Typography variant="h6">{selectedEtkinlik.etkinlik_adı}</Typography>
            <Typography>{t('tarih')}: {selectedEtkinlik.tarih}</Typography>
            <Typography>{t('saat')}: {selectedEtkinlik.saat}</Typography>
            <Typography>{t('yer')}: {selectedEtkinlik.yer}</Typography>
            <Typography>{t('tur')}: {selectedEtkinlik.etkinlik_türü}</Typography>
            <Typography>{t('iletisim')}: {selectedEtkinlik.iletişim_bilgileri}</Typography>
            <Typography>{t('aciklama')}: {selectedEtkinlik.açıklama}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditDialogOpen(false)}>Kapat</Button>
            {/* Ekstra işlemler için buton ekleyebilirsiniz */}
          </DialogActions>
        </Dialog>
      )}

      {/* Birim Düzenleme Dialog'u */}
      {isBirimEditDialogOpen && selectedBirim && (
        <Dialog open={isBirimEditDialogOpen} onClose={() => setIsBirimEditDialogOpen(false)}>
          <DialogTitle>{t('edit_unit')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Name"
              name="name"
              value={editBirimData.name}
              onChange={handleEditBirimChange}
              fullWidth
              variant="standard"
              required
            />
            <TextField
              margin="dense"
              label="Description"
              name="description"
              value={editBirimData.description}
              onChange={handleEditBirimChange}
              fullWidth
              variant="standard"
            />
            <TextField
              margin="dense"
              label="Website"
              name="website"
              value={editBirimData.description}
              onChange={handleEditBirimChange}
              fullWidth
              variant="standard"
            />
            <TextField
              margin="dense"
              label="Telefon "
              name="telefon"
              value={editBirimData.description}
              onChange={handleEditBirimChange}
              fullWidth
              variant="standard"
            />
            <TextField
              margin="dense"
              label="Latitude"
              name="latitude"
              type="number"
              value={editBirimData.latitude}
              onChange={handleEditBirimChange}
              fullWidth
              variant="standard"
              required
            />
            <TextField
              margin="dense"
              label="Longitude"
              name="longitude"
              type="number"
              value={editBirimData.longitude}
              onChange={handleEditBirimChange}
              fullWidth
              variant="standard"
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsBirimEditDialogOpen(false)}>İptal</Button>
            <Button onClick={handleEditBirimSubmit} variant="contained" color="primary">
              Kaydet
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ==============================
      5.7.4. Etkinlik Ekleme Formu Dialog'u
      ============================== */}
      {/* Bu bileşen, etkinlik ekleme formunu açar */}
      {/* EtkinlikForm.js dosyasında oluşturduğunuz bileşeni kullanın */}

      {/* Etkinlik ekleme formu zaten yukarıda `isEtkinlikFormOpen && selectedPosition && <EtkinlikForm ... />` ile eklenmiş durumda */}
      
    </>
  );
};

MapComponent.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  userRole: PropTypes.string,
  userToken: PropTypes.string,
  currentUserId: PropTypes.number.isRequired,
  startPoint: PropTypes.object,
  endPoint: PropTypes.object,
  setStartPoint: PropTypes.func.isRequired,
  setEndPoint: PropTypes.func.isRequired,
  transportMode: PropTypes.string.isRequired,
  selectionMode: PropTypes.string,
  onMapSelection: PropTypes.func.isRequired,
  searchResults: PropTypes.array.isRequired,
  setSnackbar: PropTypes.func.isRequired,
  selectedBirim: PropTypes.object,
  setSelectedBirim: PropTypes.func.isRequired,
  routeTrigger: PropTypes.number.isRequired,
};

export default MapComponent;
