// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const login = (username, password) => {
  return axios.post(`${API_BASE_URL}/login`, { username, password });
};

export const register = (username, password, role) => {
  return axios.post(`${API_BASE_URL}/register`, { username, password, role });
};

export const addHata = (hata, token) => {
  return axios.post(`${API_BASE_URL}/add-hata`, hata, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const getHatalar = () => {
  return axios.get(`${API_BASE_URL}/hatalar`);
};

export const updateHata = (id, hata, token) => {
  return axios.put(`${API_BASE_URL}/hatalar/${id}`, hata, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const deleteHata = (id, token) => {
  return axios.delete(`${API_BASE_URL}/hatalar/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
