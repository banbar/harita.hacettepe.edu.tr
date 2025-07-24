// src/components/RegisterForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function RegisterForm({ open, handleClose }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('student');
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    surname: '',
    email: '',
    student_no: '',
    community: '',
    unit_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);  // **YENİ**

  const sortedUnits = useMemo(
    () => [...units].sort((a, b) => a.name.localeCompare(b.name)),
    [units]
  );

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        surname: '',
        email: '',
        student_no: '',
        community: '',
        unit_id: ''
      });
      setError('');
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (step === 2 && role === 'personel_admin') {
      axios.get('/api/birimler')
        .then(res => setUnits(res.data))
        .catch(() => setError(t('units_fetch_error')));
    }
  }, [step, role, t]);

  const handleRoleSelect = (newRole) => {
    setRole(newRole);
    setStep(2);
  };
 const domain = process.env.REACT_APP_EMAIL_DOMAIN; 
 const escaped = domain.replace(/\./g, '\\.');
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError(t('register_password_mismatch'));
      return;
    }
    const domainRegex = new RegExp(
  `^[^\\s@]+@${escaped}$`,
  'i'
);
  if (!domainRegex.test(form.email)) {
    setError(t('register_email_domain_error'));
    return;
  }

    setLoading(true);  // **YENİ**
    try {
      await axios.post('/api/register', {
        ...form,
        role,
        unit_id: role === 'personel_admin' ? form.unit_id : undefined,
        community: role === 'student' ? form.community : undefined
      });
      alert(t('register_check_email'));
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || t('register_failed'));
    } finally {
      setLoading(false);  // **YENİ**
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      BackdropProps={{ sx: { backdropFilter: 'blur(4px)' } }}
      PaperProps={{ sx: { p: 2, position: 'relative' } }}  // **relative konum**
    >
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,0.7)',
            zIndex: 10
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {step === 1 ? (
        <>
          <DialogTitle>{t('dialog.roleSelection')}</DialogTitle>
          <DialogContent>
            <Box display="flex" justifyContent="space-around" mt={1}>
              <Button
                variant="contained"
                onClick={() => handleRoleSelect('student')}
                disabled={loading}
              >
                {t('register_role_student')}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleRoleSelect('personel_admin')}
                disabled={loading}
              >
                {t('register_role_personel')}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>{t('cancel')}</Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle>{t('register_form_title')}</DialogTitle>
          <DialogContent>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              <TextField
                label={t('register_username')}
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                fullWidth
                disabled={loading}
              />
              <TextField
                label={t('register_password')}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
                disabled={loading}
              />
              <TextField
                label={t('register_confirm_password')}
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                fullWidth
                disabled={loading}
              />
              <TextField
                label={t('register_name')}
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
                disabled={loading}
              />
              <TextField
                label={t('register_surname')}
                name="surname"
                value={form.surname}
                onChange={handleChange}
                required
                fullWidth
                disabled={loading}
              />
              <TextField
                label={t('register_email')}
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
                disabled={loading}
              />

              {role === 'student' && (
                <>
                  <TextField
                    label={t('register_student_no')}
                    name="student_no"
                    value={form.student_no}
                    onChange={handleChange}
                    required
                    fullWidth
                    disabled={loading}
                  />
                  <TextField
                    label={t('register_community_optional')}
                    name="community"
                    value={form.community}
                    onChange={handleChange}
                    required
                    fullWidth
                    disabled={loading}
                  />
                </>
              )}

              {role === 'personel_admin' && (
                <FormControl fullWidth disabled={loading}>
                  <InputLabel>{t('register_unit_label')}</InputLabel>
                  <Select
                    name="unit_id"
                    value={form.unit_id}
                    onChange={handleChange}
                    label={t('register_unit_label')}
                  >
                    {sortedUnits.map(u => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStep(1)} disabled={loading}>
              {t('register_back')}
            </Button>
            <Button onClick={handleClose} disabled={loading}>
              {t('cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              {t('register_button')}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
