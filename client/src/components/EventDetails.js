// src/components/EventDetails.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Link } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';

const EventDetails = ({
  event,
  userRole,
  userToken,
  setEvents,
  currentUserId,
  setSnackbar,
}) => {
  const { t } = useTranslation();
  const allowedRoles = ['student_admin', 'personel_admin', 'supervisor', 'etkinlik'];
  const canDelete = allowedRoles.includes(userRole);

  // --- Tarih formatlama ---
  const dateObj = event.date ? new Date(event.date) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : t('notSpecified');

  // --- Zaman formatlama ---
  const formattedTime = event.time
    ? event.time.includes(':')
      ? event.time.slice(0, 5)
      : event.time
    : t('notSpecified');

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('confirmDeleteEvent'))) return;

    const eventId = Number(id);
    try {
      await axios.delete(`${API_URL}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setSnackbar({ open: true, message: t('eventDeleted'), severity: 'success' });
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (error) {
      if (error.response?.status === 404) {
        setSnackbar({ open: true, message: t('eventDeleted'), severity: 'success' });
        setEvents(prev => prev.filter(ev => ev.id !== eventId));
      } else {
        console.error('Delete error:', error);
        setSnackbar({ open: true, message: t('eventDeleteError'), severity: 'error' });
      }
    }
  };

  return (
    <Box>
      {/* Resim varsa göster, tıklayınca yeni pencerede aç; carousel ile aynı stil */}
      {event.image_path && (
        <Box
          component="img"
          src={`${API_URL}${event.image_path}`}
          alt={event.title}
          onError={e => console.log(`Broken img src: ${e.target.src}`)}
          onClick={() => window.open(`${API_URL}${event.image_path}`, '_blank')}
          sx={{
            width: 240,
            height: 160,
            objectFit: 'cover',
            mb: 1,
            cursor: 'pointer',
            borderRadius: 1,
            transition: 'transform 0.3s ease',
            transformOrigin: 'center center',
            '&:hover': { transform: 'scale(1.05)' },
          }}
        />
      )}

      {/* Başlık linkli */}
      {event.website ? (
        <Link href={event.website} target="_blank" rel="noopener noreferrer" underline="hover">
          <Typography variant="h6" gutterBottom sx={{ cursor: 'pointer' }}>
            {event.title}
          </Typography>
        </Link>
      ) : (
        <Typography variant="h6" gutterBottom>
          {event.title}
        </Typography>
      )}

      <Typography gutterBottom>
        <strong>{t('date')}:</strong> {formattedDate}
      </Typography>
      <Typography gutterBottom>
        <strong>{t('time')}:</strong> {formattedTime}
      </Typography>
      <Typography gutterBottom>
        <strong>{t('eventType')}:</strong> {t(event.event_type)}
      </Typography>

      {/* Silme butonu */}
      {canDelete && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <IconButton
            color="secondary"
            size="small"
            title={t('deleteEvent')}
            onClick={e => handleDelete(e, event.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

EventDetails.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    date: PropTypes.string,
    time: PropTypes.string,
    event_type: PropTypes.string.isRequired,
    website: PropTypes.string,
    image_path: PropTypes.string,
  }).isRequired,
  currentUserId: PropTypes.number.isRequired,
  userToken: PropTypes.string.isRequired,
  userRole: PropTypes.string.isRequired,
  setEvents: PropTypes.func.isRequired,
  setSnackbar: PropTypes.func.isRequired,
};

export default EventDetails;
