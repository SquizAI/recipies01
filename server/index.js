import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Proxy configuration for Python backend
const pythonBackendProxy = createProxyMiddleware({
  target: 'https://recipe-extractor-api.onrender.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // Keep /api prefix
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Backend service unavailable' });
  }
});

// Use proxy middleware
app.use('/api', pythonBackendProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(port, () => {
  console.log(`Proxy server running on port ${port}`);
});