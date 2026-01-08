# 📊 Dashboard Quotidien

Un dashboard personnel moderne et interactif pour suivre vos finances, l'actualité, la météo et l'immobilier.

## ✨ Nouvelles Fonctionnalités

### 🎨 Mode Clair/Sombre
- Basculez entre les thèmes avec le bouton en haut à droite
- La préférence est sauvegardée dans le navigateur
- Design adaptatif avec transitions fluides

### 📈 Graphiques Interactifs
- Cliquez sur n'importe quelle action, crypto ou indice pour voir son historique
- Visualisez les tendances sur 7 jours, 1 mois, 3 mois ou 1 an
- Graphiques animés et responsifs avec Chart.js

### 🔔 Système de Notifications
- Messages d'erreur clairs et informatifs
- Notifications avec auto-dismiss
- Design élégant et non-intrusif

### 🛡️ Backend API Sécurisé
- Clés API protégées côté serveur
- Proxy pour toutes les requêtes API
- Gestion d'erreurs améliorée

## 🚀 Installation

### Mode Simple (Frontend seulement)
Ouvrez simplement `index.html` dans votre navigateur.
- ⚠️ Les clés API sont exposées dans le code
- Utilisera des données de démonstration pour certaines sections

### Mode Complet (Avec Backend)

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer les clés API**
```bash
cp .env.example .env
# Éditez .env et ajoutez vos vraies clés API
```

3. **Démarrer le serveur**
```bash
npm start
```

4. **Accéder au dashboard**
Ouvrez http://localhost:3000/index.html

## 🔑 Obtenir les Clés API

### OpenWeatherMap (Gratuit - 1000 calls/jour)
1. Créez un compte sur https://openweathermap.org/
2. Allez dans "API keys"
3. Copiez votre clé dans `.env`

### NewsAPI (Gratuit - 100 calls/jour)
1. Créez un compte sur https://newsapi.org/register
2. Copiez votre clé dans `.env`

### CoinGecko
- Pas de clé requise ! ✨
- API gratuite pour les cryptomonnaies

## 📦 Structure du Projet

```
DailyWU/
├── index.html              # Page principale
├── styles.css              # Styles avec thèmes clair/sombre
├── script.js               # Logique frontend
├── backend.js              # Serveur API (optionnel)
├── config.js               # Configuration (API keys - exposées)
├── package.json            # Dépendances Node.js
├── .env.example            # Template pour les variables d'environnement
├── .gitignore             # Fichiers à ignorer par Git
└── README.md              # Ce fichier
```

## 🎯 Fonctionnalités Principales

### 💰 Finance & Marchés
- Indices principaux (S&P 500, CAC 40)
- Suivi d'actions personnalisées
- Cryptomonnaies en temps réel
- Actualités économiques

### 🤖 Intelligence Artificielle
- Dernières actualités IA
- Tendances et innovations

### ☀️ Météo
- Conditions actuelles pour Dubai
- Température ressentie
- Humidité, vent, pression

### 🏠 Immobilier
- Recherche sur Leboncoin (lien direct)
- Critères personnalisables

### 🌍 Géopolitique
- Actualités internationales
- Événements majeurs

## ⚙️ Configuration Avancée

### Personnaliser les Actions Suivies
Éditez `config.js` ou `script.js`:
```javascript
const STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];
```

### Personnaliser les Cryptos
```javascript
const CRYPTOS = ['bitcoin', 'ethereum', 'solana'];
```

### Changer la Ville Météo
Dans `script.js`, ligne 235:
```javascript
const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=Paris&...`
);
```

## 🐛 Dépannage

### Les données ne se chargent pas
1. Vérifiez votre connexion internet
2. Vérifiez les clés API dans `.env`
3. Consultez la console du navigateur (F12)
4. Vérifiez les limites de taux des APIs

### Le backend ne démarre pas
```bash
# Vérifiez que Node.js est installé
node --version

# Réinstallez les dépendances
rm -rf node_modules
npm install
```

## 🔄 Actualisation des Données
- **Automatique**: Toutes les heures
- **Manuel**: Cliquez sur le bouton "Actualiser"

## 🛠️ Technologies Utilisées

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Graphiques**: Chart.js 4.4.1
- **Backend**: Node.js, Express
- **Fonts**: Google Fonts (Syne, DM Sans)

## 📝 TODO / Améliorations Futures

- [ ] Scraping automatique Leboncoin (backend)
- [ ] Portfolio tracker avec calcul gains/pertes
- [ ] Alertes configurables (email/push)
- [ ] Export de données (CSV/PDF)
- [ ] Multi-devises (EUR/USD/GBP)
- [ ] PWA avec mode offline
- [ ] Tests unitaires
- [ ] CI/CD pipeline

## 📄 Licence

MIT

## 👤 Auteur

Votre Nom

---

**Note**: Ce dashboard utilise des APIs gratuites avec des limites de taux. Pour un usage intensif en production, considérez des APIs premium comme Finnhub, Polygon.io ou IEX Cloud.
