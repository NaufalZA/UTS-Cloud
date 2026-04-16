const express = require('express');
const { Pool } = require('pg');
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

const app = express();
const port = process.env.PORT || 80;

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueName = 'sampah-' + Date.now().toString() + '-' + file.originalname;
      cb(null, uniqueName);
    }
  })
});

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

pool.query(`
  CREATE TABLE IF NOT EXISTS laporan (
    id SERIAL PRIMARY KEY,
    nama_pelapor VARCHAR(255),
    deskripsi TEXT,
    foto_url TEXT,
    waktu TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error("Gagal membuat tabel:", err));

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM laporan ORDER BY waktu DESC');
    res.render('index', { laporan: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan saat mengambil data.");
  }
});

app.post('/lapor', upload.single('fotoBukti'), async (req, res) => {
  try {
    const { namaPelapor, deskripsi } = req.body;
    const fotoUrl = req.file.location;

    await pool.query(
      'INSERT INTO laporan (nama_pelapor, deskripsi, foto_url) VALUES ($1, $2, $3)',
      [namaPelapor, deskripsi, fotoUrl]
    );

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send("Terjadi kesalahan saat mengirim laporan.");
  }
});

app.listen(port, () => {
  console.log(`Server LaporPah berjalan di port ${port}`);
});