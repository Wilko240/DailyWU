// Configuration des APIs
const API_KEYS = {
    // Alpha Vantage - Gratuit (500 calls/jour)
    alphaVantage: 'demo', // À remplacer par votre clé: https://www.alphavantage.co/support/#api-key

    // OpenWeatherMap - Gratuit (1000 calls/jour)
    openWeather: '9607e7582ae003de3f1a70a3b0722e31', // À remplacer par votre clé: https://openweathermap.org/9607e7582ae003de3f1a70a3b0722e31

    // NewsAPI - Gratuit (100 calls/jour)
    newsApi: '8cfe1e30e5594795b74a3835e46e4484', // À remplacer par votre clé: https://newsapi.org/

    // GNews - Gratuit (100 calls/jour) - Clé de démo
    gnews: 'demo' // À remplacer par votre clé: https://gnews.io/
};

// Configuration des symboles à suivre
const STOCKS = ['TTE', 'AI.PA', 'PLTR', 'NVDA', 'GOOGL', 'AAPL', 'AMZN', 'NKE'];
const INDICES = [
    { symbol: '^GSPC', name: 'S&P 500', type: 'index' },
    { symbol: '^FCHI', name: 'CAC 40', type: 'index' },
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', coinId: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto', coinId: 'ethereum' }
];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateDateTime();
    loadAllData();
    initChartModal();

    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadAllData();
    });

    // Actualisation automatique toutes les heures
    setInterval(loadAllData, 3600000);
});

// ========== THEME MANAGEMENT ==========

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// ========== NOTIFICATION SYSTEM ==========

function showNotification(type, title, message, duration = 5000) {
    const container = document.getElementById('notificationContainer');

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(notification);

    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
}

// Error handling helpers
function getErrorMessage(error, context) {
    const messages = {
        'Failed to fetch': 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.',
        'NetworkError': 'Erreur réseau. Vérifiez votre connexion.',
        'API News error': 'Service d\'actualités temporairement indisponible.',
        'API météo non disponible': 'Service météo temporairement indisponible.',
        'Clé API requise': 'Configuration API requise. Utilisation des données de démonstration.'
    };

    const errorMsg = error.message || error.toString();
    return messages[errorMsg] || `Erreur lors du chargement de ${context}.`;
}

async function fetchWithRetry(fetchFn, retries = 3, delay = 1000, context = 'données') {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetchFn();
        } catch (error) {
            if (i === retries - 1) {
                console.error(`Échec final pour ${context}:`, error);
                showNotification('error', 'Erreur de chargement', getErrorMessage(error, context));
                throw error;
            }
            console.log(`Tentative ${i + 1}/${retries} échouée pour ${context}, nouvelle tentative...`);
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
}

// ========== CHART MODAL MANAGEMENT ==========

let currentChart = null;
let currentSymbol = null;
let currentType = null;

function initChartModal() {
    const modal = document.getElementById('chartModal');
    const closeBtn = document.getElementById('closeModal');

    // Close modal
    closeBtn.addEventListener('click', closeChartModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeChartModal();
    });

    // Period buttons
    document.querySelectorAll('.chart-period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-period-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const period = parseInt(e.target.dataset.period);
            if (currentSymbol && currentType) {
                loadChartData(currentSymbol, currentType, period);
            }
        });
    });
}

function openChartModal(symbol, name, type) {
    currentSymbol = symbol;
    currentType = type;

    const modal = document.getElementById('chartModal');
    const title = document.getElementById('chartTitle');

    title.textContent = `${name} - Historique des prix`;
    modal.classList.add('active');

    // Load default period (7 days)
    loadChartData(symbol, type, 7);
}

function closeChartModal() {
    const modal = document.getElementById('chartModal');
    modal.classList.remove('active');

    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

async function loadChartData(symbol, type, days = 7) {
    const canvas = document.getElementById('priceChart');
    const ctx = canvas.getContext('2d');

    // Generate mock data (in production, fetch from real API)
    const data = generateMockChartData(days);

    // Destroy previous chart
    if (currentChart) {
        currentChart.destroy();
    }

    // Get theme colors
    const theme = document.documentElement.getAttribute('data-theme');
    const isDark = theme === 'dark';

    // Create new chart
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Prix',
                data: data.values,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary'),
                backgroundColor: isDark
                    ? 'rgba(0, 212, 255, 0.1)'
                    : 'rgba(0, 153, 204, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary'),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    titleColor: isDark ? '#ffffff' : '#1a1a1a',
                    bodyColor: isDark ? '#a0a0a0' : '#666666',
                    borderColor: isDark ? '#2a2a2a' : '#e0e0e0',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Prix: $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: isDark ? '#2a2a2a' : '#e0e0e0',
                        drawBorder: false
                    },
                    ticks: {
                        color: isDark ? '#666666' : '#999999'
                    }
                },
                y: {
                    grid: {
                        color: isDark ? '#2a2a2a' : '#e0e0e0',
                        drawBorder: false
                    },
                    ticks: {
                        color: isDark ? '#666666' : '#999999',
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

function generateMockChartData(days) {
    const labels = [];
    const values = [];
    const now = new Date();
    let basePrice = 100 + Math.random() * 400;

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        if (days <= 7) {
            labels.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
        } else if (days <= 30) {
            labels.push(date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }));
        } else {
            labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
        }

        // Generate random walk
        const change = (Math.random() - 0.5) * basePrice * 0.05;
        basePrice += change;
        values.push(basePrice);
    }

    return { labels, values };
}

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

// Timestamps pour chaque section
const timestamps = {};

// Helper function to get skeleton loader HTML
function getSkeletonLoader(count = 3) {
    return Array(count).fill(0).map(() => `
        <div class="skeleton-item">
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        </div>
    `).join('');
}

// Helper function to format timestamp
function formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes === 1) return 'Il y a 1 minute';
    if (minutes < 60) return `Il y a ${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Il y a 1 heure';
    if (hours < 24) return `Il y a ${hours} heures`;

    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Update timestamps display
function updateTimestamps() {
    Object.keys(timestamps).forEach(key => {
        const element = document.getElementById(`${key}-timestamp`);
        if (element && timestamps[key]) {
            element.textContent = formatTimestamp(timestamps[key]);
        }
    });
}

// Update timestamps every minute
setInterval(updateTimestamps, 60000);

// Chargement de toutes les données
async function loadAllData() {
    updateDateTime();

    // Lancer toutes les requêtes en parallèle
    Promise.all([
        loadIndices(),
        loadStocks(),
        loadEconomyNews(),
        loadAINews(),
        loadWeather(),
        loadRealEstate(),
        loadGeopoliticsNews()
    ]).catch(error => {
        console.error('Erreur lors du chargement des données:', error);
    });
}

// Rafraîchir une section spécifique
async function refreshSection(section) {
    const button = event?.target?.closest('.section-refresh-btn');
    if (button) {
        button.classList.add('refreshing');
    }

    try {
        switch(section) {
            case 'economy':
                await loadEconomyNews();
                break;
            case 'ai':
                await loadAINews();
                break;
            case 'geopolitics':
                await loadGeopoliticsNews();
                break;
            default:
                console.warn('Section inconnue:', section);
        }

        showNotification('success', 'Actualisé', `Section ${section} mise à jour avec succès`);
    } catch (error) {
        console.error(`Erreur lors du rafraîchissement de ${section}:`, error);
        showNotification('error', 'Erreur', `Impossible de rafraîchir la section ${section}`);
    } finally {
        if (button) {
            setTimeout(() => button.classList.remove('refreshing'), 500);
        }
    }
}

// ========== FINANCE ==========

// Charger les indices (incluant Bitcoin et Ethereum)
async function loadIndices() {
    const container = document.getElementById('indicesContainer');
    container.classList.add('loading');

    try {
        // Charger les indices boursiers (mock data)
        const stockIndices = fetchMockIndices();

        // Charger les cryptos (Bitcoin et Ethereum) depuis CoinGecko
        let cryptoData = [];
        try {
            const cryptoIds = INDICES.filter(i => i.type === 'crypto').map(i => i.coinId);
            const response = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds.join(',')}&vs_currencies=usd&include_24hr_change=true`
            );

            if (response.ok) {
                const data = await response.json();
                cryptoData = INDICES.filter(i => i.type === 'crypto').map(crypto => ({
                    name: crypto.name,
                    symbol: crypto.symbol,
                    price: data[crypto.coinId]?.usd || 0,
                    change: data[crypto.coinId]?.usd_24h_change || 0,
                    isCrypto: true
                }));
            }
        } catch (error) {
            console.warn('Erreur chargement crypto, utilisation des données mock:', error);
        }

        // Combiner les données
        const allData = [...stockIndices, ...cryptoData];

        container.classList.remove('loading');
        container.innerHTML = allData.map(index => `
            <div class="index-item" onclick="openChartModal('${index.symbol}', '${index.name}', '${index.isCrypto ? 'crypto' : 'index'}')">
                <div class="index-info">
                    <div class="index-name">${index.name}</div>
                    <div class="index-symbol">${index.symbol}</div>
                </div>
                <div class="index-value">
                    <div class="price-value">${index.isCrypto ? '$' + formatNumber(index.price) : formatNumber(index.price)}</div>
                    <div class="price-change ${index.change >= 0 ? 'positive' : 'negative'}">
                        ${index.change >= 0 ? '▲' : '▼'} ${Math.abs(index.change).toFixed(2)}%
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erreur indices:', error);
        container.classList.remove('loading');
        container.innerHTML = getErrorState(
            '📊',
            'Erreur de chargement',
            getErrorMessage(error, 'indices'),
            loadIndices
        );
    }
}

// Charger les actions (divisées en 2 groupes de 4)
async function loadStocks() {
    const container = document.getElementById('stocksContainer');
    container.classList.add('loading');

    try {
        const data = await fetchWithFallback([
            () => fetchAlphaVantageStocks(STOCKS),
            () => fetchMockStocks()
        ]);

        // Diviser en 2 groupes de 4
        const group1 = data.slice(0, 4);
        const group2 = data.slice(4, 8);

        const createStockGroup = (stocks) => stocks.map(stock => `
            <div class="stock-item" onclick="openChartModal('${stock.symbol}', '${stock.name}', 'stock')">
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

        container.classList.remove('loading');
        container.innerHTML = `
            <div class="stocks-grid">
                <div class="stocks-group">${createStockGroup(group1)}</div>
                <div class="stocks-group">${createStockGroup(group2)}</div>
            </div>
        `;
    } catch (error) {
        console.error('Erreur actions:', error);
        container.classList.remove('loading');
        container.innerHTML = getErrorState(
            '📈',
            'Erreur de chargement',
            getErrorMessage(error, 'actions'),
            loadStocks
        );
    }
}

// Charger les cryptomonnaies
async function loadCrypto() {
    const container = document.getElementById('cryptoContainer');
    container.classList.add('loading');

    try {
        // CoinGecko API - Gratuit et sans clé requise
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTOS.join(',')}&vs_currencies=usd&include_24hr_change=true`
        );

        if (!response.ok) throw new Error('API Crypto error');

        const data = await response.json();

        const cryptoData = CRYPTOS.map(id => ({
            name: id.charAt(0).toUpperCase() + id.slice(1),
            symbol: id.toUpperCase().substring(0, 3),
            price: data[id]?.usd || 0,
            change: data[id]?.usd_24h_change || 0
        }));

        container.classList.remove('loading');
        container.innerHTML = cryptoData.map(crypto => `
            <div class="crypto-item" onclick="openChartModal('${crypto.symbol}', '${crypto.name}', 'crypto')">
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
        container.classList.remove('loading');
        container.innerHTML = getErrorState(
            '💎',
            'Erreur de chargement',
            getErrorMessage(error, 'cryptomonnaies'),
            loadCrypto
        );
    }
}

// Charger les actualités économiques avec sources en temps réel
async function loadEconomyNews() {
    const container = document.getElementById('economyNewsContainer');
    container.classList.add('loading');

    try {
        let data = [];

        // Essayer de charger depuis NewsAPI (fonctionne seulement en production, pas en localhost)
        try {
            if (API_KEYS.newsApi !== 'demo' && API_KEYS.newsApi !== '8cfe1e30e5594795b74a3835e46e4484') {
                const response = await fetch(
                    `https://newsapi.org/v2/top-headlines?category=business&language=fr&pageSize=10&apiKey=${API_KEYS.newsApi}`
                );

                if (response.ok) {
                    const result = await response.json();
                    if (result.articles && result.articles.length > 0) {
                        data = result.articles.map(article => ({
                            title: article.title,
                            description: article.description || article.content?.substring(0, 150) + '...' || '',
                            source: article.source.name,
                            url: article.url,
                            publishedAt: article.publishedAt
                        }));
                        console.log('✅ Economy news loaded from NewsAPI');
                    }
                }
            }
        } catch (error) {
            console.warn('NewsAPI non disponible:', error.message);
        }

        // Si NewsAPI n'a pas fonctionné, utiliser des données mock améliorées
        if (data.length === 0) {
            data = fetchLiveEconomyNews();
            console.log('📝 Using enhanced mock news data (real URLs)');
        }

        container.classList.remove('loading');

        container.innerHTML = data.slice(0, 5).map(news => {
            return `
            <div class="news-item">
                <div class="news-title">${news.title}</div>
                <div class="news-description">${news.description}</div>
                <div class="news-meta">
                    <span class="news-source">${news.source}</span>
                    <a href="${news.url}" target="_blank" rel="noopener noreferrer" class="news-link">Lire →</a>
                </div>
            </div>
        `}).join('');

        // Update timestamp
        timestamps.economy = new Date();
        updateTimestamps();
    } catch (error) {
        console.error('Erreur news économie:', error);
        container.classList.remove('loading');
        container.innerHTML = getErrorState(
            '📰',
            'Erreur de chargement',
            'Impossible de charger les actualités économiques',
            loadEconomyNews
        );
    }
}

// ========== INTELLIGENCE ARTIFICIELLE ==========

async function loadAINews() {
    const container = document.getElementById('aiNewsContainer');
    container.classList.add('loading');

    try {
        let data = [];

        // Essayer de charger depuis NewsAPI
        try {
            if (API_KEYS.newsApi !== 'demo' && API_KEYS.newsApi !== '8cfe1e30e5594795b74a3835e46e4484') {
                const response = await fetch(
                    `https://newsapi.org/v2/everything?q=artificial%20intelligence%20OR%20AI%20OR%20machine%20learning&language=en&sortBy=publishedAt&pageSize=10&apiKey=${API_KEYS.newsApi}`
                );

                if (response.ok) {
                    const result = await response.json();
                    if (result.articles && result.articles.length > 0) {
                        data = result.articles.map(article => ({
                            title: article.title,
                            description: article.description || article.content?.substring(0, 150) + '...' || '',
                            source: article.source.name,
                            url: article.url,
                            publishedAt: article.publishedAt
                        }));
                        console.log('✅ AI news loaded from NewsAPI');
                    }
                }
            }
        } catch (error) {
            console.warn('NewsAPI non disponible pour IA:', error.message);
        }

        // Si NewsAPI n'a pas fonctionné, utiliser des données mock améliorées
        if (data.length === 0) {
            data = fetchLiveAINews();
            console.log('📝 Using enhanced AI news data (real URLs)');
        }

        container.classList.remove('loading');

        container.innerHTML = data.slice(0, 5).map(news => {
            return `
            <div class="news-item">
                <div class="news-title">${news.title}</div>
                <div class="news-description">${news.description}</div>
                <div class="news-meta">
                    <span class="news-source">${news.source}</span>
                    <a href="${news.url}" target="_blank" rel="noopener noreferrer" class="news-link">Lire →</a>
                </div>
            </div>
        `}).join('');

        // Update timestamp
        timestamps.ai = new Date();
        updateTimestamps();
    } catch (error) {
        console.error('Erreur news IA:', error);
        container.classList.remove('loading');
        container.innerHTML = getErrorState(
            '🤖',
            'Erreur de chargement',
            'Impossible de charger les actualités IA',
            loadAINews
        );
    }
}

// ========== MÉTÉO ==========

async function loadWeather() {
    const container = document.getElementById('weatherContainer');
    container.classList.add('loading');

    try {
        // Récupérer météo actuelle et prévisions en parallèle
        const [currentWeather, forecast] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=Dubai&units=metric&lang=fr&appid=${API_KEYS.openWeather}`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=Dubai&units=metric&lang=fr&cnt=40&appid=${API_KEYS.openWeather}`)
        ]);

        if (!currentWeather.ok || !forecast.ok) {
            throw new Error('API météo non disponible');
        }

        const currentData = await currentWeather.json();
        const forecastData = await forecast.json();

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

        // Extraire prévisions pour les 4 prochains jours
        const dailyForecasts = [];
        const seenDays = new Set();
        const today = new Date().toDateString();

        for (const item of forecastData.list) {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();
            const hour = date.getHours();

            // Sauter le jour actuel et prendre une seule prévision par jour (autour de midi: 11h-14h)
            if (dayKey !== today && !seenDays.has(dayKey) && hour >= 11 && hour <= 14) {
                seenDays.add(dayKey);
                dailyForecasts.push({
                    date: date,
                    temp: Math.round(item.main.temp),
                    icon: weatherIcons[item.weather[0].main] || '🌤️',
                    description: item.weather[0].description
                });

                if (dailyForecasts.length === 4) break;
            }
        }

        // Générer données Windguru pour les 2 prochains jours
        const windguruData = generateWindguruForecast();

        container.classList.remove('loading');
        container.innerHTML = `
            <div class="weather-main">
                <div class="weather-icon">${weatherIcons[currentData.weather[0].main] || '🌤️'}</div>
                <div>
                    <div class="weather-temp">${Math.round(currentData.main.temp)}°C</div>
                    <div class="weather-description">${currentData.weather[0].description}</div>
                </div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <div class="weather-detail-label">Ressenti</div>
                    <div class="weather-detail-value">${Math.round(currentData.main.feels_like)}°C</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Humidité</div>
                    <div class="weather-detail-value">${currentData.main.humidity}%</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Vent</div>
                    <div class="weather-detail-value">${Math.round(currentData.wind.speed * 3.6)} km/h</div>
                </div>
                <div class="weather-detail">
                    <div class="weather-detail-label">Pression</div>
                    <div class="weather-detail-value">${currentData.main.pressure} hPa</div>
                </div>
            </div>
            ${dailyForecasts.length > 0 ? `
            <div class="weather-forecast">
                <h4 style="margin: 1rem 0 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">Prévisions 4 jours</h4>
                <div class="forecast-grid">
                    ${dailyForecasts.map(day => `
                        <div class="forecast-day">
                            <div class="forecast-date">${day.date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</div>
                            <div class="forecast-icon">${day.icon}</div>
                            <div class="forecast-temp">${day.temp}°C</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Prévisions Windguru détaillées -->
            <div class="windguru-section">
                <h4 class="windguru-title">
                    <span>🌊 Prévisions Sports Nautiques - Dubai (2 jours)</span>
                    <a href="https://www.windguru.cz/5692" target="_blank" rel="noopener noreferrer" class="windguru-link">
                        Voir Windguru complet →
                    </a>
                </h4>
                <div class="windguru-table-wrapper">
                    <table class="windguru-table">
                        <thead>
                            <tr>
                                <th>Heure</th>
                                ${windguruData.map(d => `<th>${d.time}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="label">Vent (kts)</td>
                                ${windguruData.map(d => `<td class="wind-speed">${d.windSpeed}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="label">Rafales (kts)</td>
                                ${windguruData.map(d => `<td class="wind-gust">${d.windGust}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="label">Direction vent</td>
                                ${windguruData.map(d => `<td>${d.windDir}</td>`).join('')}
                            </tr>
                            <tr class="highlight">
                                <td class="label">Vagues (m)</td>
                                ${windguruData.map(d => `<td class="wave-height">${d.waveHeight}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="label">Période vagues (s)</td>
                                ${windguruData.map(d => `<td>${d.wavePeriod}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="label">Direction vagues</td>
                                ${windguruData.map(d => `<td>${d.waveDir}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="label">Température (°C)</td>
                                ${windguruData.map(d => `<td>${d.temp}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="label">Couverture nuageuse</td>
                                ${windguruData.map(d => `<td class="clouds">${d.clouds}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="label">Précip. (mm/h)</td>
                                ${windguruData.map(d => `<td>${d.precip}</td>`).join('')}
                            </tr>
                            <tr class="highlight">
                                <td class="label">Rating ⭐</td>
                                ${windguruData.map(d => `<td class="rating">${d.rating}</td>`).join('')}
                            </tr>
                            <tr>
                                <td class="label">Marée</td>
                                ${windguruData.map(d => `<td>${d.tide}</td>`).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="windguru-note">
                    💡 Prévisions simulées pour démo. Pour données temps réel, consultez directement
                    <a href="https://www.windguru.cz/5692" target="_blank" rel="noopener noreferrer">Windguru Dubai</a>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erreur météo:', error);
        container.classList.remove('loading');
        container.innerHTML = getMockWeather();
    }
}

// Générer des données Windguru réalistes pour Dubai
function generateWindguruForecast() {
    const now = new Date();
    const forecasts = [];

    // Générer prévisions pour les 48 prochaines heures (toutes les 3h = 16 slots)
    for (let i = 0; i < 16; i++) {
        const time = new Date(now.getTime() + (i * 3 * 60 * 60 * 1000));
        const hour = time.getHours();
        const day = i < 8 ? 'Demain' : 'J+2';

        // Vent plus fort l'après-midi
        const windBase = hour >= 12 && hour <= 18 ? 15 : 8;
        const windSpeed = Math.round(windBase + Math.random() * 8);
        const windGust = Math.round(windSpeed * 1.3);

        // Vagues plus hautes l'après-midi
        const waveBase = hour >= 12 && hour <= 18 ? 1.2 : 0.7;
        const waveHeight = (waveBase + Math.random() * 0.5).toFixed(1);

        // Directions variées
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const windDir = directions[Math.floor(Math.random() * directions.length)];
        const waveDir = directions[Math.floor(Math.random() * directions.length)];

        // Température selon l'heure
        const tempBase = hour >= 12 && hour <= 16 ? 30 : 25;
        const temp = Math.round(tempBase + Math.random() * 3);

        // Nuages
        const cloudLevels = ['☀️ 0/0/0', '⛅ 20/10/0', '☁️ 50/30/10', '☁️ 80/50/20'];
        const clouds = cloudLevels[Math.floor(Math.random() * cloudLevels.length)];

        // Précipitations (rare à Dubai)
        const precip = Math.random() > 0.9 ? (Math.random() * 2).toFixed(1) : '0';

        // Rating basé sur le vent (bon pour kitesurf si 12-25 kts)
        let rating = '⭐⭐';
        if (windSpeed >= 12 && windSpeed <= 18) rating = '⭐⭐⭐⭐';
        else if (windSpeed >= 18 && windSpeed <= 25) rating = '⭐⭐⭐⭐⭐';
        else if (windSpeed >= 8 && windSpeed < 12) rating = '⭐⭐⭐';

        // Marée (simplifié)
        const tidePhases = ['Haute', 'Desc.', 'Basse', 'Mont.'];
        const tide = tidePhases[Math.floor((hour / 6)) % 4];

        forecasts.push({
            time: `${day} ${hour}h`,
            windSpeed,
            windGust,
            windDir,
            waveHeight,
            wavePeriod: Math.round(5 + Math.random() * 3),
            waveDir,
            temp,
            clouds,
            precip,
            rating,
            tide
        });
    }

    return forecasts;
}

// ========== IMMOBILIER ==========

async function loadRealEstate() {
    const container = document.getElementById('realestateContainer');
    container.classList.add('loading');

    try {
        // Générer des annonces simulées réalistes
        const mockListings = generateMockRealEstateListings();

        container.classList.remove('loading');
        container.innerHTML = `
            <div class="realestate-search-info">
                <div class="search-criteria">
                    <strong>🔍 Critères de recherche:</strong> Maison à Seignosse • 25-50m² • Max 350 000€
                </div>
                <a href="https://www.leboncoin.fr/recherche?category=9&locations=Seignosse_40510&real_estate_type=2&price=min-350000&square=25-50"
                   target="_blank"
                   class="search-link-btn"
                   style="display: inline-block; margin-top: 0.5rem; padding: 0.5rem 1rem; background: var(--accent-primary); color: white; border-radius: 6px; text-decoration: none; font-size: 0.9rem;">
                    Voir toutes les annonces sur Leboncoin →
                </a>
            </div>

            <div class="realestate-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1.5rem 0;">
                <div class="stat-card" style="background: rgba(0, 212, 255, 0.1); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent-primary);">~15</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Annonces actives</div>
                </div>
                <div class="stat-card" style="background: rgba(0, 212, 255, 0.1); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent-primary);">280K€</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Prix moyen</div>
                </div>
                <div class="stat-card" style="background: rgba(0, 212, 255, 0.1); padding: 1rem; border-radius: 8px;">
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--accent-primary);">38m²</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">Surface moyenne</div>
                </div>
            </div>

            <div class="realestate-listings">
                ${mockListings.map(listing => `
                    <div class="news-item" style="border-left: 3px solid var(--accent-primary);">
                        <div class="news-title" style="display: flex; justify-content: space-between; align-items: start;">
                            <span>${listing.title}</span>
                            <span style="color: var(--accent-primary); font-weight: bold; white-space: nowrap; margin-left: 1rem;">${listing.price}</span>
                        </div>
                        <div class="news-description">${listing.description}</div>
                        <div class="news-meta" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                            <span class="news-source" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                                <span>📐 ${listing.surface}</span>
                                <span>🛏️ ${listing.rooms}</span>
                                ${listing.distance ? `<span>📍 ${listing.distance}</span>` : ''}
                            </span>
                            <span style="color: var(--text-secondary); font-size: 0.85rem;">${listing.posted}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 170, 0, 0.1); border-radius: 8px; font-size: 0.85rem; color: var(--text-secondary);">
                <strong>💡 Note:</strong> Les annonces ci-dessus sont des exemples simulés. Pour voir les annonces réelles et à jour,
                cliquez sur le bouton "Voir toutes les annonces" ci-dessus. Le scraping automatique de Leboncoin nécessiterait un backend Node.js.
            </div>
        `;
    } catch (error) {
        console.error('Erreur immobilier:', error);
        container.classList.remove('loading');
        container.innerHTML = getErrorState(
            '🏠',
            'Erreur de chargement',
            'Impossible de charger les annonces immobilières',
            loadRealEstate
        );
    }
}

function generateMockRealEstateListings() {
    const types = ['Maison de ville', 'Studio', 'Appartement', 'Petite maison'];
    const features = [
        'proche plage', 'rénové', 'jardin', 'terrasse', 'parking',
        'lumineux', 'calme', 'centre-ville', 'proche commerces'
    ];

    const listings = [
        {
            title: 'Charmante maison de ville',
            price: '295 000€',
            surface: '42m²',
            rooms: '2 pièces',
            distance: '800m plage',
            description: 'Belle maison rénovée avec terrasse, proche de toutes commodités',
            posted: 'Il y a 2 jours'
        },
        {
            title: 'Studio cosy',
            price: '185 000€',
            surface: '28m²',
            rooms: '1 pièce',
            distance: '1.2km plage',
            description: 'Studio lumineux avec coin kitchenette, idéal investissement locatif',
            posted: 'Il y a 5 jours'
        },
        {
            title: 'Appartement avec jardin',
            price: '340 000€',
            surface: '48m²',
            rooms: '2 pièces',
            distance: '600m plage',
            description: 'Rare ! Appartement avec jardin privatif de 50m², parking inclus',
            posted: 'Il y a 1 semaine'
        },
        {
            title: 'Maison de plain-pied',
            price: '275 000€',
            surface: '35m²',
            rooms: '2 pièces',
            distance: '1km plage',
            description: 'Petite maison de plain-pied, calme, proche forêt et commerces',
            posted: 'Il y a 3 jours'
        }
    ];

    return listings;
}

// ========== GÉOPOLITIQUE ==========

async function loadGeopoliticsNews() {
    const container = document.getElementById('geopoliticsContainer');
    container.classList.add('loading');

    try {
        let data = [];

        // Essayer de charger depuis NewsAPI
        try {
            if (API_KEYS.newsApi !== 'demo' && API_KEYS.newsApi !== '8cfe1e30e5594795b74a3835e46e4484') {
                const response = await fetch(
                    `https://newsapi.org/v2/top-headlines?category=general&language=fr&pageSize=10&apiKey=${API_KEYS.newsApi}`
                );

                if (response.ok) {
                    const result = await response.json();
                    if (result.articles && result.articles.length > 0) {
                        data = result.articles.map(article => ({
                            title: article.title,
                            description: article.description || article.content?.substring(0, 150) + '...' || '',
                            source: article.source.name,
                            url: article.url,
                            publishedAt: article.publishedAt
                        }));
                        console.log('✅ Geopolitics news loaded from NewsAPI');
                    }
                }
            }
        } catch (error) {
            console.warn('NewsAPI non disponible pour géopolitique:', error.message);
        }

        // Si NewsAPI n'a pas fonctionné, utiliser des données mock améliorées
        if (data.length === 0) {
            data = fetchLiveGeopoliticsNews();
            console.log('📝 Using enhanced geopolitics news data (real URLs)');
        }

        container.classList.remove('loading');

        container.innerHTML = data.slice(0, 5).map(news => {
            return `
            <div class="news-item">
                <div class="news-title">${news.title}</div>
                <div class="news-description">${news.description}</div>
                <div class="news-meta">
                    <span class="news-source">${news.source}</span>
                    <a href="${news.url}" target="_blank" rel="noopener noreferrer" class="news-link">Lire →</a>
                </div>
            </div>
        `}).join('');

        // Update timestamp
        timestamps.geopolitics = new Date();
        updateTimestamps();
    } catch (error) {
        console.error('Erreur news géopolitique:', error);
        container.classList.remove('loading');
        container.innerHTML = getErrorState(
            '🌍',
            'Erreur de chargement',
            'Impossible de charger les actualités géopolitiques',
            loadGeopoliticsNews
        );
    }
}

// ========== API HELPERS ==========

async function fetchRSSNews(topic) {
    // RSS feeds gratuits pour différents sujets
    const rssFeeds = {
        economy: 'https://www.lesechos.fr/rss/finance-marches.xml',
        ai: 'https://www.artificialintelligence-news.com/feed/',
        geopolitics: 'https://www.lemonde.fr/international/rss_full.xml'
    };

    const feedUrl = rssFeeds[topic];
    if (!feedUrl) throw new Error('Topic not found');

    // Utilisation de rss2json.com (gratuit, pas de clé requise)
    const response = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=10`
    );

    if (!response.ok) throw new Error('RSS Feed error');

    const data = await response.json();

    if (data.status !== 'ok') {
        console.error('RSS parsing error:', data);
        throw new Error('RSS parsing error');
    }

    console.log(`RSS data for ${topic}:`, data.items.slice(0, 2)); // Debug log

    return data.items.map(item => ({
        title: escapeHtml(item.title),
        description: item.description ? escapeHtml(item.description.replace(/<[^>]*>/g, '')).substring(0, 150) + '...' : '',
        source: escapeHtml(data.feed.title),
        url: item.link || item.url || '#'
    }));
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// Fonction pour obtenir des actualités économiques en temps réel (ou simulées intelligemment)
function fetchLiveEconomyNews() {
    // Générer des titres d'actualités économiques pertinents avec des liens vers les vraies sources
    // Les liens pointent vers les sections d'actualités pour avoir toujours du contenu frais
    const newsTemplates = [
        {
            title: "Marchés financiers : analyse du jour",
            description: "Suivez l'évolution des principaux indices boursiers et les dernières tendances des marchés financiers.",
            source: "Les Échos",
            url: "https://www.lesechos.fr/finance-marches"
        },
        {
            title: "Actualités économiques françaises",
            description: "Toute l'actualité économique en France : entreprises, finance, banque, fiscalité et budget.",
            source: "Le Monde",
            url: "https://www.lemonde.fr/economie/"
        },
        {
            title: "Bourse et marchés internationaux",
            description: "Les dernières informations sur les marchés financiers mondiaux, devises et matières premières.",
            source: "Boursorama",
            url: "https://www.boursorama.com/bourse/actualites/"
        },
        {
            title: "Analyses et perspectives économiques",
            description: "Décryptage de l'actualité économique mondiale avec les experts de la finance.",
            source: "BFM Business",
            url: "https://www.bfmtv.com/economie/"
        },
        {
            title: "Finance et entreprises",
            description: "Retrouvez toute l'actualité financière, les résultats d'entreprises et les analyses de marché.",
            source: "La Tribune",
            url: "https://www.latribune.fr/economie/france/"
        },
        {
            title: "Économie et conjoncture",
            description: "Les dernières nouvelles économiques, analyses sectorielles et prévisions macroéconomiques.",
            source: "Les Échos",
            url: "https://www.lesechos.fr/economie-france"
        },
        {
            title: "Marchés et investissements",
            description: "Actualités boursières, conseils d'investissement et stratégies de trading pour investisseurs.",
            source: "Investir",
            url: "https://www.lerevenu.com/bourse"
        },
        {
            title: "Actualités des cryptomonnaies",
            description: "Suivez l'évolution du Bitcoin, Ethereum et des principales cryptos, analyses et perspectives du marché crypto.",
            source: "CoinDesk",
            url: "https://www.coindesk.com/"
        }
    ];

    // Rotation basée sur le jour pour avoir du "nouveau" contenu chaque jour
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const startIndex = dayOfYear % newsTemplates.length;

    // Prendre 6 articles en rotation pour varier le contenu
    const rotatedNews = [
        ...newsTemplates.slice(startIndex),
        ...newsTemplates.slice(0, startIndex)
    ];

    return rotatedNews.slice(0, 6);
}

// Ancienne fonction mock conservée pour compatibilité
function fetchMockEconomyNews() {
    return fetchLiveEconomyNews();
}

// Fonction pour obtenir des actualités IA en temps réel (ou simulées intelligemment)
function fetchLiveAINews() {
    const newsTemplates = [
        {
            title: "Actualités Intelligence Artificielle",
            description: "Les dernières avancées en IA, machine learning, deep learning et technologies émergentes.",
            source: "TechCrunch",
            url: "https://techcrunch.com/tag/artificial-intelligence/"
        },
        {
            title: "Innovations en IA et Machine Learning",
            description: "Découvrez les dernières recherches, outils et applications de l'intelligence artificielle.",
            source: "MIT Technology Review",
            url: "https://www.technologyreview.com/topic/artificial-intelligence/"
        },
        {
            title: "IA : Tendances et développements",
            description: "Analyses approfondies des nouvelles technologies d'IA et leur impact sur la société.",
            source: "Wired",
            url: "https://www.wired.com/tag/artificial-intelligence/"
        },
        {
            title: "Intelligence Artificielle et Technologie",
            description: "Suivez l'évolution de l'IA, des chatbots aux modèles de langage avancés.",
            source: "The Verge",
            url: "https://www.theverge.com/ai-artificial-intelligence"
        },
        {
            title: "Actualités IA et Deep Learning",
            description: "Toute l'actualité sur l'intelligence artificielle, les réseaux de neurones et l'apprentissage profond.",
            source: "VentureBeat",
            url: "https://venturebeat.com/category/ai/"
        },
        {
            title: "IA Générative et LLMs",
            description: "Les dernières nouvelles sur les modèles de langage, IA générative et leurs applications.",
            source: "OpenAI Blog",
            url: "https://openai.com/blog/"
        },
        {
            title: "Recherche et Innovation en IA",
            description: "Publications scientifiques, breakthroughs et découvertes dans le domaine de l'IA.",
            source: "AI News",
            url: "https://artificialintelligence-news.com/"
        },
        {
            title: "IA et Éthique",
            description: "Débats sur l'IA responsable, régulations et impact sociétal des technologies d'IA.",
            source: "AI Ethics",
            url: "https://www.nature.com/subjects/ai-and-machine-learning"
        }
    ];

    // Rotation basée sur le jour pour avoir du "nouveau" contenu chaque jour
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const startIndex = dayOfYear % newsTemplates.length;

    const rotatedNews = [
        ...newsTemplates.slice(startIndex),
        ...newsTemplates.slice(0, startIndex)
    ];

    return rotatedNews.slice(0, 6);
}

// Ancienne fonction mock conservée pour compatibilité
function fetchMockAINews() {
    return fetchLiveAINews();
}

// Fonction pour obtenir des actualités géopolitiques en temps réel (ou simulées intelligemment)
function fetchLiveGeopoliticsNews() {
    const newsTemplates = [
        {
            title: "Actualités Internationales",
            description: "Suivez toute l'actualité internationale, les événements géopolitiques et les relations internationales.",
            source: "Le Monde",
            url: "https://www.lemonde.fr/international/"
        },
        {
            title: "Géopolitique et Relations Internationales",
            description: "Analyses des tensions mondiales, accords diplomatiques et actualités des grandes puissances.",
            source: "France 24",
            url: "https://www.france24.com/fr/"
        },
        {
            title: "Actualités Monde et Politique",
            description: "L'essentiel de l'actualité mondiale : conflits, diplomatie, sommets internationaux.",
            source: "Le Figaro",
            url: "https://www.lefigaro.fr/international/"
        },
        {
            title: "Information Internationale en Direct",
            description: "Toute l'information sur les événements mondiaux, politique internationale et géostratégie.",
            source: "RFI",
            url: "https://www.rfi.fr/"
        },
        {
            title: "Actualités Globales et Géopolitique",
            description: "Actualités mondiales, analyses géopolitiques et couverture des zones de tensions.",
            source: "Reuters",
            url: "https://www.reuters.com/world/"
        },
        {
            title: "Politique Internationale et Diplomatie",
            description: "Suivez les relations entre États, les conflits régionaux et les négociations internationales.",
            source: "AFP",
            url: "https://www.afp.com/fr"
        },
        {
            title: "Enjeux Mondiaux et Géostratégie",
            description: "Analyses approfondies des grands enjeux géopolitiques contemporains.",
            source: "The Guardian",
            url: "https://www.theguardian.com/world"
        },
        {
            title: "Actualités Europe et International",
            description: "Toute l'actualité européenne et internationale, Union européenne, OTAN et organisations mondiales.",
            source: "Euronews",
            url: "https://fr.euronews.com/"
        },
        {
            title: "Politique Étrangère et Conflits",
            description: "Couverture des zones de conflits, crises humanitaires et interventions internationales.",
            source: "BBC World",
            url: "https://www.bbc.com/news/world"
        }
    ];

    // Rotation basée sur le jour pour avoir du "nouveau" contenu chaque jour
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const startIndex = dayOfYear % newsTemplates.length;

    const rotatedNews = [
        ...newsTemplates.slice(startIndex),
        ...newsTemplates.slice(0, startIndex)
    ];

    return rotatedNews.slice(0, 6);
}

// Ancienne fonction mock conservée pour compatibilité
function fetchMockGeopoliticsNews() {
    return fetchLiveGeopoliticsNews();
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

function getErrorState(icon, title, message, retryFn) {
    const retryId = `retry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store retry function globally
    window[retryId] = retryFn;

    return `
        <div class="error-state">
            <div class="error-state-icon">${icon}</div>
            <div class="error-state-title">${title}</div>
            <div class="error-state-message">${message}</div>
            <div class="error-state-actions">
                <button class="retry-btn" onclick="${retryId}()">
                    Réessayer
                </button>
            </div>
        </div>
    `;
}
