import React, { useState } from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

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

export default function ForgotPasswordModal({ open, onClose }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [alert, setAlert] = useState({ open:false, severity:'info', msg:'' });

  const handleSend = async () => {
    if (!email) {
      setAlert({ open:true, severity:'warning', msg: t('email_required') || 'E-posta gerekli.' });
      return;
    }
    try {
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/forgot-password`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setAlert({ open:true, severity:'success', msg:data.message });
    } catch (err) {
      setAlert({
        open:true,
        severity:'error',
        msg: err.response?.data?.message || t('forgot_password_error') || 'Gönderilirken hata oluştu.'
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom color="primary">
          {t('forgot_password_title') || 'Şifremi Unuttum'}
        </Typography>
        <Typography variant="body2" sx={{ mb:2 }}>
          {t('forgot_password_instructions') || 'Kayıtlı e-postanızı girin; size bir kod göndereceğiz.'}
        </Typography>
        <TextField
          fullWidth
          label={t('email_label') || 'E-posta'}
          type="email"
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <Box sx={{ display:'flex', justifyContent:'flex-end', mt:2 }}>
          <Button variant="contained" onClick={handleSend}>
            {t('send_code_button') || 'Kod Gönder'}
          </Button>
        </Box>
        <Snackbar
          open={alert.open}
          autoHideDuration={4000}
          onClose={() => setAlert(a => ({ ...a, open:false }))}
        >
          <Alert
            severity={alert.severity}
            onClose={() => setAlert(a => ({ ...a, open:false }))}
            sx={{ width:'100%' }}
          >
            {alert.msg}
          </Alert>
        </Snackbar>
      </Box>
    </Modal>
  );
}
