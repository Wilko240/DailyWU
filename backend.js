require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration des clés API (à déplacer vers .env en production)
const API_KEYS = {
    openWeather: process.env.OPENWEATHER_API_KEY || '9607e7582ae003de3f1a70a3b0722e31',
    newsApi: process.env.NEWS_API_KEY || '8cfe1e30e5594795b74a3835e46e4484'
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// ========== WEATHER API ==========
app.get('/api/weather/:city', async (req, res) => {
    try {
        const { city } = req.params;
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=fr&appid=${API_KEYS.openWeather}`
        );

        if (!response.ok) {
            throw new Error('Weather API error');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});

// ========== NEWS API ==========
app.get('/api/news', async (req, res) => {
    try {
        const { query, category, language = 'fr' } = req.query;

        let url = `https://newsapi.org/v2/top-headlines?apiKey=${API_KEYS.newsApi}&language=${language}`;

        if (query) {
            url += `&q=${encodeURIComponent(query)}`;
        }
        if (category) {
            url += `&category=${category}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error('News API error');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('News API error:', error);
        res.status(500).json({ error: 'Failed to fetch news data' });
    }
});

// ========== CRYPTO API (CoinGecko - No API key needed) ==========
app.get('/api/crypto', async (req, res) => {
    try {
        const { ids } = req.query;
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
        );

        if (!response.ok) {
            throw new Error('Crypto API error');
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Crypto API error:', error);
        res.status(500).json({ error: 'Failed to fetch crypto data' });
    }
});

// ========== STOCK/INDEX DATA ==========
// Note: Alpha Vantage and Yahoo Finance have limitations.
// For production, consider using a paid API like Finnhub, Polygon.io, or IEX Cloud
app.get('/api/stocks', async (req, res) => {
    try {
        // Return mock data for now
        // In production, implement proper stock API integration
        const mockData = [
            { symbol: 'TTE', name: 'TotalEnergies', price: 62.45, currency: '€', change: 1.2 },
            { symbol: 'AI.PA', name: 'Air Liquide', price: 178.90, currency: '€', change: -0.5 },
            { symbol: 'PLTR', name: 'Palantir', price: 23.56, currency: '$', change: 3.4 },
            { symbol: 'NVDA', name: 'NVIDIA', price: 495.22, currency: '$', change: 2.1 },
            { symbol: 'GOOGL', name: 'Alphabet', price: 141.80, currency: '$', change: 0.8 },
            { symbol: 'AAPL', name: 'Apple', price: 185.92, currency: '$', change: -0.3 },
            { symbol: 'AMZN', name: 'Amazon', price: 151.94, currency: '$', change: 1.5 },
            { symbol: 'NKE', name: 'Nike', price: 107.45, currency: '$', change: -1.2 }
        ];
        res.json(mockData);
    } catch (error) {
        console.error('Stocks API error:', error);
        res.status(500).json({ error: 'Failed to fetch stock data' });
    }
});

app.get('/api/indices', async (req, res) => {
    try {
        // Return mock data for now
        const mockData = [
            { name: 'S&P 500', symbol: '^GSPC', price: 4783.45, change: 0.75 },
            { name: 'CAC 40', symbol: '^FCHI', price: 7589.32, change: -0.23 }
        ];
        res.json(mockData);
    } catch (error) {
        console.error('Indices API error:', error);
        res.status(500).json({ error: 'Failed to fetch indices data' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}/index.html`);
});
