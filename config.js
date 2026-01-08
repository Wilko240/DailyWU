// ============================================
// FICHIER DE CONFIGURATION
// ============================================
// Modifiez ce fichier pour personnaliser votre dashboard

const CONFIG = {
    // ========== CLÉS API ==========
    // Obtenez vos clés gratuites ici :
    // - OpenWeatherMap: https://openweathermap.org/api
    // - NewsAPI: https://newsapi.org/
    // - Alpha Vantage: https://www.alphavantage.co/support/#api-key
    
    apiKeys: {
        openWeather: 'demo',     // ⚠️ À REMPLACER par votre clé
        newsApi: 'demo',          // ⚠️ À REMPLACER par votre clé
        alphaVantage: 'demo'      // ⚠️ À REMPLACER par votre clé (optionnel)
    },

    // ========== FINANCE ==========
    finance: {
        // Actions à suivre (utilisez les symboles Yahoo Finance)
        stocks: [
            'TTE',      // TotalEnergies
            'AI.PA',    // Air Liquide (Paris)
            'PLTR',     // Palantir
            'NVDA',     // NVIDIA
            'GOOGL',    // Alphabet/Google
            'AAPL',     // Apple
            'AMZN',     // Amazon
            'NKE'       // Nike
        ],
        
        // Indices boursiers
        indices: [
            { symbol: '^GSPC', name: 'S&P 500' },
            { symbol: '^FCHI', name: 'CAC 40' }
            // Ajoutez d'autres indices :
            // { symbol: '^DJI', name: 'Dow Jones' },
            // { symbol: '^IXIC', name: 'NASDAQ' },
            // { symbol: '^FTSE', name: 'FTSE 100' },
            // { symbol: '^N225', name: 'Nikkei 225' }
        ],
        
        // Cryptomonnaies (utilisez les IDs CoinGecko)
        // Liste complète : https://api.coingecko.com/api/v3/coins/list
        crypto: [
            'bitcoin',
            'ethereum',
            'binancecoin',
            'cardano',
            'solana'
            // Ajoutez d'autres cryptos :
            // 'ripple',
            // 'polkadot',
            // 'avalanche-2',
            // 'dogecoin'
        ]
    },

    // ========== MÉTÉO ==========
    weather: {
        city: 'Dubai',           // Ville à suivre
        units: 'metric',         // 'metric' (Celsius) ou 'imperial' (Fahrenheit)
        lang: 'fr'               // Langue des descriptions
    },

    // ========== IMMOBILIER ==========
    realEstate: {
        location: 'Seignosse',
        zipCode: '40510',
        minPrice: null,          // Prix minimum (null = pas de minimum)
        maxPrice: 350000,        // Prix maximum
        minSurface: 25,          // Surface minimum en m²
        maxSurface: 50,          // Surface maximum en m²
        propertyType: 2,         // 2 = Maison, 1 = Appartement
        
        // Générer l'URL Leboncoin automatiquement
        getSearchUrl() {
            let url = 'https://www.leboncoin.fr/recherche?category=9';
            url += `&locations=${this.location}_${this.zipCode}`;
            url += `&real_estate_type=${this.propertyType}`;
            if (this.maxPrice) url += `&price=min-${this.maxPrice}`;
            if (this.minSurface && this.maxSurface) {
                url += `&square=${this.minSurface}-${this.maxSurface}`;
            }
            return url;
        }
    },

    // ========== ACTUALITÉS ==========
    news: {
        language: 'fr',           // Langue des actualités
        country: 'fr',            // Pays de référence
        
        // Mots-clés pour chaque section
        keywords: {
            economy: 'economy OR finance OR "stock market" OR bourse',
            ai: 'artificial intelligence OR AI OR "machine learning" OR "deep learning"',
            geopolitics: 'geopolitics OR international OR "world news" OR diplomacy'
        },
        
        // Nombre maximum d'articles par section
        maxArticles: 5
    },

    // ========== INTERFACE ==========
    ui: {
        // Thème (dark ou light)
        theme: 'dark',
        
        // Fréquence de rafraîchissement automatique (en millisecondes)
        // 3600000 = 1 heure
        autoRefreshInterval: 3600000,
        
        // Afficher les données de démonstration si API non configurée
        showMockData: true,
        
        // Animation des cartes au chargement
        enableAnimations: true
    },

    // ========== SECTIONS ==========
    // Activer/désactiver des sections
    sections: {
        finance: true,
        ai: true,
        weather: true,
        realEstate: true,
        geopolitics: true
    }
};

// ============================================
// CONFIGURATION AVANCÉE
// ============================================

// Thèmes de couleurs prédéfinis
const THEMES = {
    dark: {
        bgPrimary: '#0a0a0a',
        bgSecondary: '#141414',
        bgCard: '#1a1a1a',
        textPrimary: '#ffffff',
        textSecondary: '#a0a0a0',
        accentPrimary: '#00d4ff',
        accentSecondary: '#ff006e'
    },
    light: {
        bgPrimary: '#ffffff',
        bgSecondary: '#f5f5f5',
        bgCard: '#ffffff',
        textPrimary: '#0a0a0a',
        textSecondary: '#666666',
        accentPrimary: '#0066ff',
        accentSecondary: '#ff1744'
    },
    blue: {
        bgPrimary: '#0a1929',
        bgSecondary: '#132f4c',
        bgCard: '#1a2332',
        textPrimary: '#ffffff',
        textSecondary: '#b2bac2',
        accentPrimary: '#3399ff',
        accentSecondary: '#00e5ff'
    },
    purple: {
        bgPrimary: '#1a0b2e',
        bgSecondary: '#2d1b4e',
        bgCard: '#251444',
        textPrimary: '#ffffff',
        textSecondary: '#b794f6',
        accentPrimary: '#9333ea',
        accentSecondary: '#ec4899'
    }
};

// Sources d'actualités personnalisées
const NEWS_SOURCES = {
    economy: [
        'les-echos',
        'bloomberg',
        'financial-times',
        'the-wall-street-journal'
    ],
    tech: [
        'techcrunch',
        'wired',
        'the-verge',
        'ars-technica'
    ],
    general: [
        'le-monde',
        'le-figaro',
        'liberation',
        'france-24'
    ]
};

// Export de la configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, THEMES, NEWS_SOURCES };
}
