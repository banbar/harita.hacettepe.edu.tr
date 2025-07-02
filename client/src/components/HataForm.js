import React, { useState, useEffect } from 'react';
import { Modal, Box, TextField, Button, Typography, Snackbar, Alert, MenuItem } from '@mui/material';
import axios from 'axios';
import { API_URL } from './config';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

const HataForm = ({ open, handleClose, selectedHata, userToken, loadHatalar, setSnackbar }) => {
  const [updateType, setUpdateType] = useState('');
  const [description, setDescription] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [hataId, setHataId] = useState(null);

  useEffect(() => {
    if (selectedHata && selectedHata.id) {
      // Düzenleme modu
      setUpdateType(selectedHata.update_type || '');
      setDescription(selectedHata.description || '');
      setIsEditMode(true);
      setHataId(selectedHata.id);
    } else if (selectedHata && (selectedHata.lat != null || selectedHata.latitude != null)) {
      // Yeni kayıt modu
      setUpdateType('');
      setDescription('');
      setIsEditMode(false);
      setHataId(null);
    }
  }, [selectedHata]);

  const handleSave = async () => {
    if (!updateType || !description) {
      setSnackbar({ open: true, message: 'Lütfen tüm alanları doldurun.', severity: 'warning' });
      return;
    }

    const hataData = {
      update_type: updateType,
      description: description,
      latitude: selectedHata.lat ?? selectedHata.latitude,
      longitude: selectedHata.lng ?? selectedHata.longitude,
    };

    try {
      if (isEditMode) {
        await axios.put(
          `${API_URL}/hatalar/${hataId}`,
          hataData,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setSnackbar({ open: true, message: 'Hata başarıyla güncellendi!', severity: 'success' });
      } else {
        await axios.post(
          `${API_URL}/hatalar`,
          hataData,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setSnackbar({ open: true, message: 'Hata başarıyla kaydedildi!', severity: 'success' });
      }
      loadHatalar();
      handleClose();
    } catch (error) {
      console.error('Hata formu gönderilirken bir sorun oluştu:', error);
      setSnackbar({ open: true, message: 'Hata formu gönderilirken bir sorun oluştu.', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!hataId) return;
    if (window.confirm('Hata silinsin mi?')) {
      try {
        await axios.delete(
          `${API_URL}/hatalar/${hataId}`,
          { headers: { Authorization: `Bearer ${userToken}` } }
        );
        setSnackbar({ open: true, message: 'Hata başarıyla silindi!', severity: 'success' });
        loadHatalar();
        handleClose();
      } catch (error) {
        console.error('Hata silinirken bir sorun oluştu:', error);
        setSnackbar({ open: true, message: 'Hata silinirken bir sorun oluştu.', severity: 'error' });
      }
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" gutterBottom>
          {isEditMode ? 'Hata Düzenle' : 'Hata Ekle'}
        </Typography>

        <TextField
          fullWidth
          select
          label="Hata Türü"
          margin="normal"
          value={updateType}
          onChange={(e) => setUpdateType(e.target.value)}
        >
          <MenuItem value="Ulaşım Ağı">Ulaşım Ağı</MenuItem>
          <MenuItem value="Bina ve Birim">Bina ve Birim</MenuItem>
          <MenuItem value="Erişilebilirlik Sorunları">Erişilebilirlik Sorunları</MenuItem>
          <MenuItem value="Sosyal Alanlar">Sosyal Alanlar</MenuItem>
        </TextField>

        <TextField
          fullWidth
          label="Açıklama"
          multiline
          rows={4}
          margin="normal"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <Button variant="contained" color="primary" onClick={handleSave}>
            {isEditMode ? 'Güncelle' : 'Kaydet'}
          </Button>
          {isEditMode && (
            <Button variant="contained" color="secondary" onClick={handleDelete}>
              Sil
            </Button>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default HataForm;
