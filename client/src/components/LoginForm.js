// src/components/LoginForm.jsx

import React, { useState } from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import ForgotPasswordModal from './ForgotPasswordModal';
import ChangePasswordModal from './ChangePasswordModal';  // Yeni şifre modal’ınız

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 360,
  bgcolor: 'rgba(227, 242, 253, 0.95)',
  boxShadow: 24,
  p: 3,
  borderRadius: '12px',
  border: '1px solid #90caf9',
};

export default function LoginForm({ open, handleClose, onLoginSuccess }) {
  const { t } = useTranslation();

  // Form alanları
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Akış modalleri
  const [showForgot, setShowForgot] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  // Me’den gelen user verisi
  const [meUser, setMeUser] = useState(null);

  // Snackbar
  const [alert, setAlert] = useState({ open: false, severity: 'info', msg: '' });

  const handleLogin = async () => {
    // 1) Zorunlu alan
    if (!email || !password) {
      setAlert({ open: true, severity: 'warning', msg: t('login_missing_fields') });
      return;
    }
    // 2) 2FA
    if (requires2FA && !twoFaCode) {
      setAlert({ open: true, severity: 'warning', msg: t('login_2fa_required') || '2FA kodu gerekli.' });
      return;
    }

    try {
      // 3) Giriş isteği
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/login`,
        requires2FA
          ? { email, password, token: twoFaCode }
          : { email, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (!data.success && data.code === '2fa_token_missing') {
        setRequires2FA(true);
        setAlert({ open: true, severity: 'warning', msg: data.message });
        return;
      }
      if (!data.success) {
        setAlert({ open: true, severity: 'error', msg: data.message });
        return;
      }

      // 4) Token’ı axios header’a ekle
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      // 5) /me çağrısı → password_reset_required
      const meRes = await axios.get(`${process.env.REACT_APP_API_URL}/me`);
      const { user } = meRes.data;
      setMeUser(user);

      if (user.password_reset_required) {
        // Şifre sıfırlama moduna geç
        setRequirePasswordChange(true);
        return;
      }

      // 6) Normal login akışı
      onLoginSuccess(data.token, data.role, data.username);
      handleClose();

    } catch (err) {
      const code = err.response?.data?.code;
      const message = err.response?.data?.message || t('login_error');
      if (code === '2fa_token_invalid') {
        setRequires2FA(true);
        setAlert({ open: true, severity: 'error', msg: message });
      } else {
        setAlert({ open: true, severity: 'error', msg: message });
      }
    }
  };

  return (
    <>
      {/* -------------------- */}
      {/* 1) Login Modal */}
      {/* -------------------- */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', top: 8, right: 8, color: '#1565c0' }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h6" gutterBottom color="primary">
            {t('login_form_title')}
          </Typography>

          {alert.open && (
            <Alert
              severity={alert.severity}
              onClose={() => setAlert(a => ({ ...a, open: false }))}
              sx={{ mb: 2 }}
            >
              {alert.msg}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('login_email')}
            type="email"
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            fullWidth
            label={t('login_password')}
            type={showPassword ? 'text' : 'password'}
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    onClick={() => setShowPassword(prev => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {requires2FA && (
            <TextField
              fullWidth
              label={t('login_2fa_code') || '2FA Kodu'}
              type="text"
              margin="normal"
              value={twoFaCode}
              onChange={e => setTwoFaCode(e.target.value)}
              helperText={t('login_2fa_helper') || 'Authenticator uygulamanızdaki kodu girin.'}
            />
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowForgot(true)}
            >
              {t('forgot_password_link') || 'Şifremi Unuttum?'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                py: 1.5,
                fontSize: '16px',
                fontWeight: 'bold',
                backgroundColor: '#1976d2',
                '&:hover': { backgroundColor: '#1565c0' }
              }}
            >
              {t('login_button')}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* -------------------- */}
      {/* 2) Forgot Password */}
      {/* -------------------- */}
      <ForgotPasswordModal
        open={showForgot}
        onClose={() => setShowForgot(false)}
      />

      {/* -------------------- */}
      {/* 3) Change Password */}
      {/* -------------------- */}
      {meUser && (
        <ChangePasswordModal
          open={requirePasswordChange}
          onClose={() => {
            setRequirePasswordChange(false);
            handleClose();
          }}
          user={meUser}
          onPasswordChanged={() => {
            // Şifre sıfırlama tamamlandığında
            onLoginSuccess(
              axios.defaults.headers.common['Authorization'].split(' ')[1],
              meUser.role,
              meUser.username
            );
            setRequirePasswordChange(false);
            handleClose();
          }}
        />
      )}

      {/* -------------------- */}
      {/* 4) Global Snackbar */}
      {/* -------------------- */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      >
        <Alert
          severity={alert.severity}
          onClose={() => setAlert(a => ({ ...a, open: false }))}
          sx={{ width: '100%' }}
        >
          {alert.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
