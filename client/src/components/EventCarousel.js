// src/components/EventCarousel.js

import React, { useEffect, useState, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Box, Typography, IconButton, Link } from '@mui/material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { API_URL } from './config';
import DeleteIcon from '@mui/icons-material/Delete';
import './EventCarousel.css';

// Helper: "DD.MM.YYYY" → "YYYY-MM-DD"
const toIso = (dateStr) => {
  const [d, m, y] = dateStr.split('.');
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
};

const EventCarousel = ({
  eventGroup,
  userRole,
  userToken,
  setEvents,
  setSnackbar,
}) => {
  const { t } = useTranslation();
  const [swiper, setSwiper] = useState(null);
  const contentRefs = useRef([]);
  const now = useMemo(() => new Date(), []);
  const allowedRoles = ['student_admin', 'personel_admin', 'supervisor', 'etkinlik'];
  const canDelete = allowedRoles.includes(userRole);

  // Parse date strings into Date objects: support ISO (with 'T'), "YYYY-MM-DD", or "DD.MM.YYYY"
  const datedEvents = useMemo(() =>
    eventGroup.map(ev => {
      let dateObj;
      const dateStr = ev.date || '';
      if (dateStr.includes('T')) {
        dateObj = new Date(dateStr);
      } else if (dateStr.includes('.')) {
        dateObj = new Date(`${toIso(dateStr)}T${ev.time || '00:00'}`);
      } else {
        dateObj = new Date(`${dateStr}T${ev.time || '00:00'}`);
      }
      return { ...ev, dateObj };
    })
  , [eventGroup]);

  // Keep only valid dates, sort by proximity to now
  const finalEvents = useMemo(() =>
    datedEvents
      .filter(ev => ev.dateObj instanceof Date && !isNaN(ev.dateObj))
      .sort((a, b) => Math.abs(a.dateObj - now) - Math.abs(b.dateObj - now))
  , [datedEvents, now]);

  // Reset to first slide when events list updates
  useEffect(() => {
    if (swiper) swiper.slideTo(0, 0);
  }, [finalEvents, swiper]);

  // Adjust font size for overflow
  useEffect(() => {
    if (!swiper) return;
    const idx = swiper.realIndex;
    const el = contentRefs.current[idx];
    if (!el) return;
    el.style.fontSize = el.scrollHeight > el.clientHeight ? '0.875rem' : '1rem';
  }, [swiper, finalEvents]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(t('confirmDeleteEvent'))) return;
    try {
      await axios.delete(`${API_URL}/events/${id}`, { headers: { Authorization: `Bearer ${userToken}` } });
      setSnackbar({ open: true, message: t('eventDeleted'), severity: 'success' });
      setEvents(prev => prev.filter(ev => ev.id !== id));
    } catch (error) {
      if (error.response?.status === 404) {
        setEvents(prev => prev.filter(ev => ev.id !== id));
        setSnackbar({ open: true, message: t('eventDeleted'), severity: 'success' });
      } else {
        console.error(error);
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
        initialSlide={0}
        className="custom-swiper"
        onSwiper={setSwiper}
        onSlideChange={setSwiper}
      >
        {finalEvents.map((event, idx) => {
          const dateObj = event.dateObj;
          const formattedDate = (dateObj instanceof Date && !isNaN(dateObj))
            ? dateObj.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
            : t('notSpecified');
          const formattedTime = event.time?.includes(':')
            ? event.time.slice(0,5)
            : event.time || t('notSpecified');

          return (
            <SwiperSlide key={event.id}>
              <Box
                className="carousel-slide-content"
                ref={el => (contentRefs.current[idx] = el)}
              >
                {event.image_path && (
                  <Box
                    component="img"
                    src={`${API_URL}${event.image_path}`}
                    alt={event.title || ''}
                    onError={e => console.log(`Broken img src: ${e.target.src}`)}
                    onClick={() => window.open(`${API_URL}${event.image_path}`, '_blank')}
                    sx={{
                      width: 220,
                      height: 140,
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

                <Typography variant="body1">
                  <strong>{t('date')}:</strong> {formattedDate}
                </Typography>
                <Typography variant="body1">
                  <strong>{t('time')}:</strong> {formattedTime}
                </Typography>

                <Typography variant="body1">
                  <strong>{t('eventType')}:</strong> {t(event.event_type)}
                </Typography>

                {/* Başlığa tıklandığında website'e yönlendirme */}
                {event.website ? (
                  <Link
                    href={event.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                  >
                    <Typography variant="h5" gutterBottom sx={{ cursor: 'pointer' }}>
                      {event.title}
                    </Typography>
                  </Link>
                ) : (
                  <Typography variant="h5" gutterBottom>
                    {event.title}
                  </Typography>
                )}

                {canDelete && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <IconButton
                      size="small"
                      color="secondary"
                      title={t('deleteEvent')}
                      onClick={e => handleDelete(e, event.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </Box>
  );
};

EventCarousel.propTypes = {
  eventGroup: PropTypes.arrayOf(PropTypes.object).isRequired,
  userRole: PropTypes.string.isRequired,
  userToken: PropTypes.string.isRequired,
  setEvents: PropTypes.func.isRequired,
  setSnackbar: PropTypes.func.isRequired,
};

export default EventCarousel;