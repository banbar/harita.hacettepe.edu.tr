import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Tabs, Tab } from '@mui/material';

export default function SupervisorPanel({ userToken, onLogout, onBackToMain }) {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [hatalar, setHatalar] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingHatalar, setLoadingHatalar] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchSurname, setSearchSurname] = useState('');
  const [userSortAsc, setUserSortAsc] = useState(true);
  const [eventSortAsc, setEventSortAsc] = useState(true);
  const [hataSortAsc, setHataSortAsc] = useState(true);
  // hangi tab’ın açık olduğunu tutar: 'users' | 'events' | 'hatalar'
  const [activeTab, setActiveTab] = useState('users');

  // 2FA state
  const [qrCode, setQrCode] = useState(null);
  const [manualKey, setManualKey] = useState(null);
  const [open2FADlg, setOpen2FADlg] = useState(false);
  const [twoFaError, setTwoFaError] = useState('');

  const authHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

  // --- Data fetchers ---
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API_URL}/users`, authHeaders);
      setUsers(res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Kullanıcıları çekerken hata.', severity: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };
  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const res = await axios.get(`${API_URL}/events`, authHeaders);
      setEvents(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Etkinlikleri çekerken hata.', severity: 'error' });
    } finally {
      setLoadingEvents(false);
    }
  };
  const fetchHatalar = async () => {
    setLoadingHatalar(true);
    try {
      const res = await axios.get(`${API_URL}/hatalar`, authHeaders);
      setHatalar(res.data);
    } catch {
      setSnackbar({ open: true, message: 'Hataları çekerken hata.', severity: 'error' });
    } finally {
      setLoadingHatalar(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEvents();
    fetchHatalar();
  }, []);

  // --- 2FA Kurulum Handler ---
  const handleSetup2FA = async () => {
    try {
      const res = await axios.post(
        `${API_URL}/supervisor/2fa/setup`,
        {},
        authHeaders
      );
      if (res.data.success) {
        setQrCode(res.data.qrCode);
        setManualKey(res.data.manualEntryKey);
        setTwoFaError('');
        setOpen2FADlg(true);
      } else {
        setTwoFaError(res.data.message || '2FA kurulumu başarısız.');
        setOpen2FADlg(true);
      }
    } catch (err) {
      setTwoFaError(err.response?.data?.message || '2FA setup hatası.');
      setOpen2FADlg(true);
    }
  };

  // --- Kullanıcı Onay/Onay Kaldırma ---
  const handleVerify = async (id) => {
    try {
      await axios.put(`${API_URL}/users/${id}/verify`, {}, authHeaders);
      setUsers(us => us.map(u => u.id === id ? { ...u, is_verified: true } : u));
      setSnackbar({ open: true, message: 'Kullanıcı onaylandı.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Onaylama hatası.', severity: 'error' });
    }
  };
  const handleUnverify = async (id) => {
   try {
     await axios.put(`${API_URL}/users/${id}/unverify`, {}, authHeaders);
     setUsers(us => us.map(u => u.id === id ? { ...u, is_verified: false } : u));
     setSnackbar({ open: true, message: 'Onay kaldırıldı.', severity: 'info' });
   } catch {
     setSnackbar({ open: true, message: 'Onay kaldırma hatası.', severity: 'error' });
   }
 };

  // --- Kullanıcı Silme Handler ---
  const handleDeleteUser = async (id) => {
    // Basit onay penceresi
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      await axios.delete(`${API_URL}/users/${id}`, authHeaders);
      setUsers(us => us.filter(u => u.id !== id));
      setSnackbar({ open: true, message: 'Kullanıcı silindi.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Kullanıcı silme hatası.', severity: 'error' });
    }
  };
 // Component fonksiyonu içinde, render’dan önce:

// ① Kullanıcıları soyad ve tarihe göre filtrele & sırala
const displayedUsers = users
  .filter(u =>
    u.surname.toLowerCase().includes(searchSurname.toLowerCase())
  )
  .sort((a, b) => {
    const da = new Date(a.registration_date), db = new Date(b.registration_date);
    return userSortAsc ? da - db : db - da;
  });

// ② Etkinlikleri tarihe göre sırala
const displayedEvents = [...events].sort((a, b) => {
  const da = new Date(a.date), db = new Date(b.date);
  return eventSortAsc ? da - db : db - da;
});

// ③ Hataları tarihe göre (record_time) sırala
const displayedHatalar = [...hatalar].sort((a, b) => {
  const da = new Date(a.record_time), db = new Date(b.record_time);
  return hataSortAsc ? da - db : db - da;
});

  const handleCloseSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  // --- “Ana Uygulamaya Dön” Butonu Handler’ı ---
  const handleBackToMain = () => {
    onBackToMain();
  };

    return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Supervisor Panel</Typography>
        <Box>
          {/* — ➊ Tab’lar — */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            textColor="primary"
            indicatorColor="primary"
            sx={{ mb: 2 }}
          >
            <Tab label="Kullanıcılar" value="users" />
            <Tab label="Etkinlikler" value="events" />
            <Tab label="Hatalar" value="hatalar" />
          </Tabs>

          {/* — Aksiyon Butonları — */}
          <Box display="flex" gap={1}>
            <Button variant="outlined" color="primary" onClick={handleBackToMain}>
              Ana Uygulamaya Dön
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleSetup2FA}>
              2FA Kurulum
            </Button>
            <Button onClick={() => { fetchUsers(); fetchEvents(); fetchHatalar(); }}>
              Yenile
            </Button>
            <Button color="error" variant="contained" onClick={onLogout}>
              Çıkış Yap
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 2FA QR Kod Modalı */}
      <Dialog open={open2FADlg} onClose={() => setOpen2FADlg(false)}>
        <DialogTitle>2FA Kurulumu</DialogTitle>
        <DialogContent>
          {twoFaError
            ? <Alert severity="error">{twoFaError}</Alert>
            : (
              <>
                <Typography>QR kod:</Typography>
                <Box component="img" src={qrCode} alt="2FA QR Kod" sx={{ width: '100%', my: 1 }} />
                <Typography>Manuel Anahtar:</Typography>
                <Typography variant="body2"><code>{manualKey}</code></Typography>
              </>
            )
          }
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen2FADlg(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* ————————————— */}
      {/* Kullanıcılar Tab’ı */}
      {activeTab === 'users' && (
        <Box>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <TextField
              label="Soyad Ara"
              size="small"
              value={searchSurname}
              onChange={e => setSearchSurname(e.target.value)}
            />
            <Button size="small" variant="outlined" onClick={() => setUserSortAsc(s => !s)}>
              {userSortAsc ? 'Eski→Yeni' : 'Yeni→Eski'}
            </Button>
          </Box>
          <Paper sx={{ p: 2, mb: 4 }}>
            {loadingUsers
              ? <Box display="flex" justifyContent="center" p={4}><CircularProgress/></Box>
              : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ad</TableCell>
                      <TableCell>Soyad</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell onClick={() => setUserSortAsc(s => !s)} sx={{ cursor:'pointer' }}>
                        Kayıt Tarihi {userSortAsc ? '▲' : '▼'}
                      </TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Onay</TableCell>
                      <TableCell align="right">İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedUsers.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.surname}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          {u.registration_date
                            ? new Date(u.registration_date).toLocaleDateString('tr-TR', {
                                year:'numeric',month:'2-digit',day:'2-digit'
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>{u.is_verified ? '✅' : '❌'}</TableCell>
                        <TableCell align="right">
                          {u.is_verified
                            ? <Button size="small" color="warning" onClick={()=>handleUnverify(u.id)}>Onay Kaldır</Button>
                            : <Button size="small" color="success" onClick={()=>handleVerify(u.id)}>Onayla</Button>
                          }
                          <Button size="small" color="error" sx={{ ml:1 }} onClick={()=>handleDeleteUser(u.id)}>
                            Sil
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            }
          </Paper>
        </Box>
      )}

      {/* ————————————— */}
      {/* Etkinlikler Tab’ı (sadece is_active = true) */}
{activeTab === 'events' && (
  <Paper sx={{ p:2, mb:4 }}>
    <Typography variant="h6" mb={1}>Eklenen Etkinlikler</Typography>
    {loadingEvents
      ? <Box display="flex" justifyContent="center" p={4}><CircularProgress/></Box>
      : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Başlık</TableCell>
              <TableCell>Tarih</TableCell>
              <TableCell>Oluşturan</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedEvents
              .filter(ev => ev.is_active)           
              .map(ev => (
                <TableRow key={ev.id}>
                  <TableCell>{ev.title}</TableCell>
                  <TableCell>
                    {ev.date
                      ? new Date(ev.date).toLocaleDateString('tr-TR', {
                          year:  'numeric',
                          month: '2-digit',
                          day:   '2-digit'
                        })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {ev.creator_name} {ev.creator_surname}
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      )
    }
  </Paper>
)}

      {/* ————————————— */}
      {/* Hatalar Tab’ı (tarihli) */}
      {activeTab === 'hatalar' && (
        <Paper sx={{ p:2, mb:4 }}>
          <Typography variant="h6" mb={1}>Eklenen Hatalar</Typography>
          {loadingHatalar
            ? <Box display="flex" justifyContent="center" p={4}><CircularProgress/></Box>
            : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hata Türü</TableCell>
                    <TableCell>Açıklama</TableCell>
                    <TableCell>Tarih</TableCell>   {/* yeni sütun */}
                    <TableCell>Oluşturan</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedHatalar.map(h => (
                    <TableRow key={h.id}>
                      <TableCell>{h.update_type}</TableCell>
                      <TableCell>{h.description}</TableCell>
                      <TableCell>
                        {new Date(h.record_time).toLocaleDateString('tr-TR', {
                          year:'numeric',month:'2-digit',day:'2-digit'
                        })}
                      </TableCell>
                      <TableCell>{h.creator_name} {h.creator_surname}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          }
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width:'100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
