// src/components/EventCarousel.js

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Box, Typography, Link,IconButton  } from '@mui/material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';
import './EventCarousel.css';
import DeleteIcon from '@mui/icons-material/Delete';
const EventCarousel = ({
  eventGroup,
  userRole,
  userToken,
  currentUserId,
  setEvents,
  setSnackbar,
}) => {
  const { t } = useTranslation();
  const [swiper, setSwiper] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const contentRefs = useRef([]);
  const allowedRoles = ['student_admin', 'personel_admin', 'supervisor','etkinlik'];
  const canDelete = allowedRoles.includes(userRole);
 

  useEffect(() => {
    if (swiper) swiper.update();
  }, [swiper, eventGroup]);

  useEffect(() => {
    const el = contentRefs.current[activeIndex];
    if (!el) return;
    el.style.fontSize = el.scrollHeight > el.clientHeight ? '0.875rem' : '1rem';
  }, [activeIndex, eventGroup]);

  const handleDelete = async (e, id) => {
  e.stopPropagation();
  if (!window.confirm(t('confirmDeleteEvent'))) return;

  // 1) id’yi sayısala çevir
  const eventId = Number(id);
  if (isNaN(eventId)) {
    setSnackbar({
      open: true,
      message: t('invalidEventId'),
      severity: 'error'
    });
    return;
  }

  try {
    // 2) DELETE isteği
    await axios.delete(`${API_URL}/events/${eventId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    // 3) Başarı mesajı ve listeden kaldır
    setSnackbar({ open: true, message: t('eventDeleted'), severity: 'success' });
    setEvents(prev => prev.filter(ev => ev.id !== eventId));
  } catch (error) {
    // 4) Eğer 404 ise zaten pasifleşmiş, yine de başarı say
    if (error.response?.status === 404) {
      setSnackbar({ open: true, message: t('eventDeleted'), severity: 'success' });
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } else {
      // gerçek bir hata varsa göster
      console.error('Delete error:', error);
      setSnackbar({ open: true, message: t('eventDeleteError'), severity: 'error' });
    }
  }
};


  return (
    <Box className="carousel-container">
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={10}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop
        className="custom-swiper"
        onSwiper={setSwiper}
        onSlideChange={sw => setActiveIndex(sw.realIndex)}
      >
        {eventGroup.map((event, idx) => (
          <SwiperSlide key={event.id}>
            <Box
              className="carousel-slide-content"
              ref={el => (contentRefs.current[idx] = el)}
            >
              {/* Eğer resim varsa göster */}
              {event.image_path && (
                <Box
                  component="img"
                  src={`${API_URL}${event.image_path}`}
                  alt={event.title || ''}
                  onError={e => console.log(`Broken img src: ${e.target.src}`)}
                  onClick={() => window.open(`${API_URL}${event.image_path}`, '_blank')}
                  sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', mb: 1, cursor: 'pointer' }}
                />
              )}

              {/* Diğer etkinlik bilgileri */}
              
              {/* Tarih ve zaman formatlama */}
              {(() => {
                // --- Tarih formatlama ---
                const dateObj = event.date ? new Date(event.date) : null;
                const formattedDate = dateObj
                  ? dateObj.toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : t('notSpecified');

                // --- Zaman formatlama (HH:MM) ---
                const formattedTime = event.time
                  ? event.time.includes(':')
                    ? event.time.slice(0, 5)
                    : event.time
                  : t('notSpecified');

                return (
                  <>
                    <Typography variant="body1">
                      <strong>{t('date')}:</strong> {formattedDate}
                    </Typography>
                    <Typography variant="body1">
                      <strong>{t('time')}:</strong> {formattedTime}
                    </Typography>
                  </>
                );
              })()}
              <Typography variant="body1"><strong>{t('eventType')}:</strong> {t(event.event_type)}</Typography>
    <Typography variant="h5" gutterBottom>{event.title}</Typography>
              {event.website && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>{t('website')}:</strong>&nbsp;
                  <Link href={event.website} target="_blank" rel="noopener noreferrer">
                    {event.website}
                  </Link>
                </Typography>
              )}
              {/* Yönetici silme kontrolü */}
               {canDelete && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <IconButton
                    size="small"
                    color="secondary"
                    sx={{ color: 'purple' }}
                    title={t('deleteEvent')}
                    onClick={e => handleDelete(e, event.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
};

EventCarousel.propTypes = {
  eventGroup: PropTypes.arrayOf(PropTypes.object).isRequired,
  userToken: PropTypes.string.isRequired,
  currentUserId: PropTypes.number.isRequired,
  userRole:   PropTypes.string.isRequired,
  setEvents: PropTypes.func.isRequired,
  setSnackbar: PropTypes.func.isRequired,
};

export default EventCarousel;
