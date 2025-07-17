const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Konfigurasi Middleware yang Diperkuat
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allowed origins
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Enhanced Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('Body:', req.body);
  next();
});

// API Response Standardization
const standardizeResponse = (data, meta) => {
  return {
    success: true,
    data: data || [],
    meta: meta || {
      current_page: 1,
      total_pages: 1,
      per_page: 10,
      total_count: data?.length || 0
    }
  };
};

// Enhanced Proxy Endpoint
app.get('/api/ideas', async (req, res) => {
  const baseUrl = 'https://suitmedia-backend.suitdev.com/api/ideas';
  
  // Validasi dan sanitasi parameter
  const pageNumber = Math.max(1, parseInt(req.query['page[number]']) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query['page[size]']) || 10));
  const sort = ['-published_at', 'published_at'].includes(req.query.sort) 
    ? req.query.sort 
    : '-published_at';

  const params = {
    'page[number]': pageNumber,
    'page[size]': pageSize,
    'sort': sort,
    'append[]': 'small_image',
    'append[]': 'medium_image'
  };

  try {
    console.log('Mengakses API dengan parameter:', params);
    
    const response = await axios.get(baseUrl, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': process.env.API_KEY ? `Bearer ${process.env.API_KEY}` : undefined
      },
      timeout: 8000,
      validateStatus: (status) => status < 500
    });

    // Standardisasi response
    let responseData = response.data;
    
    // Jika response tidak memiliki meta, buat manual
    if (!responseData.meta) {
      responseData.meta = {
        current_page: pageNumber,
        per_page: pageSize,
        total_pages: Math.ceil(responseData.data?.length / pageSize) || 1,
        total_count: responseData.data?.length || 0
      };
    }

    // Pastikan data selalu berupa array
    if (!Array.isArray(responseData.data)) {
      responseData.data = [responseData.data].filter(Boolean);
    }

    res.json(standardizeResponse(responseData.data, responseData.meta));

  } catch (error) {
    console.error('Error Detail:', {
      message: error.message,
      code: error.code,
      config: error.config,
      stack: error.stack
    });

    const errorResponse = {
      success: false,
      error: {
        code: error.response?.status || 500,
        message: error.response?.data?.message || error.message,
        details: error.response?.data || null
      }
    };

    res.status(error.response?.status || 500).json(errorResponse);
  }
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: 'Endpoint tidak ditemukan',
      suggestedEndpoints: [
        'GET /api/ideas',
        'GET /health'
      ]
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  
  res.status(500).json({
    success: false,
    error: {
      code: 500,
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }
  });
});

// Server Startup
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`🔌 API Endpoint: http://localhost:${PORT}/api/ideas`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
});