require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./server/database/db');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(__dirname, 'uploads'));
const databaseFile = path.resolve(process.env.DATABASE_FILE || './server/database/nova-market.sqlite');
fs.mkdirSync(uploadsDir, { recursive: true });
fs.mkdirSync(path.dirname(databaseFile), { recursive: true });

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('REEMPLAZA')) {
  if (process.env.NODE_ENV === 'production') throw new Error('Configura JWT_SECRET en producción.');
  console.warn('AVISO: configura JWT_SECRET en .env antes de publicar.');
}
initDatabase();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : true }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadsDir));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/products', require('./server/routes/products'));
app.use('/api/users', require('./server/routes/users'));
app.use('/api/admin', require('./server/routes/admin'));
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Error interno del servidor.' });
});
app.listen(PORT, () => console.log(`NOVA MARKET disponible en http://localhost:${PORT}`));
