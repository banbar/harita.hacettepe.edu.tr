// src/components/ChangePasswordModal.js

import React, { useState } from 'react';
import {
  Modal,
  Box,
  TextField,
  Button,
  Typography,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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

export default function ChangePasswordModal({ open, onClose, onPasswordChanged }) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [alert, setAlert]                     = useState({ open:false, severity:'info', msg:'' });

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      setAlert({ open:true, severity:'warning', msg: t('changePassword.errors.required') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlert({ open:true, severity:'error', msg: t('changePassword.errors.mismatch') });
      return;
    }

    try {
      const { data } = await axios.put(
        `${process.env.REACT_APP_API_URL}/change-password`,
        { newPassword },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setAlert({ open:true, severity:'success', msg: data.message });
      onPasswordChanged();
    } catch (err) {
      setAlert({
        open:true,
        severity:'error',
        msg: err.response?.data?.message || t('changePassword.errors.default')
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8, color: '#1565c0' }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" gutterBottom color="primary">
          {t('changePassword.title')}
        </Typography>

        <Typography variant="body2" sx={{ mb:2, color:'warning.main' }}>
          {t('changePassword.info')}
        </Typography>

        <TextField
          fullWidth
          label={t('changePassword.fields.newPassword')}
          type="password"
          margin="dense"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        <TextField
          fullWidth
          label={t('changePassword.fields.confirmPassword')}
          type="password"
          margin="dense"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        <Box sx={{ display:'flex', justifyContent:'flex-end', mt:2 }}>
          <Button variant="contained" onClick={handleSubmit}>
            {t('changePassword.actions.submit')}
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
