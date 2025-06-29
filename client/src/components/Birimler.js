// src/components/Birimler.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import Grow from '@mui/material/Grow';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';

const Birimler = ({ isLoggedIn, userRole, userToken, onSelectBirim, onClose, refreshTrigger }) => {
  const { t } = useTranslation();
  const [birimler, setBirimler] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBirimler, setFilteredBirimler] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchBirimler();
  }, [refreshTrigger]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBirimler(birimler);
    } else {
      const filtered = birimler.filter((birim) =>
        birim.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBirimler(filtered);
    }
  }, [searchQuery, birimler]);

  const fetchBirimler = async () => {
    try {
      const response = await axios.get(`${API_URL}/birimler`);
      let validBirimler = response.data.filter(
        (birim) =>
          birim.name &&
          birim.latitude != null &&
          birim.longitude != null
      );

      validBirimler.sort((a, b) => a.name.localeCompare(b.name));

      setBirimler(validBirimler);
      setFilteredBirimler(validBirimler);
    } catch (error) {
      console.error('Birimler yüklenirken bir sorun oluştu:', error);
      setSnackbar({ open: true, message: t('units_fetch_error'), severity: 'error' });
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleBirimClick = (birim) => {
    const formattedBirim = {
      ...birim,
      latitude: parseFloat(birim.latitude),
      longitude: parseFloat(birim.longitude)
    };
    onSelectBirim(formattedBirim);
    onClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 350,
        height: '100%',
        backgroundColor: 'white',
        boxShadow: 3,
        zIndex: 2000,
        p: 3,
        borderLeft: '1px solid #ddd',
        overflowY: 'auto'
      }}
    >
      {/* Üst Bölüm: Başlık ve Kapatma */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{t('birimler')}</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ my: 2 }} />

      {/* Arama Bölümü */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SearchIcon color="action" />
        <TextField
          label={t('search_unit')}
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ ml: 1, backgroundColor: '#f9f9f9', borderRadius: 1 }}
        />
      </Box>

      {/* Birimler Listesi */}
      {filteredBirimler.map((birim) => (
        <Grow in={true} timeout={500} key={birim.id}>
          <Card sx={{ mb: 1, boxShadow: 3 }}>
            <CardActionArea onClick={() => handleBirimClick(birim)}>
              <CardContent>
                <Typography variant="body1" fontWeight="bold">
                  {birim.name}
                </Typography>
                {birim.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <LanguageIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">
                      <a href={birim.website} target="_blank" rel="noopener noreferrer">
                        {birim.website}
                      </a>
                    </Typography>
                  </Box>
                )}
                {birim.telefon && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <PhoneIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">{birim.telefon}</Typography>
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grow>
      ))}

      {/* Snackbar Bildirimleri */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Birimler;
