// Configuration des APIs
const API_KEYS = {
    // Alpha Vantage - Gratuit (500 calls/jour)
    alphaVantage: 'demo', // À remplacer par votre clé: https://www.alphavantage.co/support/#api-key
    
    // OpenWeatherMap - Gratuit (1000 calls/jour)
    openWeather: '9607e7582ae003de3f1a70a3b0722e31', // À remplacer par votre clé: https://openweathermap.org/9607e7582ae003de3f1a70a3b0722e31
    
    // NewsAPI - Gratuit (100 calls/jour)
    newsApi: '8cfe1e30e5594795b74a3835e46e4484' // À remplacer par votre clé: https://newsapi.org/
};

// Configuration des symboles à suivre
const STOCKS = ['TTE', 'AI.PA', 'PLTR', 'NVDA', 'GOOGL', 'AAPL', 'AMZN', 'NKE'];
const INDICES = [
    { symbol: '^GSPC', name: 'S&P 500' },
    { symbol: '^FCHI', name: 'CAC 40' }
];
const CRYPTOS = ['bitcoin', 'ethereum', 'binancecoin', 'cardano', 'solana'];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    loadAllData();
    
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadAllData();
    });
    
    // Actualisation automatique toutes les heures
    setInterval(loadAllData, 3600000);
});

// Mise à jour de la date et heure
function updateDateTime() {
    const now = new Date();
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    
    document.getElementById('currentDate').textContent = 
        now.toLocaleDateString('fr-FR', dateOptions);
    document.getElementById('updateTime').textContent = 
        now.toLocaleTimeString('fr-FR', timeOptions);
}

// Chargement de toutes les données
async function loadAllData() {
    updateDateTime();
    
    // Lancer toutes les requêtes en parallèle
    Promise.all([
        loadIndices(),
        loadStocks(),
        loadCrypto(),
        loadEconomyNews(),
        loadAINews(),
        loadWeather(),
        loadRealEstate(),
        loadGeopoliticsNews()
    ]).catch(error => {
        console.error('Erreur lors du chargement des données:', error);
    });
}

// ========== FINANCE ==========

// Charger les indices
async function loadIndices() {
    const container = document.getElementById('indicesContainer');
    
    try {
        // Utilisation de l'API gratuite Yahoo Finance via API alternative
        const data = await fetchWithFallback([
            () => fetchYahooFinance(INDICES.map(i => i.symbol)),
            () => fetchMockIndices() // Fallback avec données de démo
        ]);
        
        container.innerHTML = data.map(index => `
            <div class="index-item">
                <div class="index-info">
                    <div class="index-name">${index.name}</div>
                    <div class="index-symbol">${index.symbol}</div>
                </div>
                <div class="index-value">
                    <div class="price-value">${formatNumber(index.price)}</div>
                    <div class="price-change ${index.change >= 0 ? 'positive' : 'negative'}">
                        ${index.change >= 0 ? '▲' : '▼'} ${Math.abs(index.change).toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur indices:', error);
        container.innerHTML = getEmptyState('📊', 'Impossible de charger les indices');
    }
}

// Charger les actions
async function loadStocks() {
    const container = document.getElementById('stocksContainer');
    
    try {
        const data = await fetchWithFallback([
            () => fetchAlphaVantageStocks(STOCKS),
            () => fetchMockStocks()
        ]);
        
        container.innerHTML = data.map(stock => `
            <div class="stock-item">
                <div class="stock-info">
                    <div class="stock-symbol">${stock.symbol}</div>
                    <div class="stock-name">${stock.name}</div>
                </div>
                <div class="stock-price">
                    <div class="price-value">${formatCurrency(stock.price, stock.currency)}</div>
                    <div class="price-change ${stock.change >= 0 ? 'positive' : 'negative'}">
                        ${stock.change >= 0 ? '▲' : '▼'} ${Math.abs(stock.change).toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur actions:', error);
        container.innerHTML = getEmptyState('📈', 'Impossible de charger les actions');
    }
}

// Charger les cryptomonnaies
async function loadCrypto() {
    const container = document.getElementById('cryptoContainer');
    
    try {
        // CoinGecko API - Gratuit et sans clé requise
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTOS.join(',')}&vs_currencies=usd&include_24hr_change=true`
        );
        const data = await response.json();
        
        const cryptoData = CRYPTOS.map(id => ({
            name: id.charAt(0).toUpperCase() + id.slice(1),
            symbol: id.toUpperCase().substring(0, 3),
            price: data[id]?.usd || 0,
            change: data[id]?.usd_24h_change || 0
        }));
        
        container.innerHTML = cryptoData.map(crypto => `
            <div class="crypto-item">
                <div class="crypto-info">
                    <div class="crypto-name">${crypto.name}</div>
                    <div class="crypto-symbol">${crypto.symbol}</div>
                </div>
                <div class="crypto-price">
                    <div class="price-value">$${formatNumber(crypto.price)}</div>
                    <div class="price-change ${crypto.change >= 0 ? 'positive' : 'negative'}">
                        ${crypto.change >= 0 ? '▲' : '▼'} ${Math.abs(crypto.change).toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur crypto:', error);
        container.innerHTML = getEmptyState('💎', 'Impossible de charger les cryptos');
    }
}

// Charger les actualités économiques
async function loadEconomyNews() {
    const container = document.getElementById('economyNewsContainer');
    
    try {
        const data = await fetchWithFallback([
            () => fetchNewsAPI('economy OR finance OR "stock market"', 'business'),
            () => fetchMockEconomyNews()
        ]);
        
        container.innerHTML = data.slice(0, 5).map(news => `
            <div class="news-item">
                <div class="news-title">${news.title}</div>
                <div class="news-description">${news.description}</div>
                <div class="news-meta">
                    <span class="news-source">${news.source}</span>
                    <a href="${news.url}" target="_blank" class="news-link">Lire →</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur news économie:', error);
        container.innerHTML = getEmptyState('📰', 'Impossible de charger les actualités');
    }
}

// ========== INTELLIGENCE ARTIFICIELLE ==========

async function loadAINews() {
    const container = document.getElementById('aiNewsContainer');
    
    try {
        const data = await fetchWithFallback([
            () => fetchNewsAPI('artificial intelligence OR AI OR machine learning', 'technology'),
            () => fetchMockAINews()
        ]);
        
        container.innerHTML = data.slice(0, 5).map(news => `
            <div class="news-item">
                <div class="news-title">${news.title}</div>
                <div class="news-description">${news.description}</div>
                <div class="news-meta">
                    <span class="news-source">${news.source}</span>
                    <a href="${news.url}" target="_blank" class="news-link">Lire →</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur news IA:', error);
        container.innerHTML = getEmptyState('🤖', 'Impossible de charger les actualités IA');
    }
}

// ========== MÉTÉO ==========

async function loadWeather() {
    const container = document.getElementById('weatherContainer');
    
    try {
        // OpenWeatherMap API
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=Dubai&units=metric&lang=fr&appid=${API_KEYS.openWeather}`
        );
        
        if (!response.ok) {
            throw new Error('API météo non disponible');
        }
        
        const data = await response.json();
        
        const weatherIcons = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Drizzle': '🌦️',
            'Thunderstorm': '⛈️',
            'Snow': '❄️',
            'Mist': '🌫️',
            'Fog': '🌫️'
        };
        
        container.innerHTML = `
            <div class="weather-main">
                <div class="weather-icon">${weatherIcons[data.weather[0].main] || '🌤️'}</div>
                <div>
                    <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
                    <div class="weather-description">${data.weather[0].description}</div>
                </div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">Ressenti</div>
                    <div class="weather-detail-value">${Math.round(data.main.feels_like)}°C</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Humidité</div>
                    <div class="weather-detail-value">${data.main.humidity}%</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Vent</div>
                    <div class="weather-detail-value">${Math.round(data.wind.speed)} km/h</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Pression</div>
                    <div class="weather-detail-value">${data.main.pressure} hPa</div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erreur météo:', error);
        container.innerHTML = getMockWeather();
    }
}

// ========== IMMOBILIER ==========

async function loadRealEstate() {
    const container = document.getElementById('realestateContainer');
    
    // Note: Le scraping de Leboncoin nécessite un backend
    // Pour l'instant, affichage d'un message avec lien direct
    container.innerHTML = `
        <div class="news-item">
            <div class="news-title">🔍 Recherche active sur Leboncoin</div>
            <div class="news-description">
                Critères: Maison à Seignosse, 25-50m², max 350 000€
            </div>
            <div class="news-meta">
                <span class="news-source">Leboncoin.fr</span>
                <a href="https://www.leboncoin.fr/recherche?category=9&locations=Seignosse_40510&real_estate_type=2&price=min-350000&square=25-50" 
                   target="_blank" class="news-link">
                   Voir les annonces →
                </a>
            </div>
        </div>
        <div style="margin-top: 1rem; padding: 1rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; font-size: 0.9rem; color: var(--text-secondary);">
            <strong>💡 Note:</strong> Le scraping automatique de Leboncoin nécessite un backend Node.js. 
            En attendant, cliquez sur le lien pour voir les annonces en direct.
        </div>
    `;
}

// ========== GÉOPOLITIQUE ==========

async function loadGeopoliticsNews() {
    const container = document.getElementById('geopoliticsContainer');
    
    try {
        const data = await fetchWithFallback([
            () => fetchNewsAPI('geopolitics OR international OR world news', 'general'),
            () => fetchMockGeopoliticsNews()
        ]);
        
        container.innerHTML = data.slice(0, 5).map(news => `
            <div class="news-item">
                <div class="news-title">${news.title}</div>
                <div class="news-description">${news.description}</div>
                <div class="news-meta">
                    <span class="news-source">${news.source}</span>
                    <a href="${news.url}" target="_blank" class="news-link">Lire →</a>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur news géopolitique:', error);
        container.innerHTML = getEmptyState('🌍', 'Impossible de charger les actualités');
    }
}

// ========== API HELPERS ==========

async function fetchNewsAPI(query, category) {
    if (API_KEYS.newsApi === 'demo') {
        throw new Error('Clé API requise');
    }
    
    const response = await fetch(
        `https://newsapi.org/v2/top-headlines?q=${encodeURIComponent(query)}&category=${category}&language=fr&apiKey=${API_KEYS.newsApi}`
    );
    
    if (!response.ok) throw new Error('API News error');
    
    const data = await response.json();
    return data.articles.map(article => ({
        title: article.title,
        description: article.description || '',
        source: article.source.name,
        url: article.url
    }));
}

async function fetchAlphaVantageStocks(symbols) {
    // Alpha Vantage a une limitation stricte, donc on utilise des données mock
    return fetchMockStocks();
}

async function fetchYahooFinance(symbols) {
    // Yahoo Finance nécessite un proxy/backend
    return fetchMockIndices();
}

async function fetchWithFallback(functions) {
    for (const fn of functions) {
        try {
            return await fn();
        } catch (error) {
            console.log('Tentative suivante...');
        }
    }
    throw new Error('Toutes les sources ont échoué');
}

// ========== MOCK DATA (Fallback) ==========

function fetchMockIndices() {
    return [
        { name: 'S&P 500', symbol: '^GSPC', price: 4783.45, change: 0.75 },
        { name: 'CAC 40', symbol: '^FCHI', price: 7589.32, change: -0.23 }
    ];
}

function fetchMockStocks() {
    return [
        { symbol: 'TTE', name: 'TotalEnergies', price: 62.45, currency: '€', change: 1.2 },
        { symbol: 'AI.PA', name: 'Air Liquide', price: 178.90, currency: '€', change: -0.5 },
        { symbol: 'PLTR', name: 'Palantir', price: 23.56, currency: '$', change: 3.4 },
        { symbol: 'NVDA', name: 'NVIDIA', price: 495.22, currency: '$', change: 2.1 },
        { symbol: 'GOOGL', name: 'Alphabet', price: 141.80, currency: '$', change: 0.8 },
        { symbol: 'AAPL', name: 'Apple', price: 185.92, currency: '$', change: -0.3 },
        { symbol: 'AMZN', name: 'Amazon', price: 151.94, currency: '$', change: 1.5 },
        { symbol: 'NKE', name: 'Nike', price: 107.45, currency: '$', change: -1.2 }
    ];
}

function fetchMockEconomyNews() {
    return [
        {
            title: "La BCE maintient ses taux d'intérêt",
            description: "La Banque Centrale Européenne a décidé de maintenir ses taux directeurs inchangés.",
            source: "Les Échos",
            url: "#"
        },
        {
            title: "Wall Street termine en hausse",
            description: "Les indices américains clôturent dans le vert portés par le secteur technologique.",
            source: "Bloomberg",
            url: "#"
        }
    ];
}

function fetchMockAINews() {
    return [
        {
            title: "OpenAI lance GPT-5",
            description: "Le nouveau modèle de langage promet des capacités de raisonnement améliorées.",
            source: "TechCrunch",
            url: "#"
        },
        {
            title: "L'IA générative transforme l'industrie",
            description: "Les entreprises adoptent massivement les outils d'intelligence artificielle.",
            source: "MIT Technology Review",
            url: "#"
        }
    ];
}

function fetchMockGeopoliticsNews() {
    return [
        {
            title: "Sommet du G7 à venir",
            description: "Les dirigeants mondiaux se réuniront pour discuter des enjeux économiques et climatiques.",
            source: "Le Monde",
            url: "#"
        },
        {
            title: "Tensions au Moyen-Orient",
            description: "La situation reste tendue dans la région avec de nouvelles négociations en cours.",
            source: "France 24",
            url: "#"
        }
    ];
}

function getMockWeather() {
    return `
        <div class="weather-main">
            <div class="weather-icon">☀️</div>
            <div>
                <div class="weather-temp">28°C</div>
                <div class="weather-description">Ensoleillé</div>
            </div>
        </div>
        <div class="weather-details">
            <div class="weather-detail">
                <div class="weather-detail-label">Ressenti</div>
                <div class="weather-detail-value">30°C</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Humidité</div>
                <div class="weather-detail-value">65%</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Vent</div>
                <div class="weather-detail-value">15 km/h</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Pression</div>
                <div class="weather-detail-value">1013 hPa</div>
            </div>
        </div>
        <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(255, 170, 0, 0.1); border-radius: 8px; font-size: 0.85rem; color: var(--text-secondary);">
            ⚠️ Données météo de démonstration. Configurez votre clé OpenWeatherMap pour les données réelles.
        </div>
    `;
}

// ========== UTILITY FUNCTIONS ==========

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

function formatCurrency(amount, currency = '$') {
    const formatted = amount.toLocaleString('fr-FR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    });
    return currency === '€' ? `${formatted}€` : `$${formatted}`;
}

function getEmptyState(icon, message) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">${icon}</div>
            <div class="empty-state-text">${message}</div>
        </div>
    `;
}
