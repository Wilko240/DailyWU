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
    container.classList.add('loading');

    try {
        // Utilisation de l'API gratuite Yahoo Finance via API alternative
        const data = await fetchWithFallback([
            () => fetchYahooFinance(INDICES.map(i => i.symbol)),
            () => fetchMockIndices() // Fallback avec données de démo
        ]);

        container.classList.remove('loading');
        container.innerHTML = data.map(index => `
            <div class="index-item" onclick="openChartModal('${index.symbol}', '${index.name}', 'index')">
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
        container.classList.remove('loading');
        container.innerHTML = getErrorState(
            '📊',
            'Erreur de chargement',
            getErrorMessage(error, 'indices'),
            loadIndices
        );
    }
}

// Charger les actions
async function loadStocks() {
    const container = document.getElementById('stocksContainer');
    container.classList.add('loading');

    try {
        const data = await fetchWithFallback([
            () => fetchAlphaVantageStocks(STOCKS),
            () => fetchMockStocks()
        ]);

        container.classList.remove('loading');
        container.innerHTML = data.map(stock => `
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

// Charger les actualités économiques
async function loadEconomyNews() {
    const container = document.getElementById('economyNewsContainer');
    container.classList.add('loading');

    try {
        // Use mock data directly (RSS feeds have CORS/API limitations)
        const data = fetchMockEconomyNews();

        container.classList.remove('loading');
        console.log('Economy news loaded:', data.length, 'items');

        // Debug: log first item to check URL
        if (data.length > 0) {
            console.log('First economy news item:', {
                title: data[0].title,
                url: data[0].url,
                source: data[0].source
            });
        }

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
        // Use mock data directly (RSS feeds have CORS/API limitations)
        const data = fetchMockAINews();

        container.classList.remove('loading');
        console.log('AI news loaded:', data.length, 'items');

        // Debug: log first item
        if (data.length > 0) {
            console.log('First AI news item:', {
                title: data[0].title,
                url: data[0].url
            });
        }

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

        // Extraire prévisions pour les 5 prochains jours (midi)
        const dailyForecasts = [];
        const seenDays = new Set();

        for (const item of forecastData.list) {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toDateString();

            // Prendre la prévision de midi (12h) pour chaque jour
            if (!seenDays.has(dayKey) && date.getHours() === 12) {
                seenDays.add(dayKey);
                dailyForecasts.push({
                    date: date,
                    temp: Math.round(item.main.temp),
                    icon: weatherIcons[item.weather[0].main] || '🌤️',
                    description: item.weather[0].description
                });

                if (dailyForecasts.length === 5) break;
            }
        }

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
                <h4 style="margin: 1rem 0 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">Prévisions 5 jours</h4>
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
        `;
    } catch (error) {
        console.error('Erreur météo:', error);
        container.classList.remove('loading');
        container.innerHTML = getMockWeather();
    }
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
        // Use mock data directly (RSS feeds have CORS/API limitations)
        const data = fetchMockGeopoliticsNews();

        container.classList.remove('loading');
        console.log('Geopolitics news loaded:', data.length, 'items');

        // Debug: log first item
        if (data.length > 0) {
            console.log('First geopolitics news item:', {
                title: data[0].title,
                url: data[0].url
            });
        }

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

function fetchMockEconomyNews() {
    return [
        {
            title: "La BCE maintient ses taux d'intérêt",
            description: "La Banque Centrale Européenne a décidé de maintenir ses taux directeurs inchangés.",
            source: "Les Échos",
            url: "https://www.lesechos.fr/finance-marches"
        },
        {
            title: "Wall Street termine en hausse",
            description: "Les indices américains clôturent dans le vert portés par le secteur technologique.",
            source: "Bloomberg",
            url: "https://www.bloomberg.com/markets"
        },
        {
            title: "Le CAC 40 en forte progression",
            description: "La bourse de Paris affiche une belle performance ce trimestre.",
            source: "Les Échos",
            url: "https://www.lesechos.fr/finance-marches"
        },
        {
            title: "Inflation en baisse en zone euro",
            description: "Les derniers chiffres montrent un ralentissement de l'inflation.",
            source: "Reuters",
            url: "https://www.reuters.com/markets"
        }
    ];
}

function fetchMockAINews() {
    return [
        {
            title: "OpenAI lance GPT-5",
            description: "Le nouveau modèle de langage promet des capacités de raisonnement améliorées.",
            source: "TechCrunch",
            url: "https://techcrunch.com/tag/artificial-intelligence/"
        },
        {
            title: "L'IA générative transforme l'industrie",
            description: "Les entreprises adoptent massivement les outils d'intelligence artificielle.",
            source: "MIT Technology Review",
            url: "https://www.technologyreview.com/topic/artificial-intelligence/"
        },
        {
            title: "Les agents IA autonomes arrivent",
            description: "Une nouvelle génération d'assistants IA peut accomplir des tâches complexes de manière autonome.",
            source: "Wired",
            url: "https://www.wired.com/tag/artificial-intelligence/"
        },
        {
            title: "IA et éthique : le débat continue",
            description: "Les régulateurs du monde entier travaillent sur des cadres pour l'IA responsable.",
            source: "The Verge",
            url: "https://www.theverge.com/ai-artificial-intelligence"
        }
    ];
}

function fetchMockGeopoliticsNews() {
    return [
        {
            title: "Sommet du G7 à venir",
            description: "Les dirigeants mondiaux se réuniront pour discuter des enjeux économiques et climatiques.",
            source: "Le Monde",
            url: "https://www.lemonde.fr/international/"
        },
        {
            title: "Tensions au Moyen-Orient",
            description: "La situation reste tendue dans la région avec de nouvelles négociations en cours.",
            source: "France 24",
            url: "https://www.france24.com/fr/moyen-orient/"
        },
        {
            title: "Climat : accord historique à la COP",
            description: "Les pays participants ont signé un accord ambitieux pour réduire les émissions de CO2.",
            source: "Le Monde",
            url: "https://www.lemonde.fr/international/"
        },
        {
            title: "Relations sino-américaines en évolution",
            description: "Les deux superpuissances cherchent à stabiliser leurs relations commerciales.",
            source: "Reuters",
            url: "https://www.reuters.com/world/"
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
