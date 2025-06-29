require('dotenv').config();
const cron = require('node-cron');
const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto     = require('crypto');

console.log('EMAIL_HOST=', process.env.EMAIL_HOST);
console.log('EMAIL_PORT=', process.env.EMAIL_PORT);
console.log('EMAIL_SECURE=', process.env.EMAIL_SECURE);
const app = express();
const port = 8000;
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const qrcode    = require('qrcode');
// CORS ayarları
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.post(
  '/api/supervisor/2fa/setup',
  authenticateSupervisor,
  async (req, res) => {
    // 1) Yeni secret oluştur
    const secret = speakeasy.generateSecret({
      name: `HacettepeGIS (${req.user.email})`,
      length: 20
    });

    // 2) Kullanıcı kaydını güncelle
    await client.query(
      `UPDATE users
         SET two_factor_secret=$1,
             two_factor_enabled=TRUE
       WHERE id=$2`,
      [secret.base32, req.user.id]
    );

    // 3) QR kodu oluştur
    qrcode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) return res.status(500).json({ success:false, message:'QR kodu üretilemedi.' });
      res.json({
        success: true,
        qrCode: dataUrl,          // <img src="{qrCode}" />
        manualEntryKey: secret.base32
      });
    });
  }
);

// 15 dakikada maksimum 100 istek
const postLimiter  = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 dakika
  max: 750,                   // bu süre içinde en fazla 750 istek
  standardHeaders: true,      // 
  legacyHeaders: false,       // 
  message: {
    success: false,
    message: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika sonra tekrar deneyin.'
  }
});
app.use(postLimiter);

// JWT doğrulama fonksiyonu
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}
function authorizeAdminTypes(req, res, next) {
  authenticateToken(req, res, () => {
    const { role } = req.user;
    if (['supervisor','personel_admin','student_admin','etkinlik'].includes(role)) {
      return next();
    }
    return res.status(403).json({ success:false, message:'Yetkisiz.' });
  });
}

// Admin rolünü doğrulama middleware'i
function authenticateAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        if (req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ success: false, message: 'Yetkisiz: Sadece adminler bu işlemi gerçekleştirebilir.' });
        }
    });
}

app.set('trust proxy', 1);
const multer = require('multer');
// storage ayarı — önceki örnekteki gibi
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, 'uploads', 'events')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + Date.now() + ext);
  }
});
// File filter ve limits ekliyoruz
const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,  // 100 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    // MIME tipini de kontrol edelim
    if (allowedExt.includes(ext) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Yalnızca JPG, JPEG veya PNG dosyalarına izin verilmektedir.'));
    }
  }
});
app.use(bodyParser.json());
app.use(cors());
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    req.user = payload;    // artık req.user.id, req.user.role, req.user.email var
    next();
  });
}
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
const client = new Client({
    user:     process.env.PGUSER,  
    host:     process.env.PGHOST,    
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port:     parseInt(process.env.PGPORT, 10), 
  });

client.connect()
    .then(() => console.log('Veritabanına bağlanıldı!'))
    .catch(err => console.error('Bağlantı hatası:', err.stack));

// Statik dosyalara (HTML, CSS, JS) erişim sağla
app.use(express.static(path.join(__dirname, 'public')));


// Kayıt & Aktivasyon E-postası
// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const {
      username,
      password,
      role,
      name,
      surname,
      email,
      community,
      student_no,
      unit_id // only required for personel_admin
    } = req.body;

     // 1) Ortak zorunlular
  if (!username || !password || !role || !name || !surname || !email) {
    return res.status(400).json({ success:false, message:'Tüm zorunlu alanları doldurun.' });
  }
      if (role === 'student') {
    if (!community || !student_no) {
      return res.status(400).json({ success:false, message:'Öğrenci için community ve öğrenci no gerekli.' });
    }
  }
  if (role === 'personel_admin') {
    if (!unit_id) {
      return res.status(400).json({ success:false, message:'Personel için birim seçilmelidir.' });
    }
  }

    // Check uniqueness
    const { rows: exists } = await client.query(
      'SELECT 1 FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (exists.length) {
      return res.status(400).json({ success: false, message: 'Kullanıcı veya email zaten kayıtlı.' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    // Activation code
    const code = crypto.randomBytes(16).toString('hex');
    const dbRole = role === 'student' ? 'student_admin' : role;
    // Insert into DB
    await client.query(
      `INSERT INTO users
         (username,password,role,name,surname,email,activation_code,community,student_no,unit_id)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        username, hashed, dbRole, name, surname,
        email, code, community, student_no,
        role === 'personel_admin' ? unit_id : null
      ]
    );
  
    // 5) transporter’ı kur
    let transporter, mailFrom;
    if (process.env.NODE_ENV === 'development') {
       try {
    // Ethereal test hesabı oluştur
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    mailFrom = `"Hacettepe GIS (Test)" <${testAccount.user}>`;
  } catch (err) {
    console.error('Ethereal bağlantı hatası, JSON transport fallback yapılıyor:', err);
    // JSON transport: gerçek SMTP yerine konsola JSON basacak
    transporter = nodemailer.createTransport({ jsonTransport: true });
    mailFrom = `"Hacettepe GIS (Mock)" <no-reply@hacettepe.local>`;
  }
    } else {
      // --- PRODUCTION: Üniversite SMTP ---
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,             // smtp.gmail.com
        port: parseInt(process.env.EMAIL_PORT, 10),  // 587
        secure: process.env.EMAIL_SECURE === 'true', // false => STARTTLS
        auth: {
          user: process.env.EMAIL_USER,           // haritahacettepe@gmail.com
          pass: process.env.EMAIL_PASS            // uygulama şifresi
        }
      });
      mailFrom = `"Hacettepe GIS" <${process.env.EMAIL_USER}>`;
    }
  
    // 6) Mail içeriği ve gönderim
    const verifyLink = `${process.env.SERVER_URL}/api/verify/${code}`;
    const info = await transporter.sendMail({
      from:    mailFrom,
      to:      email,
      subject: 'Hesabınızı doğrulayın',
      html:    `<p>Merhaba ${name},</p>
                <p>Hesabınızı aktifleştirmek için <a href="${verifyLink}">buraya tıklayın</a>.</p>`
    });
        console.log('Ethereal messageId:', info.messageId);
    const previewURL = nodemailer.getTestMessageUrl(info);
    console.log('Ethereal previewURL:', previewURL);
    // 7) Yanıt
    const response = {
      success: true,
      message: 'Kayıt başarılı! Aktivasyon e-postası gönderildi.'
    };
    if (process.env.NODE_ENV === 'development') {
      // Ethereal’da preview URL’i dönmek çok faydalı
      response.previewURL = nodemailer.getTestMessageUrl(info);
    }
  
    res.status(201).json(response);
    } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }

 });
// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password, token } = req.body

  // 1) Zorunlu alanlar
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      code: 'login_missing_fields',
      message: 'E-posta ve parola gerekli.'
    })
  }

  try {
    // 2) Kullanıcı var mı?
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        code: 'login_failed',
        message: 'Kullanıcı bulunamadı.'
      })
    }
    const user = result.rows[0]

    // 3) Email onayı
    if (!user.email_verified) {
      return res.json({
        success: false,
        code: 'login_email_not_verified',
        message: 'E-posta adresiniz doğrulanmadı.'
      })
    }

    // 4) Supervisor onayı
    if (!user.is_verified) {
      return res.json({
        success: false,
        code: 'login_not_approved',
        message: 'Hesabınız supervisor onayı bekliyor.'
      })
    }

    // 5) Şifre kontrolü
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.json({
        success: false,
        code: 'login_failed',
        message: 'Şifre yanlış.'
      })
    }

    // 6) Supervisor için 2FA
    if (user.role === 'supervisor' && user.two_factor_enabled) {
      // 6a) Kod eksikse
      if (!token) {
        return res.json({
          success: false,
          code: '2fa_token_missing',
          message: '2FA kodu gerekli.'
        })
      }
      // 6b) Kod doğrulama
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token,
        window: 1
      })
      if (!verified) {
        return res.json({
          success: false,
          code: '2fa_token_invalid',
          message: 'Geçersiz 2FA kodu.'
        })
      }
    }

    // 7) JWT oluştur ve dön
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    )

    return res.json({
      success: true,
      token: jwtToken,
      role: user.role,
      username: user.username
    })

  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({
      success: false,
      code: 'login_error',
      message: 'Sunucu hatası.'
    })
  }
})
// --- Kullanıcı Onayını Kaldırma (is_verified = FALSE) ---
app.put(
  '/api/users/:id/unverify',
  authenticateSupervisor,              // veya authorizeAdminOrSupervisor
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await client.query(
        'UPDATE users SET is_verified = FALSE WHERE id = $1 RETURNING *',
        [id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
      }
      res.json({ success: true, message: 'Onay kaldırıldı.', user: result.rows[0] });
    } catch (err) {
      console.error('Unverify error:', err);
      res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
  }
);
// 2.1) Ortak transporter tanımı (register kodunuzun dışında)
let transporter, mailFrom;
async function initMailer() {
  if (process.env.NODE_ENV === 'development') {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    mailFrom = `"Hacettepe GIS (Test)" <${testAccount.user}>`;
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT,10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    mailFrom = `"Hacettepe GIS" <${process.env.EMAIL_USER}>`;
  }
}
initMailer().catch(console.error);

// -----------------------------------------------------
// 2.2) POST /api/forgot-password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success:false, message:'E-posta gerekli.' });

  const { rows } = await client.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );
  if (rows.length === 0) {
    return res.status(404).json({ success:false, message:'Bu e-posta ile kayıtlı kullanıcı yok.' });
  }
  const userId = rows[0].id;

  // 6 haneli kod üret
  const code = Math.floor(100000 + Math.random()*900000).toString();
  const hashedCode = await bcrypt.hash(code, saltRounds);
  const expires = new Date(Date.now() + 60*60*1000); // 1 saat

  // Şifreyi kodla override et, bayrağı ve süresini ayarla
  await client.query(
    `UPDATE users
        SET password = $1,
            password_reset_required = TRUE,
            reset_code_expires = $2
      WHERE id = $3`,
    [hashedCode, expires, userId]
  );

  // Kodlu e-posta gönder
  const mailInfo = await transporter.sendMail({
    from: mailFrom,
    to: email,
    subject: 'Hacettepe GIS – Şifre Sıfırlama Kodu',
    html: `<p>Merhaba,</p>
           <p>Şifrenizi sıfırlamak için aşağıdaki 6 haneli kodu kullanabilirsiniz:</p>
           <h2>${code}</h2>
           <p>Bu kod 1 saat içinde geçerlidir.</p>`
  });

  return res.json({ success:true, message:'Şifre sıfırlama kodu e-posta ile gönderildi.' });
});

// -----------------------------------------------------
// 2.3) GET /api/me  – kullanıcı bilgisini alıp reset bayrağını ver
app.get('/api/me', authenticateToken, async (req, res) => {
  const { rows } = await client.query(
    `SELECT id, email, role, password_reset_required
       FROM users
      WHERE id = $1`,
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success:false });
  res.json({ success:true, user: rows[0] });
});

// -----------------------------------------------------
// 2.4) PUT /api/change-password
app.put('/api/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ success:false, message:'Yeni şifre gerekli.' });
  }

  const { rows } = await client.query(
    `SELECT password, password_reset_required, reset_code_expires
       FROM users
      WHERE id = $1`,
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success:false });

  const { password: hashInDb, password_reset_required, reset_code_expires } = rows[0];

  // Eğer user reset bayrağı true ve kod süresi dolmamışsa → doğrudan yeni şifre ata
  if (password_reset_required) {
    if (reset_code_expires < new Date()) {
      return res.status(400).json({ success:false, message:'Kodun süresi dolmuş. Tekrar “Şifremi Unuttum” kullanın.' });
    }
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    await client.query(
      `UPDATE users
          SET password = $1,
              password_reset_required = FALSE,
              reset_code_expires = NULL
        WHERE id = $2`,
      [newHash, req.user.id]
    );
    return res.json({ success:true, message:'Şifreniz başarıyla güncellendi.' });
  }

  // Aksi halde standart “eski şifre kontrolü”
  if (!oldPassword) {
    return res.status(400).json({ success:false, message:'Eski şifrenizi girin.' });
  }
  const match = await bcrypt.compare(oldPassword, hashInDb);
  if (!match) {
    return res.status(400).json({ success:false, message:'Eski şifre yanlış.' });
  }
  const newHash = await bcrypt.hash(newPassword, saltRounds);
  await client.query(
    `UPDATE users
        SET password = $1
      WHERE id = $2`,
    [newHash, req.user.id]
  );
  res.json({ success:true, message:'Şifreniz başarıyla değiştirildi.' });
});
// GET /api/verify/:code
app.get('/api/verify/:code', async (req, res) => {
  const { code } = req.params;

  try {
    // activation_code eşleşen satırı sadece email_verified olarak işaretle
    const result = await client.query(
      `UPDATE users
         SET email_verified = TRUE,
             activation_code = NULL
       WHERE activation_code = $1
       RETURNING id`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(400).send('Geçersiz veya süresi dolmuş kod.');
    }

    res.send(
      'E-postanız doğrulandı! ' +
      'Supervisor onayı bekleniyor; onaylandığında giriş yapabilirsiniz.'
    );
  } catch (err) {
    console.error('Email verify error:', err);
    res.status(500).send('Sunucu hatası.');
  }
});

  
app.get('/api/users', authenticateSupervisor, async (req, res) => {
  try {
    const { rows } = await client.query(`
      SELECT
        u.id,
        u.username,
        u.role,
        u.name,
        u.surname,
        u.email,
        u.is_verified,
        u.registration_date,    -- yeni eklenen tarih sütunu
        CASE
          WHEN u.role = 'student_admin'   THEN u.community
          WHEN u.role = 'personel_admin'  THEN b.name
          ELSE u.community
        END AS affiliation
      FROM users u
      LEFT JOIN units b
        ON u.unit_id = b.id
      ORDER BY u.id;
    `);

    res.json(rows);
  } catch (err) {
    console.error('Kullanıcı listesi alınırken hata:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});


app.get(
  '/api/hatalar',
  authorizeAdminTypes,
  async (req, res) => {
    try {
      const result = await client.query(`
        SELECT
          h.id,
          u.name    AS creator_name,
          u.surname AS creator_surname,
          h.update_type,
          h.description,
          ST_X(h.geom)     AS longitude,
          ST_Y(h.geom)     AS latitude,
          h.record_time,
          h.active
        FROM "update" h
        JOIN users u ON h.user_id = u.id
        WHERE h.active = TRUE
        ORDER BY h.id;
      `);
      res.json(result.rows);
    } catch (error) {
      console.error('Hatalar alınırken sorun:', error);
      res.status(500).json({ success: false, error: 'Veri alınırken sorun.' });
    }
  }
);


// Kullanıcı silme endpoint’i
app.delete('/api/users/:id',authenticateSupervisor, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }
    return res.json({ success: true, message: 'Kullanıcı silindi.' });
  } catch (err) {
    console.error('Kullanıcı silme hatası:', err);
    return res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});
// Rol Güncelleme
app.put('/api/users/:id/role', authenticateSupervisor, async (req, res) => {
  const { id } = req.params;
  const { role, unit_id, community } = req.body;

  // Validate role
  const allowed = ['supervisor', 'personel_admin', 'student_admin'];
  if (!allowed.includes(role)) {
    return res.status(400).json({ success: false, message: 'Geçersiz rol.' });
  }
  // Conditional fields
  if (role === 'personel_admin' && !unit_id) {
    return res.status(400).json({ success: false, message: 'Birim seçilmelidir.' });
  }
  if (role === 'student_admin' && !community) {
    return res.status(400).json({ success: false, message: 'Community bilgisi gereklidir.' });
  }

  try {
    await client.query(
      `UPDATE users SET
         role = $1,
         unit_id = $2,
         community = $3
       WHERE id = $4`,
      [
        role,
        role === 'personel_admin' ? unit_id : null,
        role === 'student_admin' ? community : null,
        id
      ]
    );
    res.json({ success: true, message: 'Kullanıcı rolü başarıyla güncellendi.' });

  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

// server.js

// … diğer import’lar, client.connect(), requireAuth vs. — ya da hiç auth istemiyorsanız olduğu gibi

// Hesap Onaylama (is_verified = TRUE)
app.put('/api/users/:id/verify',authenticateSupervisor, async (req, res) => {
  const { id } = req.params;
  try {
    await client.query(
      'UPDATE users SET is_verified = TRUE WHERE id = $1',
      [id]
    );
    res.json({ success: true, message: 'Kullanıcı onaylandı.' });
  } catch (err) {
    console.error('Verify hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

// Hata Ekleme Endpoint'i - Sadece Adminler İçin
// server.js
app.post(
  '/api/hatalar',
  authorizeAdminTypes,
  async (req, res) => {
    const creatorId = req.user.id; 
    const { update_type, description, latitude, longitude } = req.body;

    // … alan kontrolü …

    const insertSql = `
      INSERT INTO "update"
        (user_id, update_type, description, geom)
      VALUES
        ($1,      $2,          $3,          ST_SetSRID(ST_MakePoint($4, $5), 4326))
      RETURNING *;
    `;
    const params = [ creatorId, update_type, description, longitude, latitude ];

    try {
      const { rows } = await client.query(insertSql, params);
      res.status(201).json({ success: true, hata: rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Hata eklenirken sorun.' });
    }
  }
);


// Hata Güncelleme Endpoint'i
app.put(
  '/api/hatalar/:id',
  authorizeAdminTypes,
  async (req, res) => {
    const { id } = req.params;
    const { update_type, description, latitude, longitude } = req.body;

    // Zorunlu alan kontrolü
    if (
      update_type == null ||
      description == null ||
      latitude == null ||
      longitude == null
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Tüm alanlar gereklidir.' });
    }

    try {
      const result = await client.query(
        `
          UPDATE "update"
            SET update_type = $1,
                description = $2,
                geom = ST_SetSRID(ST_MakePoint($3, $4), 4326)
          WHERE id = $5
        `,
        [update_type, description, longitude, latitude, id]
      );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: 'Kayıt bulunamadı.' });
      }

      res
        .status(200)
        .json({ success: true, message: 'Hata başarıyla güncellendi.' });
    } catch (error) {
      console.error('Güncelleme sırasında hata oluştu:', error);
      res
        .status(500)
        .json({ success: false, message: 'Güncelleme sırasında hata oluştu.' });
    }
  }
);


// Hata Silme Endpoint'i - Sadece Adminler İçin
// src/server.js (veya routes/hatalar.js vs.)



// ======= Birimler Tablosu İçin CRUD Endpoint'leri =======

// Tüm birimleri almak için GET endpoint'i
app.get('/api/birimler', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        id,
        name,
        description,
        website,
        telefon,
        ST_X(geom) AS longitude,
        ST_Y(geom) AS latitude
      FROM units
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Birimler alınırken bir sorun oluştu:', error);
    res.status(500).json({ success: false, error: 'Veri alınırken bir sorun oluştu.' });
  }
});
// app.js (veya server.js) içinde, diğer route’ların yanına ekleyin:

app.get(
  '/api/birimler/me',
  authenticateToken,   // JWT’den req.user.id ve req.user.role geldiğini varsayıyoruz
  async (req, res) => {
    const userId = req.user.id;

    try {
      const { rows } = await client.query(
        `
        SELECT
          b.id,
          b.name,
          b.description,
          b.website,
          b.telefon,
          ST_Y(b.geom) AS latitude,
          ST_X(b.geom) AS longitude
        FROM users u
        LEFT JOIN units b
          ON u.unit_id = b.id
        WHERE u.id = $1
        `,
        [userId]
      );

      if (!rows.length || !rows[0].id) {
        return res
          .status(404)
          .json({ success: false, message: 'Size ait birim bulunamadı.' });
      }

      res.json({ success: true, birim: rows[0] });
    } catch (err) {
      console.error('GET /api/birimler/me error:', err);
      res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
  }
);

// server.js içinde, diğer middleware’lerin yanına
function authorizeAdminOrSupervisor(req, res, next) {
  authenticateToken(req, res, () => {
    const role = req.user.role;
    if (role === 'admin' || role === 'supervisor') {
      return next();
    }
    return res.status(403).json({
      success: false,
      message: 'Yetkisiz: Sadece admin ve supervisor rollerine sahip kullanıcılar bu işlemi gerçekleştirebilir.'
    });
  });
}

function authenticateSupervisor(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user.role === 'supervisor') {
      next();
    } else {
      return res
        .status(403)
        .json({ success: false, message: 'Yetkisiz: Sadece supervisor rolündekiler bu işlemi yapabilir.' });
    }
  });
}
// Yeni birim eklemek için POST endpoint'i (Sadece adminler)
app.post(
  '/api/birimler',
  authenticateSupervisor,
  async (req, res) => {
    const { name, description, latitude, longitude, website, telefon } = req.body;
    if (!name || !description || latitude == null || longitude == null) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, description, latitude ve longitude alanları gereklidir.' });
    }
    try {
      const result = await client.query(
        `INSERT INTO units
           (name, description, geom, website, telefon)
         VALUES
           ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6)
         RETURNING
           id, name, description, website, telefon,
           ST_Y(geom) AS latitude, ST_X(geom) AS longitude`,
        [name, description, longitude, latitude, website, telefon]
      );
      res.status(201).json({
        success: true,
        message: 'Birim başarıyla eklendi.',
        birim: result.rows[0]
      });
    } catch (error) {
      console.error('Birim eklenirken hata:', error);
      res.status(500).json({ success: false, message: 'Birim eklenirken bir sorun oluştu.' });
    }
  }
);

// Mevcut birimi güncellemek için PUT endpoint'i (Sadece adminler)
app.put(
  '/api/birimler/:id',
  authenticateSupervisor,
  async (req, res) => {
    const { id } = req.params;
    const { name, description, latitude, longitude, website, telefon } = req.body;
    if (!name || !description || latitude == null || longitude == null) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, description, latitude ve longitude alanları gereklidir.' });
    }
    try {
      const result = await client.query(
        `UPDATE units SET
           name        = $1,
           description = $2,
           geom        = ST_SetSRID(ST_MakePoint($3, $4), 4326),
           website     = $5,
           telefon     = $6
         WHERE id = $7`,
        [name, description, longitude, latitude, website, telefon, id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Birim bulunamadı.' });
      }
      res.json({ success: true, message: 'Birim başarıyla güncellendi.' });
    } catch (error) {
      console.error('Birim güncellenirken hata:', error);
      res.status(500).json({ success: false, message: 'Birim güncellenirken bir sorun oluştu.' });
    }
  }
);
app.delete(
  '/api/birimler/:id',
  authenticateSupervisor,
  async (req, res) => {
    const { id } = req.params;
    try {
      const result = await client.query(
        'DELETE FROM units WHERE id = $1',
        [id]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Birim bulunamadı.' });
      }
      res.json({ success: true, message: 'Birim başarıyla silindi.' });
    } catch (error) {
      console.error('Birim silinirken hata:', error);
      res.status(500).json({ success: false, message: 'Birim silinirken bir sorun oluştu.' });
    }
  }
);
// ======= Etkinlikler Tablosu İçin CRUD Endpoint'leri =======
// server.js (veya routes/events.js)

app.get('/api/events', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT
        e.id,
        u.name   AS creator_name,
        u.surname AS creator_surname,
        u.role         AS creator_role,
        e.title, 
        e.date,
        e.time,
        e.event_type,
        e.website, 
        image_path,
        ST_X(e.geom) AS longitude,
        ST_Y(e.geom) AS latitude,
        e.active AS is_active
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.active = TRUE
      ORDER BY e.date DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ success:false, message:'Server error.' });
  }
});
// POST /api/events
app.post(
  '/api/events',
  authorizeAdminTypes,
  upload.single('image'),
  async (req, res) => {
    const creatorId = req.user.id;
    let {
      title,
      date,
      time,
      event_type,
      website,
      latitude,
      longitude
    } = req.body;

    // 1) Gelecek değerler string ise sayıya çevir
    latitude  = parseFloat(latitude);
    longitude = parseFloat(longitude);

    // 2) Eğer NaN ise role’a göre default ata
    if (isNaN(latitude) || isNaN(longitude)) {
      if (req.user.role === 'student_admin') {
        const [lat, lon] = mapSettings.communityPosition;
        latitude  = lat;
        longitude = lon;
      }
      else if (req.user.role === 'personel_admin') {
        const { rows } = await client.query(
          `SELECT ST_Y(geom) AS lat, ST_X(geom) AS lon
             FROM units
             WHERE id = (
               SELECT unit_id FROM users WHERE id = $1
             )`,
          [creatorId]
        );
        if (!rows.length) {
          return res.status(400).json({
            success: false,
            message: 'Size ait birim bulunamadı.'
          });
        }
        latitude  = rows[0].lat;
        longitude = rows[0].lon;
      }
      else {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz koordinat.'
        });
      }
    }

    // 3) Zorunlu alanlar kontrolü
    if (!title || !date || !event_type || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanlar gereklidir.'
      });
    }

    // 4) Resim varsa yolunu belirle
    const imagePath = req.file
      ? `/uploads/events/${req.file.filename}`
      : null;

    // 5) Sütunlar güncellendi: location, contact_info, description artık yok
    const sql = `
      INSERT INTO events
        (user_id, title, date, time, event_type, website,
         geom, image_path)
      VALUES
        ($1,        $2,    $3,  $4,         $5,         $6,
         ST_SetSRID(ST_MakePoint($7, $8), 4326), $9)
      RETURNING *;
    `;
    const params = [
      creatorId,
      title,
      date,
      time || null,
      event_type,
      website || null,
      longitude,
      latitude,
      imagePath
    ];

    try {
      const result = await client.query(sql, params);
      res.status(201).json({ success: true, event: result.rows[0] });
    } catch (err) {
      console.error('Insert event error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error.'
      });
    }
  }
);


// PUT /api/events/:id
app.put(
  '/api/events/:id',
  authorizeAdminOrSupervisor,
  upload.single('image'),
  async (req, res) => {
    const { id } = req.params;
    const {
      title,
      date,
      time,
      location,
      event_type,
      contact_info,
      description,
      website,
      latitude,
      longitude
    } = req.body;

    if (!title || !date || !location || !event_type || !contact_info ||
        !description || latitude == null || longitude == null) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // build dynamic SQL if image included
    let sql = `
      UPDATE events SET
        title         = $1,
        date          = $2,
        time          = $3,
        location      = $4,
        event_type    = $5,
        contact_info  = $6,
        description   = $7,
        website       = $8,
        geom          = ST_SetSRID(ST_MakePoint($9,$10),4326)
    `;
    const params = [ title, date, time||null, location, event_type,
                     contact_info, description, website||null,
                     longitude, latitude ];
    if (req.file) {
      sql += `, image_path = $11`;
      params.push(`/uploads/events/${req.file.filename}`);
    }
    params.push(id);
    sql += ` WHERE id = $${params.length}`;

    try {
      const result = await client.query(sql, params);
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Event not found.' });
      }
      res.json({ success: true, message: 'Event updated.' });
    } catch (err) {
      console.error('Update event error:', err);
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  }
);
// DELETE /api/hatalar/:id
app.delete(
  '/api/hatalar/:id',
  authenticateToken,         // req.user.id, req.user.role geliyor
  async (req, res) => {
    const hataId = req.params.id;
    const userId = req.user.id;
    const role   = req.user.role; // 'supervisor' | 'personel_admin' | 'student_admin'

    // 1) Hatanın sahibi kim öğrenelim
    const { rows } = await client.query(
      'SELECT user_id FROM "update" WHERE id = $1',
      [hataId]
    );
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Hata bulunamadı.'
      });
    }
    const ownerId = rows[0].user_id;

    // 2) Yetki kontrolü
    const canDelete =
      role === 'supervisor' ||             // supervisor her şeyi silebilir
      (
        (role === 'personel_admin' || role === 'student_admin') &&
        ownerId === userId                  // admin ise sadece kendi eklediklerini
      );

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Yetkisiz: Bu hatayı silme izniniz yok.'
      });
    }

    // 3) Soft-delete: active sütununu false yap
     await client.query(
      'UPDATE "update" SET active = FALSE WHERE id = $1',
      [hataId]
    );
    return res.json({
      success: true,
      message: 'Güncelleme başarıyla silindi.'
    });
  }
);
// server.js veya routes/events.js içinde, tüm middleware’lerden (authenticateToken, client.connect() vs.)
// sonra tek ve en altta olacak şekilde ekleyin:

// …diğer middleware’lerin (authenticateToken, client.connect(), vs.) hemen ardından…

app.delete(
  '/api/events/:id',
  authenticateToken,
  async (req, res) => {
    const eventId = parseInt(req.params.id, 10);
    const userId  = req.user.id;
    const role    = req.user.role;

    if (isNaN(eventId)) {
      return res.status(400).json({ success:false, message:'Geçersiz etkinlik ID’si.' });
    }

    // 1) Fetch the owner of the event:
    const { rows } = await client.query(
      `SELECT e.user_id AS owner_id
         FROM events e
        WHERE e.id = $1
          AND e.active = TRUE`,
      [eventId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success:false, message:'Etkinlik bulunamadı veya zaten silinmiş.' });
    }
    const ownerId = rows[0].owner_id;

    // 2) Permission check:
    //    - Supervisors can delete anything
    //    - personel_admin, student_admin, etkinlik can delete only their own
    const canDelete =
      role === 'supervisor' ||
      (['personel_admin','student_admin','etkinlik'].includes(role) && ownerId === userId);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Yetkisiz: Bu etkinliği silme izniniz yok.'
      });
    }

    // 3) Soft-delete it:
    await client.query(
      'UPDATE events SET active = FALSE WHERE id = $1',
      [eventId]
    );
    return res.json({ success:true, message:'Etkinlik başarıyla silindi.' });
  }
);

// Otomatik silme görevi
cron.schedule('0 0 * * *', async () => { // Her gün saat 00:00'da çalışır
    const deleteQuery = `
     UPDATE events
    SET active = FALSE
    WHERE active = TRUE
      AND date <= NOW() - INTERVAL '5 days'
    RETURNING id;
  `;
    
    try {
        const result = await client.query(deleteQuery);
        if (result.rowCount > 0) {
            console.log(`${result.rowCount} etkinlik silindi.`);
        } else {
            console.log('Silinecek etkinlik bulunamadı.');
        }
    } catch (error) {
        console.error('Etkinlik silinirken bir hata oluştu:', error);
    }
}, {
    timezone: "Europe/Istanbul" // İhtiyacınıza göre zaman dilimini ayarlayın
});
// En sona, diğer tüm route tanımlarından sonra:
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Boyut limiti aşıldıysa
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu 100 MB’ı aşamaz.'
      });
    }
    // Geçersiz dosya türü veya başka Multer hatası
    return res.status(400).json({
      success: false,
      message: err.message || 'Dosya yükleme hatası.'
    });
  }
  // Başka bir hata varsa default handler’a geç
  next(err);
});

// Sunucuyu başlat
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
