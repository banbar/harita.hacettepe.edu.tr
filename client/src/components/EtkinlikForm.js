// src/components/EventForm.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box
} from '@mui/material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';

export default function EventForm({
  open,
  handleClose,
  selectedPosition,
  userToken,
  userRole,
  units = [],
  refreshEvents,
  setSnackbar,
  initialData,
}) {
  const { t } = useTranslation();

  // personel_admin için birimleri alfabetik sıraya sok
  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.name.localeCompare(b.name)),
    [units]
  );

  // formData içinde dateTime stringi
  const [formData, setFormData] = useState({
    title: '',
    dateTime: new Date().toISOString().slice(0,16), // örn "2025-06-15T22:30"
    event_type: '',
    website: '',
    unit_id: '',
  });
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  // initialData geldiğinde doldur
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        dateTime: `${initialData.date}T${initialData.time}` || new Date().toISOString().slice(0,16),
        event_type: initialData.event_type || '',
        website: initialData.website || '',
        unit_id: initialData.unit_id || '',
      });
      setImage(null);
      setErrors({});
    } else {
      setFormData(f => ({
        ...f,
        dateTime: new Date().toISOString().slice(0,16)
      }));
      setImage(null);
      setErrors({});
    }
  }, [initialData, open]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    setErrors(old => ({ ...old, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title) errs.title = t('titleRequired');
    if (!formData.dateTime) errs.dateTime = t('dateTimeRequired');
    if (!formData.event_type) errs.eventTypeRequired = t('eventTypeRequired');
    if (!formData.website) errs.website = t('websiteRequired');
    if (userRole === 'personel_admin' && !formData.unit_id) {
      errs.unit_id = t('unitRequired');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setSnackbar({ open: true, message: t('fillRequiredFields'), severity: 'warning' });
      return;
    }

    const payload = new FormData();
    payload.append('title', formData.title);

    // dateTime stringini bölüyoruz
    const [date, time] = formData.dateTime.split('T');
    payload.append('date', date);
    payload.append('time', time);

    payload.append('event_type', formData.event_type);
    payload.append('website', formData.website);
    payload.append('latitude', selectedPosition.lat);
    payload.append('longitude', selectedPosition.lng);
    if (userRole === 'personel_admin') {
      payload.append('unit_id', formData.unit_id);
    }
    if (image) {
      payload.append('image', image);
    }

    try {
      const headers = {
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'multipart/form-data'
      };
      const url = initialData
        ? `${API_URL}/events/${initialData.id}`
        : `${API_URL}/events`;
      const method = initialData ? 'put' : 'post';
      const res = await axios[method](url, payload, { headers });

      setSnackbar({
        open: true,
        message: initialData ? t('updatedSuccess') : t('createdSuccess'),
        severity: 'success'
      });
      handleClose();
      refreshEvents(res.data.event ?? res.data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || t('genericError'),
        severity: 'error'
      });
    }
  };

  // Sadece tarihe göre sınır: min = "YYYY-MM-DDT00:00"
  const today = new Date().toISOString().slice(0,10);
  const minDateTime = `${today}T00:00`;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{ initialData ? t('editEvent') : t('newEvent') }</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth margin="dense"
          label={t('title')} name="title"
          value={formData.title} onChange={handleChange}
          error={!!errors.title} helperText={errors.title}
        />

        <TextField
          fullWidth margin="dense"
          label={t('dateTime')}
          name="dateTime"
          type="datetime-local"
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: minDateTime }}
          value={formData.dateTime}
          onChange={handleChange}
          error={!!errors.dateTime}
          helperText={errors.dateTime}
        />

        <TextField
          fullWidth select margin="dense"
          label={t('eventType')} name="event_type"
          value={formData.event_type} onChange={handleChange}
          error={!!errors.eventTypeRequired}
          helperText={errors.eventTypeRequired}
        >
          {[
            'Seminar',
            'Workshop',
            'Concert',
            'Sports',
            'Expo',
            'Course',
            'Career and Entrepreneurship',
            'Symposium',
            'Thesis Defense',
            'Ceremony'
          ].map(val => (
            <MenuItem key={val} value={val}>
              {t(val)}
            </MenuItem>
          ))}
        </TextField>

        {userRole === 'personel_admin' && (
          <TextField
            fullWidth select margin="dense"
            label={t('unit')} name="unit_id"
            value={formData.unit_id} onChange={handleChange}
            error={!!errors.unit_id} helperText={errors.unit_id}
          >
            {sortedUnits.map(u => (
              <MenuItem key={u.id} value={u.id}>
                {u.name}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          fullWidth margin="dense"
          label={t('website')} name="website"
          value={formData.website} onChange={handleChange}
          error={!!errors.website} helperText={errors.website}
        />

        <Box mt={2}>
          <Button variant="outlined" component="label">
            {image?.name || t('chooseImage')}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={e => setImage(e.target.files[0])}
            />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('cancel')}</Button>
        <Button variant="contained" onClick={handleSubmit}>
          {initialData ? t('update') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
