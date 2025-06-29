// src/components/Sidebar.js

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Button,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import walkingManPng from '../assets/walking-man.png';
import { Stack } from '@mui/material';
import { Paper } from '@mui/material';
import ButtonGroup from '@mui/material/ButtonGroup';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DriveEtaIcon from '@mui/icons-material/DriveEta';
import GitHubIcon from '@mui/icons-material/GitHub'; 


const drawerWidth = 320;

// Yerleşke sınırı
const BBOX = { minLat: 39.859147, maxLat: 39.875209, minLon: 32.724736, maxLon: 32.743655 };
const isInsideYerleske = (lat, lon) =>
  lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon;

// Viewbox
const HACETTEPE_VIEWBOX = { min_lon: 32.72, min_lat: 39.86, max_lon: 32.75, max_lat: 39.87 };

const openedMixin = theme => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});
const closedMixin = theme => ({
  width: 0,   // ← 0 px
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
});
const StyledDrawer = styled(Drawer, { shouldForwardProp: prop => prop !== 'open' })(
  ({ theme, open }) => ({
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    backgroundColor: 'transparent',       // root’u da şeffaf yap
    ...(open
      ? {
          ...openedMixin(theme),
          '& .MuiDrawer-paper': {
            ...openedMixin(theme),
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[4],
            p: 0,
          },
        }
      : {
          ...closedMixin(theme),
          '& .MuiDrawer-paper': {
            ...closedMixin(theme),
            backgroundColor: 'transparent',  // paper’ı da şeffaf yap
            borderRight: 'none',
            boxShadow: 'none',
            p: 0,
          },
        }),
  })
);

export default function Sidebar({
  open,           // ← App.js’den gelen prop
  toggleDrawer,   // ← App.js’den gelen callback
  transportMode,
  setTransportMode,
  onCalculateRoute,
  onSearchResults,
  onSelectStart,
  onSelectEnd,
  startPoint,
  endPoint,
  setSnackbar,
  routeDistance,
  onClearMap,
  walkerActive,
  setWalkerActive,
            // ← Yeni prop
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  // State’ler
  const [units, setUnits] = useState([]);
  const [startOptions, setStartOptions] = useState([]);
  const [endOptions, setEndOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStart, setSelectedStart] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [startInputValue, setStartInputValue] = useState('');
  const [endInputValue, setEndInputValue] = useState('');
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingEnd, setLoadingEnd] = useState(false);

  // Prop → state sync
  useEffect(() => {
    if (startPoint) {
      setSelectedStart(startPoint);
      setStartInputValue(`${startPoint.lat}; ${startPoint.lng}`);
    }
  }, [startPoint]);
  useEffect(() => {
    if (endPoint) {
      setSelectedEnd(endPoint);
      setEndInputValue(`${endPoint.lat}; ${endPoint.lng}`);
    }
  }, [endPoint]);

  // Birimleri yükle
  useEffect(() => {
    axios
      .get('/api/birimler')
      .then(res => setUnits(res.data))
      .catch(err => {
        console.error(err);
        setSnackbar({ open: true, message: t('birimler_yuklenemedi'), severity: 'error' });
      });
  }, []);

  // Öneri getirme
  const fetchOptions = async (q, setter) => {
    try {
      let opts = [{ display_name: t('konumumu_kullan'), isCurrentLocation: true }];
      const matches = units
        .filter(u => u.name.toLowerCase().includes(q.toLowerCase()))
        .map(u => ({
          display_name: u.name,
          lat: u.latitude,
          lng: u.longitude,
          isUnit: true,
        }))
        .sort((a, b) => a.display_name.localeCompare(b.display_name, 'tr', { sensitivity: 'base' }));
      setter(opts.concat(matches));
    } catch {
      setSnackbar({ open: true, message: t('arama_hatasi'), severity: 'error' });
    }
  };

  // Konum seç
  const handleLocationSelect = type => {
    if (!navigator.geolocation) {
      setSnackbar({ open: true, message: t('geolocation_destegi_yok'), severity: 'error' });
      return;
    }
    const setLoad = type === 'start' ? setLoadingStart : setLoadingEnd;
    const setSel = type === 'start' ? setSelectedStart : setSelectedEnd;
    const setInp = type === 'start' ? setStartInputValue : setEndInputValue;
    setLoad(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        if (!isInsideYerleske(latitude, longitude)) {
          setSnackbar({ open: true, message: t('yerleske_disinda'), severity: 'warning' });
          setLoad(false);
          return;
        }
        const loc = { display_name: t('konumum'), lat: latitude, lng: longitude };
        setSel(loc);
        setInp(`${latitude.toFixed(6)}; ${longitude.toFixed(6)}`);
        setSnackbar({ open: true, message: t('konum_alindi'), severity: 'success' });
        setLoad(false);
      },
      err => {
        console.error(err);
        setSnackbar({ open: true, message: t('konum_alinirken_hata'), severity: 'error' });
        setLoad(false);
      }
    );
  };

  // Seçim değişikliği
  const handleChange = (type, _e, val) => {
    if (val?.isCurrentLocation) {
      handleLocationSelect(type);
      return;
    }
    const { lat, lng } = val || {};
    if (lat == null || lng == null || !isInsideYerleske(lat, lng)) {
      setSnackbar({ open: true, message: t('yerleske_disinda'), severity: 'warning' });
      return;
    }
    if (type === 'start') {
      setSelectedStart(val);
      setStartInputValue(`${lat}; ${lng}`);
    } else {
      setSelectedEnd(val);
      setEndInputValue(`${lat}; ${lng}`);
    }
  };

  // Rota hesapla
  const handleCalculate = () => {
    if (!selectedStart || !selectedEnd) {
      setSnackbar({ open: true, message: t('baslangic_bitis_seciniz'), severity: 'warning' });
      return;
    }
    onCalculateRoute(selectedStart, selectedEnd, transportMode);
  };

  // Start/End swap
  const handleSwap = () => {
    const os = selectedStart,
      oe = selectedEnd,
      si = startInputValue,
      ei = endInputValue;
    setSelectedStart(oe);
    setSelectedEnd(os);
    setStartInputValue(ei);
    setEndInputValue(si);
    if (oe && os) onCalculateRoute(oe, os, transportMode);
  };

  return (
    
    <StyledDrawer variant="permanent" open={open}>
       {/* █ HEADER: mavi bar + logo + iki satırlı ortalı başlık + GitHub */}
       {open && (
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            rowGap: 1,
            fontSize: '0.85rem',
            bgcolor: theme.palette.background.default,
          }}
        >
  <Box sx={{ position: 'relative' }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 2,
        py: 1.5,
        bgcolor: 'rgba(40,127,214,0.85)',  // mavi arkaplan
      }}
    >
      {/* 1. Logo */}
      <Box
        component="img"
        src={require(`../assets/${process.env.REACT_APP_SIDEBTEPE_LOGO_FILE || 'hacettepe_logo.png'}`)}
        alt="Hacettepe Logo"
        sx={{ width: 40, height: 40 }}
      />

      {/* 2. İki satırlı, ortalı başlık */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',     // alt alta ortalamak için
          ml: 4,                     // logo ile arasına boşluk
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700,fontSize: '1.4rem', color: 'common.white', lineHeight: 1.1 }}
        >
          {t('hacettepe')}
        </Typography>
        <Typography
          variant="h6"
          sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'common.white', lineHeight: 1.1 }}
        >
          {t('harita')}
        </Typography>
      </Box>

      {/* 3. GitHub ikonu, başlığın hemen sağına */}
      <IconButton
        component="a"
        href="https://github.com/banbar/harita.hacettepe.edu.tr"
        target="_blank"
        rel="noopener"
        size="small"
        sx={{ color: 'common.white', ml: 5}}  // başlığa biraz boşluk
        title="GitHub Repo"
      >
        <GitHubIcon
          sx={{
            fontSize: '1.8rem'  // default ~1.25rem; burayı büyüterek ikonu büyüt
          }}
        />
      </IconButton>
    </Box>
  </Box>
      
          <Divider textAlign="left" sx={{ my:0 }}>
  <Typography variant="caption" color="text.secondary">
    Rota Ayarları
  </Typography>
</Divider>
       <Paper elevation={2} sx={{ p: 1, mb: 2, borderRadius: 2 }}>
      <Stack spacing={1} sx={{ mb: 2 }}>
          {/* Başlangıç */}
          <Autocomplete
            freeSolo
            options={startOptions}
            getOptionLabel={opt =>
              opt.isCurrentLocation
                ? opt.display_name
                : opt.isUnit
                ? opt.display_name
                : `${opt.display_name} (${opt.lat},${opt.lng})`
            }
            value={selectedStart}
            inputValue={startInputValue}
            onInputChange={(e, v, r) => {
              if (r === 'input') {
                setStartInputValue(v);
                fetchOptions(v, setStartOptions);
              }
              if (r === 'clear') {
                setSelectedStart(null);
                setStartInputValue('');
                onSelectStart(null);
              }
            }}
            onChange={(e, v) => handleChange('start', e, v)}
            clearOnEscape
            clearIcon={<ClearIcon fontSize="small" />}
            renderInput={params => (
              <TextField
                {...params}
                label={t('baslangic_noktasi')}
                placeholder={t('haritadan_secmek_icin_haritaya_tiklayin')}  // ← Buraya ekledik
                size="small"
                margin="none"
                 sx={{
    mb: 1,
    // input öğesinin tüm metnini küçültür
    '& .MuiInputBase-input': {
      fontSize: '0.75rem',
    },
    // placeholder’ı ayrıca küçültmek istersen
    '& .MuiInputBase-input::placeholder': {
      fontSize: '0.75rem',
      opacity: 0.7,           // dilersen placeholder’ı biraz daha soluk da yaparsın
    },
  }}
                onFocus={onSelectStart}
                onClick={onSelectStart}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleLocationSelect('start')}>
                          <LocationOnIcon fontSize="small" color="primary" />
                        </IconButton>
                      </InputAdornment>
                      {loadingStart && <CircularProgress size={16} sx={{ ml: 0.5 }} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          {/* Swap */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <IconButton
              onClick={handleSwap}
              size="small"
              sx={{
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'grey.100' },
              }}
            >
              <SwapHorizIcon fontSize="small" color="primary" />
            </IconButton>
          </Box>

          {/* Bitiş */}
          <Autocomplete
            freeSolo
            options={endOptions}
            getOptionLabel={opt =>
              opt.isCurrentLocation
                ? opt.display_name
                : opt.isUnit
                ? opt.display_name
                : `${opt.display_name} (${opt.lat},${opt.lng})`
            }
            value={selectedEnd}
            inputValue={endInputValue}
            onInputChange={(e, v, r) => {
              if (r === 'input') {
                setEndInputValue(v);
                fetchOptions(v, setEndOptions);
              }
              if (r === 'clear') {
                setSelectedEnd(null);
                setEndInputValue('');
                onSelectEnd(null);
              }
            }}
            onChange={(e, v) => handleChange('end', e, v)}
            clearOnEscape
            clearIcon={<ClearIcon fontSize="small" />}
            renderInput={params => (
              <TextField
                {...params}
                label={t('bitis_noktasi')}
                placeholder={t('haritadan_secmek_icin_haritaya_tiklayin')}  // ← Buraya ekledik
                size="small"
                margin="none"
                 sx={{
    mb: 1,
    // input öğesinin tüm metnini küçültür
    '& .MuiInputBase-input': {
      fontSize: '0.75rem',
    },
    // placeholder’ı ayrıca küçültmek istersen
    '& .MuiInputBase-input::placeholder': {
      fontSize: '0.75rem',
      opacity: 0.7,           // dilersen placeholder’ı biraz daha soluk da yaparsın
    },
  }}
                onFocus={onSelectEnd}
                onClick={onSelectEnd}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleLocationSelect('end')}>
                          <LocationOnIcon fontSize="small" color="primary" />
                        </IconButton>
                      </InputAdornment>
                      {loadingEnd && <CircularProgress size={16} sx={{ ml: 0.5 }} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
         </Stack>
         </Paper>
          {/* Mesafe */}
          {routeDistance != null && (
            <Typography variant="body2" sx={{ textAlign: 'center', color: 'primary.main', mb: 1 }}>
              {t('distance_label')} {Math.round(routeDistance)} {t('mesafe_unit')}
            </Typography>
          )}
<Paper elevation={1} sx={{ mb: 1, borderRadius: 1 }}>
  <ButtonGroup
    variant="outlined"
    sx={{
      width: '100%',
      borderRadius: 2,
      '& .MuiButtonGroup-grouped': {
        flex: 1,
        '&.selected': {
          bgcolor: 'primary.main',
          color: 'common.white'
        }
      }
    }}
  >
    {['walking','cycling','driving'].map(mode => (
      <Button
        key={mode}
        className={transportMode === mode ? 'selected' : ''}
        onClick={() => setTransportMode(mode)}
        sx={{ display: 'flex', flexDirection: 'column', py: 1 }}
      >
        {mode === 'walking' && <DirectionsWalkIcon />}
        {mode === 'cycling' && <DirectionsBikeIcon />}
        {mode === 'driving' && <DriveEtaIcon />}
        <Typography variant="caption" sx={{ mt: 0.5 }}>
          {mode === 'walking' ? t('yaya') : mode === 'cycling' ? t('bisiklet') : t('arac')}
        </Typography>
      </Button>
    ))}
  </ButtonGroup>
</Paper>


          {/* Rota Hesapla */}
          <Button
            variant="contained"
            fullWidth
            onClick={handleCalculate}
            disabled={!selectedStart || !selectedEnd}
            sx={{
              py: 0.8,
              fontSize: '0.85rem',
              borderRadius: 1,
              textTransform: 'none',
              mb: 1,
              transition: 'transform 0.2s',
'&:hover': { transform: 'scale(1.02)' },
'&:active': { boxShadow: theme.shadows[2] }
            }}
          >
            {t('rota_hesapla')}
          </Button>


          <Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
          // üst-alt boşluk
       // ikon ile metin arası boşluk
  }}
>
  
  <IconButton
    onClick={() => setWalkerActive(a => !a)}
    size="small"
    title={
      walkerActive
        ? t('yuruyus_cemberlerini_kapat') 
        : t('yuruyus_cemberlerini_ac')
    }
    sx={{
      transition: 'transform 0.25s',
      transform: walkerActive ? 'scale(1.3)' : 'scale(1)',
      boxShadow: walkerActive ? '0 0 8px 2px rgba(25,118,210,0.6)' : 'none',
    }}
  >
    <img
      src={walkingManPng}
      alt="Walker Toggle"
      width={walkerActive ? 30 : 24}
      height={walkerActive ? 30 : 24}
    />
  </IconButton>
</Box>

           

          <Divider textAlign="center" sx={{ my:1, '& .MuiDivider-wrapper': { px: 0 } }}>
</Divider>
          {/* Haritayı Temizle Butonu */}
          <Button
            variant="contained"
            fullWidth
            color="primary"
            onClick={onClearMap}
            sx={{
              mt: 2,
              py: 1,
              fontSize: '0.95rem',
              borderRadius: 1,
              textTransform: 'none',
              transition: 'transform 0.2s',
'&:hover': { transform: 'scale(1.02)' },
'&:active': { boxShadow: theme.shadows[2] }
            }}
          >
            {t('clear_map')}
          </Button>

          <Box sx={{ flexGrow: 1 }} />
        </Box>
      )}
    </StyledDrawer>
  );
}
