require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const aiRoutes = require('./routes/ai');

const app = express();
// Render automatically provides a PORT environment variable
const PORT = process.env.PORT || 5000;

// Security: Helmet helps secure your apps by setting various HTTP headers
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: '*', // For production, you might want to restrict this to your app's domain if applicable
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);

// Health check for Render's zero-downtime deploys and monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'YeahMoney Backend',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
