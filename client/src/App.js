import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import Birimler from './components/Birimler';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ErrorBoundary from './components/ErrorBoundary';
import SupervisorPanel from './components/SupervisorPanel';
import jwt_decode from 'jwt-decode';
import { Snackbar, Alert, Box, Button, Typography, IconButton } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import trFlag from './assets/tr-flag.png';
import enFlag from './assets/en-flag.png';
// src/App.js ya da hangi dosyada kullandıysan
import { Stack } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';


function App() {
  // ==============================
  // 1. Kullanıcı Kimlik Doğrulama Durumları
  // ==============================
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState('');
  const [clearMapTrigger, setClearMapTrigger] = useState(0);
  const [walkerActive, setWalkerActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggleSidebar = () => setSidebarOpen(o => !o);
  const drawerWidth = 320;        // Sidebar açıkken genişlik
  const collapsedWidth = 48;      // theme.spacing(6) = 6*8px
  // ** Yeni: SupervisorPanel’ın gösterilip gösterilmediğini kontrol eden state **
  const [showSupervisorPanel, setShowSupervisorPanel] = useState(false);

  const [routeDistance, setRouteDistance] = useState(null);
  const { t, i18n } = useTranslation();

  // ==============================
  // 2. Rota Hesaplama Durumları
  // ==============================
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [transportMode, setTransportMode] = useState('walking'); // Varsayılan olarak 'walking'
  const [routeTrigger, setRouteTrigger] = useState(0); // Rota tetikleyicisi

  // ==============================
  // 3. Seçim Modu Durumu
  // ==============================
  const [selectionMode, setSelectionMode] = useState(null); // 'start', 'end', veya null
  // 9.12. Haritayı Temizle (Sidebar’daki butondan çağrılacak)
  const handleClearMap = () => {
    setStartPoint(null);
    setEndPoint(null);
    setRouteDistance(null);
    setSearchResults([]);
    setSelectedBirim(null);
    // MapComponent içindeki clearMap()’i çalıştırmak için:
    setClearMapTrigger(prev => prev + 1);
  };
  // ==============================
  // 4. Arama Durumları
  // ==============================
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // ==============================
  // 5. Snackbar (Bildirim) Durumu
  // ==============================
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ==============================
  // 6. Birimler (Units) Durumu
  // ==============================
  const [selectedBirim, setSelectedBirim] = useState(null);
  const [isBirimlerOpen, setIsBirimlerOpen] = useState(false);

  // ==============================
  // 7. Refresh Trigger for Birimler.js
  // ==============================
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ==============================
  // 8. useEffect Hook'u: Sayfa Yüklendiğinde Token Kontrolü
  // ==============================
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp > currentTime) {
          setIsLoggedIn(true);
          setUserToken(token);
          setUserRole(decoded.role);
          setUsername(decoded.username);

          // Eğer role = 'supervisor' ise SupervisorPanel’i gösterecek şekilde state’i true yap:
          if (decoded.role === 'supervisor') {
            setShowSupervisorPanel(true);
          }

          setSnackbar({ open: true, message: t('login_success'), severity: 'success' });
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Token decode hatası:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  // ==============================
  // 9. Handler Fonksiyonları
  // ==============================

  // 9.1. Giriş Başarılı Olduğunda
  const handleLoginSuccess = (token, role, username) => {
    setIsLoggedIn(true);
    setUserToken(token);
    setUserRole(role);
    setUsername(username);
    localStorage.setItem('token', token);

    // Eğer supervisor girişi ise SupervisorPanel'ı göster
    if (role === 'supervisor') {
      setShowSupervisorPanel(true);
    }

    setSnackbar({ open: true, message: t('login_success'), severity: 'success' });
  };

  // 9.2. Çıkış Yapma Fonksiyonu
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserToken(null);
    setUserRole(null);
    setUsername('');
    localStorage.removeItem('token');
    setShowSupervisorPanel(false); // Eğer SupervisorPanel açıksa onu da kapat
    setSnackbar({ open: true, message: t('logout_success'), severity: 'info' });
  };

  // 9.3. Snackbar'ı Kapatma Fonksiyonu
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 9.4. Rota Hesaplama Fonksiyonu
  const handleCalculateRoute = (selectedStart, selectedEnd, mode) => {
    if (!selectedStart || !selectedEnd) {
      setSnackbar({ open: true, message: t('select_start_end'), severity: 'warning' });
      return;
    }

    setTransportMode(mode || transportMode);
    setStartPoint(selectedStart);
    setEndPoint(selectedEnd);
    setRouteTrigger((prev) => prev + 1);
    setSnackbar({ open: true, message: t('route_calculating'), severity: 'info' });
  };

  // 9.5. Sidebar'dan Gelen Arama Sonuçlarını Alma Fonksiyonu
  const handleSearchResults = (results) => {
    setSearchResults(results);
    setShowSearchResults(true);
  };

  // 9.6. Arama Sonucuna Tıklama Fonksiyonu
  const handleResultClick = (result) => {
    setStartPoint(null);
    setEndPoint(null);
    setTransportMode('walking');
    setSelectionMode(null);
    setSnackbar({ open: true, message: t('search_navigating'), severity: 'info' });

    setStartPoint({
      display_name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });

    setEndPoint(null);
    setShowSearchResults(false);
  };

  // 9.7. Arama Sonuçlarını Kapatma Fonksiyonu
  const handleCloseSearchResults = () => {
    setShowSearchResults(false);
  };

  // 9.8. Başlangıç Noktası Seçme Modunu Başlatma Fonksiyonu
  const handleSelectStart = (point) => {
    if (!point) {
      setSelectionMode(null);
      setStartPoint(null);
    } else {
      setSelectionMode('start');
      setSnackbar({ open: true, message: t('select_start_instruction'), severity: 'info' });
    }
  };

  // 9.9. Bitiş Noktası Seçme Modunu Başlatma Fonksiyonu
  const handleSelectEnd = (point) => {
    if (!point) {
      setSelectionMode(null);
      setEndPoint(null);
    } else {
      setSelectionMode('end');
      setSnackbar({ open: true, message: t('select_end_instruction'), severity: 'info' });
    }
  };

  // 9.10. Harita Üzerinde Seçim Yapıldığında
  const handleMapSelection = (type, point) => {
    if (type === 'start') {
      setStartPoint(point);
      setSnackbar({ open: true, message: t('start_point_selected'), severity: 'success' });
    } else if (type === 'end') {
      setEndPoint(point);
      setSnackbar({ open: true, message: t('end_point_selected'), severity: 'success' });
    }
    setSelectionMode(null);
  };

  // 9.11. Birim Seçildiğinde
  const handleBirimSelect = (birim) => {
    setSelectedBirim(birim);
    setIsBirimlerOpen(false);
    setSnackbar({ open: true, message: `${birim.name} ${t('unit_selected')}`, severity: 'info' });
    setRefreshTrigger((prev) => prev + 1);
  };

  // 9.12. Birimler Panelini Açma Fonksiyonu
  const openBirimler = () => {
    setIsBirimlerOpen(true);
  };

  // ==============================
  // Eğer Supervisor girişi yapılmış ve showSupervisorPanel = true ise SupervisorPanel'i göster
  // ==============================
  if (isLoggedIn && userRole === 'supervisor' && showSupervisorPanel) {
    return (
      <SupervisorPanel
        userToken={userToken}
        onLogout={handleLogout} // Oturumu kapatmak için
        onBackToMain={() => setShowSupervisorPanel(false)} // “Ana Uygulamaya Dön” butonuna basılınca çalışacak
      />
    );
  }

  // ==============================
  // Normal görüntü: Sidebar + MapComponent + Birimler + Login/Register
  // ==============================
  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', height: '100vh', position: 'relative' }}>
        {/* ==============================
        10. Sidebar Bileşeni
        ============================== */}
        <Sidebar
         open={sidebarOpen}
          toggleDrawer={toggleSidebar}
          transportMode={transportMode}
          setTransportMode={setTransportMode}
          onCalculateRoute={handleCalculateRoute}
          onSearchResults={handleSearchResults}
          onSelectStart={handleSelectStart}
          onSelectEnd={handleSelectEnd}
          startPoint={startPoint}
          endPoint={endPoint}
          setSnackbar={setSnackbar}
          routeDistance={routeDistance}
          onClearMap={handleClearMap}
          walkerActive={walkerActive}
          setWalkerActive={setWalkerActive}
        />

        {/* ==============================
        11. Ana İçerik Alanı
        ============================== */}
      <Box
  sx={{
    position: 'absolute',
    top: 16,
    // left’i sabit tutuyoruz, tüm durumlarda collapsedWidth + 8
    left: sidebarOpen ? drawerWidth + 8 : collapsedWidth + 8,
    zIndex: 1300,
    transition: 'left 0.2s ease-in-out',
  }}
>
  <IconButton
    onClick={toggleSidebar}
    size="small"
    sx={{
      // kapalıyken -1 spacing (8px) sola kaydır
      ml: sidebarOpen ? 0 : -6,
      transition: 'margin-left 0.2s ease-in-out',
      bgcolor: 'common.white',
      border: '1px solid',
      borderColor: 'primary.main',
      '&:hover': { bgcolor: 'primary.main', color: 'common.white' },
    }}
  >
    {sidebarOpen 
      ? <ChevronLeftIcon fontSize="small"/>
      : <ChevronRightIcon fontSize="small"/>}
  </IconButton>
</Box>

        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {/* ==============================
          12. Üst Sağ Köşe: Birimler, Giriş/Kayıt veya Kullanıcı Bilgileri
          ============================== */}
         <Box
  sx={{
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1200,
  }}
>
  <Paper
    elevation={1}
    sx={{
      p: 1,
      borderRadius: 1,
      bgcolor: 'rgba(255,255,255,0.9)',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      minWidth: 160,
      borderBottom: '1px solid',
      borderColor: 'primary.main', 
    }}
  >
      {/* Dil Seçici */}
    <ToggleButtonGroup
      value={i18n.language}
      exclusive
      onChange={(_, lang) => lang && i18n.changeLanguage(lang)}
      size="small"
      fullWidth
      sx={{
        borderRadius: 1,
        '& .MuiToggleButton-root': {
          p: 0.4,
          minWidth: 32,
          fontSize: '0.7rem',
        },
        '& .Mui-selected': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        },
      }}
    >
      <ToggleButton value="tr">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <Box component="img" src={trFlag} alt="TR" sx={{ width: 14, height: 10 }} />
          TR
        </Box>
      </ToggleButton>
      <ToggleButton value="en">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <Box component="img" src={enFlag} alt="EN" sx={{ width: 14, height: 10 }} />
          EN
        </Box>
      </ToggleButton>
    </ToggleButtonGroup>
    {/* Giriş/Kayıt veya Kullanıcı Bilgisi */}
    {!isLoggedIn ? (
      <Stack direction="row" spacing={0.5} justifyContent="center">
        <Button
          startIcon={<LoginIcon fontSize="small" />}
          variant="text"
          size="small"
          onClick={() => setIsLoginOpen(true)}
          sx={{
            border: '1px solid',
            textTransform: 'none',
            fontSize: '0.75rem',
            color: 'primary.main',
            px: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {t('login_button')}
        </Button>
        <Button
          startIcon={<PersonAddIcon fontSize="small" />}
          variant="text"
          size="small"
          onClick={() => setIsRegisterOpen(true)}
          sx={{
            border: '1px solid',
            textTransform: 'none',
            fontSize: '0.75rem',
            color: 'primary.main',
            px: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {t('register_button')}
        </Button>
      </Stack>
    ) : (
      <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.primary' }}>
          {t('welcome_message', { username })}
        </Typography>
        <Button
          startIcon={<LogoutIcon fontSize="small" />}
          variant="text"
          size="small"
          onClick={handleLogout}
          sx={{
            textTransform: 'none',
            fontSize: '0.75rem',
            color: 'error.main',
            px: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          {t('logout_button')}
        </Button>
      </Stack>
    )}

  
  </Paper>
</Box>



  
          {/* ==============================
          13. MapComponent Bileşeni
          ============================== */}
          <MapComponent
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            userToken={userToken}
            startPoint={startPoint}
            endPoint={endPoint}
            transportMode={transportMode}
            setStartPoint={setStartPoint}
            setEndPoint={setEndPoint}
            selectionMode={selectionMode}
            onMapSelection={handleMapSelection}
            searchResults={searchResults}
            setSnackbar={setSnackbar}
            selectedBirim={selectedBirim}
            setSelectedBirim={setSelectedBirim}
            setSearchResults={setSearchResults}
            routeTrigger={routeTrigger}
            onRouteDistance={(d) => setRouteDistance(d)}
            clearMapTrigger={clearMapTrigger}
            walkerActive={walkerActive}
            setWalkerActive={setWalkerActive}
          />

          {/* ==============================
          14. Birimler Paneli
          ============================== */}
          {isBirimlerOpen && (
            <Birimler
              isLoggedIn={isLoggedIn}
              userRole={userRole}
              userToken={userToken}
              onSelectBirim={handleBirimSelect}
              onClose={() => setIsBirimlerOpen(false)}
              refreshTrigger={refreshTrigger}
            />
          )}

          {/* ==============================
          15. Login ve Register Formları
          ============================== */}
          <LoginForm
            open={isLoginOpen}
            handleClose={() => setIsLoginOpen(false)}
            onLoginSuccess={handleLoginSuccess}
          />
               <RegisterForm
       open={isRegisterOpen}
        handleClose={() => setIsRegisterOpen(false)}
      />

          {/* ==============================
          16. Snackbar (Bildirim) Bileşeni
          ============================== */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={9000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </ErrorBoundary>
  );
}

export default App;
