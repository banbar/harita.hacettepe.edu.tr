let isLoggedIn = false; // Kullanıcı giriş durumu kontrolü
let userToken = null;   // Kullanıcının giriş token'ı veya bilgileri
let isEditingMode = false;
let userRole = null;

// Haritayı başlat
const map = L.map('map').setView([39.8700, 32.7500], 14);

// OpenStreetMap tile'larını yükle
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

let startPoint, endPoint, routeLayer;
let selectedLatLng;
let isAddingHata = false; // Hata ekleme işlemi için kontrol değişkeni
let redPinMarker; // Kırmızı pin için değişken
let selectedHataMarker = null;
let selectedHataId = null;

// Büyük Kırmızı Pin için ikon tanımlaması
const largeRedPinIcon = L.icon({
    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', // Kırmızı pin URL'si
    iconSize: [48, 48], // Daha büyük ikon boyutu
    iconAnchor: [24, 48], // İkonun haritadaki konumu (ortada alt kısmı)
});

// Düzenleme butonuna tıklandığında düzenleme modunu etkinleştirin
document.getElementById('duzenleButton').addEventListener('click', () => {
    isEditingMode = true;  // Düzenleme moduna geçildi
    alert("Düzenleme modu aktif.");
});

// Kullanıcı Giriş Yapma Fonksiyonu
function loginUser() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (username && password) {
        const data = { username, password };

        fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Giriş başarılı!');
                isLoggedIn = true;
                userToken = result.token;  // Sunucudan dönen token
                userRole = result.role;    // Kullanıcının rolü (admin, editor, normal)

                // Kullanıcının ismini sağ üst köşeye yazdır
                const registerSection = document.getElementById('registerSection');
                registerSection.innerHTML = `<span>Hoş geldiniz, ${username}</span> <button onclick="logoutUser()" style="margin-left: 10px;">Çıkış Yap</button>`;

                document.getElementById('hataEkleButton').disabled = false;
                document.getElementById('loginForm').style.display = 'none';

                // Admin ve Editör'e özel butonları göster
                if (userRole === 'admin' || userRole === 'editor') {
                    document.getElementById('duzenleButton').style.display = 'inline-block';
                }
            } else {
                alert('Giriş başarısız: ' + result.message);
            }
        })
        .catch(error => console.error('Giriş hatası:', error));
    } else {
        alert('Lütfen kullanıcı adı ve şifre girin.');
    }
}

// Kullanıcı Çıkış Yapma Fonksiyonu
function logoutUser() {
    isLoggedIn = false;
    userToken = null;
    userRole = null;
    alert('Çıkış yapıldı.');

    // Giriş yap butonunu geri getir
    const registerSection = document.getElementById('registerSection');
    registerSection.innerHTML = `<button onclick="showLoginForm()">Giriş Yap</button>`;

    document.getElementById('hataEkleButton').disabled = true;
    document.getElementById('duzenleButton').style.display = 'none';
}

// Kullanıcı Kayıt Olma
function registerUser() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value; // Rol seçimi

    if (username && password && role) {
        const data = { username, password, role };

        fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
                showLoginForm();
            } else {
                alert('Kayıt başarısız: ' + result.message);
            }
        })
        .catch(error => console.error('Kayıt hatası:', error));
    } else {
        alert('Lütfen tüm alanları doldurun.');
    }
}

// Haritaya tıklanarak başlangıç ve bitiş noktalarını belirleme
map.on('click', function (e) {
    if (isAddingHata) {
        return;
    }

    if (!startPoint) {
        startPoint = L.marker(e.latlng, { draggable: true }).addTo(map)
            .bindPopup('Başlangıç Noktası').openPopup();

        // Sağ tıklama olayı ile başlangıç noktasını kaldırma
        startPoint.on('contextmenu', function() {
            map.removeLayer(startPoint);
            startPoint = null;
            // Eğer rota katmanı varsa kaldır
            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
                document.getElementById('routeRequest').textContent = 'Henüz bir istek yapılmadı.';
                document.getElementById('routeResponse').textContent = 'Henüz bir yanıt alınmadı.';
            }
        });
    } else if (!endPoint) {
        endPoint = L.marker(e.latlng, { draggable: true }).addTo(map)
            .bindPopup('Bitiş Noktası').openPopup();

        // Sağ tıklama olayı ile bitiş noktasını kaldırma
        endPoint.on('contextmenu', function() {
            map.removeLayer(endPoint);
            endPoint = null;
            // Eğer rota katmanı varsa kaldır
            if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
                document.getElementById('routeRequest').textContent = 'Henüz bir istek yapılmadı.';
                document.getElementById('routeResponse').textContent = 'Henüz bir yanıt alınmadı.';
            }
        });
    }
});

// Hata Ekleme İşlemi
document.getElementById('hataEkleButton').addEventListener('click', () => {
    if (!isLoggedIn) {
        alert('Yetki Yok: Hata eklemek için giriş yapmalısınız.');
        return;
    }

    isAddingHata = true;
    map.once('click', function (e) {
        selectedLatLng = e.latlng;

        if (redPinMarker) {
            map.removeLayer(redPinMarker);
        }

        redPinMarker = L.marker(e.latlng, { icon: largeRedPinIcon }).addTo(map);

        document.getElementById('hataForm').style.display = 'block';
        document.getElementById('deleteButton').style.display = 'none'; // Yeni hata eklerken sil butonunu gizle
    });
});

function saveHata() {
    if (!isLoggedIn) {
        alert('Yetki Yok: Hata kaydetmek için giriş yapmalısınız.');
        return;
    }

    const isimSoyisim = document.getElementById('isimSoyisim').value;
    const hataTuru = document.getElementById('hataTuru').value;
    const aciklama = document.getElementById('aciklama').value;

    if (selectedHataMarker) {
        // Güncellenen hatanın yeni konumunu ve bilgilerini gönder
        const latitude = selectedHataMarker.getLatLng().lat;
        const longitude = selectedHataMarker.getLatLng().lng;

        const data = {
            isim_soyisim: isimSoyisim,
            hata_turu: hataTuru,
            aciklama: aciklama,
            latitude: latitude,
            longitude: longitude
        };

        fetch(`http://localhost:3000/api/hatalar/${selectedHataId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}` // Token'ı isteğe ekle
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                alert('Hata: ' + result.message);
            } else {
                alert('Hata başarıyla güncellendi!');
                // Tüm hataları yeniden yükle
                loadHatalar(); // Güncellenmiş tüm hataları yükler
            }
        })
        .catch(error => console.error('Fetch error:', error));
    } else if (selectedLatLng) {
        // Yeni hata ekleme işlemi
        const data = {
            isim_soyisim: isimSoyisim,
            hata_turu: hataTuru,
            aciklama: aciklama,
            latitude: selectedLatLng.lat,
            longitude: selectedLatLng.lng
        };

        fetch('http://localhost:3000/api/add-hata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}` // Token'ı isteğe ekle
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (!result.success) {
                alert('Hata: ' + result.message);
            } else {
                alert('Hata başarıyla kaydedildi!');
                // Tüm hataları yeniden yükle
                loadHatalar(); // Veriyi ekledikten sonra mevcut verilerin hepsini tekrar yükler
            }
        })
        .catch(error => console.error('Fetch error:', error));
    }

    closeHataForm();
}

// Hata Silme Fonksiyonu (Sadece adminler yetkili)
function deleteHata() {
    if (!isLoggedIn) {
        alert('Yetki Yok: Hata silmek için giriş yapmalısınız.');
        return;
    }

    if (userRole !== 'admin') {
        alert('Yetki Yok: Hata silme işlemi sadece adminler tarafından yapılabilir.');
        return;
    }

    if (selectedHataId) {
        // DELETE isteği ile sunucuya silme isteği gönder
        fetch(`http://localhost:3000/api/hatalar/${selectedHataId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}` // Token'ı isteğe ekle
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                alert('Hata başarıyla silindi!');
                
                // Marker'ı haritadan hemen kaldır
                if (selectedHataMarker) {
                    map.removeLayer(selectedHataMarker);  // Marker'ı haritadan kaldır
                }

                // Formu kapat
                closeHataForm();
                // Tüm hataları yeniden yükle
                loadHatalar(); // Silme işlemi sonrası hataları tekrar yükler
            } else {
                alert('Hata silinirken bir sorun oluştu.');
            }
        })
        .catch(error => console.error('Fetch error:', error));
    }
}

// Sunucudan hata verilerini al ve haritada göster
function loadHatalar() {
    fetch('http://localhost:3000/api/hatalar')  // Sunucudan hata verilerini alıyoruz
        .then(response => response.json())
        .then(data => {
            // Yalnızca hata marker'larını temizleyin
            map.eachLayer(function(layer) {
                if (layer instanceof L.Marker && layer !== startPoint && layer !== endPoint && layer !== redPinMarker) {
                    map.removeLayer(layer);
                }
            });

            // Yeni hata verilerini haritaya ekle
            data.forEach(hata => {
                const marker = L.marker([hata.latitude, hata.longitude], { icon: largeRedPinIcon, draggable: true })
                    .addTo(map)
                    .bindPopup(`<b>${hata.hata_turu}</b><br>${hata.aciklama}`);
                
                // Marker'a tıklandığında hata güncellemesi için işlemler
                marker.on('click', function () {
                    if (!isEditingMode) {
                        alert("Düzenleme modunu açmak için 'Düzenle' butonuna tıklayın.");
                        return;
                    }

                    selectedHataId = hata.id;
                    selectedHataMarker = marker;

                    // Formu doldur
                    document.getElementById('isimSoyisim').value = hata.isim_soyisim;
                    document.getElementById('hataTuru').value = hata.hata_turu;
                    document.getElementById('aciklama').value = hata.aciklama;
                    document.getElementById('hataForm').style.display = 'block';
                    document.getElementById('deleteButton').style.display = 'inline-block'; // Sil butonunu göster
                });
            });
        })
        .catch(error => console.error('Hatalar yüklenirken bir sorun oluştu:', error));
}

document.addEventListener('DOMContentLoaded', loadHatalar);

// "Ara" butonuna tıklama olayını dinle
document.getElementById('searchButton').addEventListener('click', function () {
    const query = document.getElementById('searchBox').value;
    if (query) {
        const minLat = 39.865;
        const minLon = 32.71;
        const maxLat = 39.90;
        const maxLon = 32.77;

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&bounded=1&viewbox=${minLon},${maxLat},${maxLon},${minLat}`;

        const requestDisplay = document.getElementById('requestDisplay');
        requestDisplay.innerHTML = `<h4>Arama İsteği:</h4><pre>GET ${url}</pre>`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const resultsList = document.getElementById('resultsList');
                resultsList.innerHTML = '';

                if (data && data.length > 0) {
                    data.forEach((result) => {
                        const listItem = document.createElement('li');
                        listItem.textContent = result.display_name;
                        listItem.addEventListener('click', function () {
                            const lat = result.lat;
                            const lon = result.lon;
                            map.setView([lat, lon], 18);
                            L.marker([lat, lon]).addTo(map)
                                .bindPopup(result.display_name)
                                .openPopup();
                        });
                        resultsList.appendChild(listItem);
                    });
                } else {
                    const noResult = document.createElement('li');
                    noResult.textContent = 'Konum bulunamadı.';
                    resultsList.appendChild(noResult);
                }
            })
            .catch(error => console.error('Error:', error));
    } else {
        alert('Lütfen bir arama terimi girin.');
    }
});

// Rota Hesaplama Fonksiyonu
function calculateRoute() {
    if (isAddingHata) {
        return;
    }

    if (startPoint && endPoint) {
        const transportMode = document.getElementById('transport').value;
        const start = startPoint.getLatLng();
        const end = endPoint.getLatLng();

        let port;
        if (transportMode === 'driving') {
            port = 5000;
        } else if (transportMode === 'cycling') {
            port = 5001;
        } else if (transportMode === 'walking') {
            port = 5002;
        }

        const url = `http://localhost:${port}/route/v1/${transportMode}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;

        // İstek URL'sini Bilgi Paneline Göster
        const routeRequestDisplay = document.getElementById('routeRequest');
        routeRequestDisplay.textContent = `GET ${url}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                // Yanıtı Bilgi Paneline Göster
                const routeResponseDisplay = document.getElementById('routeResponse');
                routeResponseDisplay.textContent = JSON.stringify(data, null, 2); // JSON'u okunabilir şekilde formatla

                if (routeLayer) {
                    map.removeLayer(routeLayer);
                }

                // Rota geometrisini ekle
                routeLayer = L.geoJSON(data.routes[0].geometry, {
                    style: { color: 'blue', weight: 4 }
                }).addTo(map);
                map.fitBounds(routeLayer.getBounds());
            })
            .catch(error => {
                console.error('Rota hesaplama hatası:', error);
                const routeResponseDisplay = document.getElementById('routeResponse');
                routeResponseDisplay.textContent = `Hata: ${error}`;
            });
    } else {
        alert('Lütfen başlangıç ve bitiş noktalarını seçin.');
    }
}

// Pin'e tıklama işlemi (Bu fonksiyon artık kullanılmıyor, çünkü marker olayları direkt olarak tanımlandı)
// function onPinClick(hata) {
//     // ...
// }

function closeHataForm() {
    isAddingHata = false;
    selectedLatLng = null;
    selectedHataMarker = null;
    selectedHataId = null;
    
    if (redPinMarker) {
        map.removeLayer(redPinMarker);
        redPinMarker = null;
    }

    document.getElementById('hataForm').style.display = 'none';
    document.getElementById('isimSoyisim').value = '';
    document.getElementById('hataTuru').value = '';
    document.getElementById('aciklama').value = '';
}

// Giriş Formunu Göster
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

// Kayıt Formunu Göster
function showRegisterForm() {
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
}
