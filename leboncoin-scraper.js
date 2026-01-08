// ============================================
// SCRAPER LEBONCOIN (Backend Node.js)
// ============================================
// Ce fichier nécessite Node.js et les dépendances npm
// Installation : npm install puppeteer express cors

const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// Configuration
const LEBONCOIN_CONFIG = {
    location: 'Seignosse',
    zipCode: '40510',
    minSurface: 25,
    maxSurface: 50,
    maxPrice: 350000,
    propertyType: 2 // 2 = Maison
};

// Générer l'URL de recherche
function getSearchUrl() {
    let url = 'https://www.leboncoin.fr/recherche?category=9';
    url += `&locations=${LEBONCOIN_CONFIG.location}_${LEBONCOIN_CONFIG.zipCode}`;
    url += `&real_estate_type=${LEBONCOIN_CONFIG.propertyType}`;
    url += `&price=min-${LEBONCOIN_CONFIG.maxPrice}`;
    url += `&square=${LEBONCOIN_CONFIG.minSurface}-${LEBONCOIN_CONFIG.maxSurface}`;
    return url;
}

// Fonction de scraping
async function scrapeLeboncoin() {
    console.log('🔍 Début du scraping Leboncoin...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Configuration du user agent pour éviter la détection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Aller sur la page de recherche
        console.log('📄 Chargement de la page...');
        await page.goto(getSearchUrl(), { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Attendre que les annonces se chargent
        await page.waitForSelector('[data-qa-id="aditem_container"]', { timeout: 10000 });
        
        // Extraire les données
        const listings = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('[data-qa-id="aditem_container"]'));
            
            return items.map(item => {
                try {
                    const titleEl = item.querySelector('[data-qa-id="aditem_title"]');
                    const priceEl = item.querySelector('[data-qa-id="aditem_price"]');
                    const linkEl = item.querySelector('a[href]');
                    const locationEl = item.querySelector('[data-qa-id="aditem_location"]');
                    const dateEl = item.querySelector('[data-qa-id="aditem_date"]');
                    
                    // Extraire les détails (surface, nombre de pièces)
                    const detailsEl = item.querySelector('[data-qa-id="aditem_details"]');
                    let surface = null;
                    let rooms = null;
                    
                    if (detailsEl) {
                        const detailsText = detailsEl.textContent;
                        const surfaceMatch = detailsText.match(/(\d+)\s*m²/);
                        const roomsMatch = detailsText.match(/(\d+)\s*pièce/);
                        
                        if (surfaceMatch) surface = parseInt(surfaceMatch[1]);
                        if (roomsMatch) rooms = parseInt(roomsMatch[1]);
                    }
                    
                    return {
                        title: titleEl?.textContent?.trim() || 'N/A',
                        price: priceEl?.textContent?.trim() || 'N/A',
                        url: linkEl?.href || '#',
                        location: locationEl?.textContent?.trim() || 'N/A',
                        date: dateEl?.textContent?.trim() || 'N/A',
                        surface: surface,
                        rooms: rooms,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    console.error('Erreur extraction annonce:', error);
                    return null;
                }
            }).filter(item => item !== null);
        });
        
        console.log(`✅ ${listings.length} annonces trouvées`);
        return listings;
        
    } catch (error) {
        console.error('❌ Erreur scraping:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// API Endpoint pour obtenir les annonces
app.get('/api/realestate', async (req, res) => {
    try {
        const listings = await scrapeLeboncoin();
        res.json({
            success: true,
            count: listings.length,
            data: listings,
            searchUrl: getSearchUrl()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Endpoint de santé
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📍 URL de recherche: ${getSearchUrl()}`);
    console.log(`🔗 API disponible sur: http://localhost:${PORT}/api/realestate`);
});

// ============================================
// INSTRUCTIONS D'UTILISATION
// ============================================

/*
1. INSTALLATION
   npm init -y
   npm install puppeteer express cors

2. LANCER LE SERVEUR
   node leboncoin-scraper.js

3. MODIFIER LE FRONTEND
   Dans script.js, fonction loadRealEstate(), remplacez par :
   
   async function loadRealEstate() {
       const container = document.getElementById('realestateContainer');
       
       try {
           const response = await fetch('http://localhost:3000/api/realestate');
           const data = await response.json();
           
           if (!data.success || data.count === 0) {
               container.innerHTML = `
                   <div class="empty-state">
                       <div class="empty-state-icon">🏠</div>
                       <div class="empty-state-text">Aucune annonce trouvée</div>
                   </div>
               `;
               return;
           }
           
           container.innerHTML = data.data.map(property => `
               <div class="property-item">
                   <div class="property-title">${property.title}</div>
                   <div class="property-price">${property.price}</div>
                   <div class="property-details">
                       <span>📍 ${property.location}</span>
                       ${property.surface ? `<span>📐 ${property.surface}m²</span>` : ''}
                       ${property.rooms ? `<span>🚪 ${property.rooms} pièces</span>` : ''}
                       <span>🕐 ${property.date}</span>
                   </div>
                   <a href="${property.url}" target="_blank" class="property-link">
                       Voir l'annonce →
                   </a>
               </div>
           `).join('');
           
       } catch (error) {
           console.error('Erreur:', error);
           container.innerHTML = getEmptyState('❌', 'Erreur lors du chargement');
       }
   }

4. DÉPLOIEMENT (optionnel)
   - Heroku: https://www.heroku.com/
   - Railway: https://railway.app/
   - Render: https://render.com/
   
   Tous offrent des tiers gratuits !

5. NOTES IMPORTANTES
   - Le scraping est légal si fait de manière raisonnée (ne pas surcharger le serveur)
   - Consultez les CGU de Leboncoin
   - Respectez un délai entre les requêtes (max 1 fois par heure recommandé)
   - Pour une utilisation intensive, préférez leur API officielle si disponible

6. AUTOMATISATION
   Pour scraper automatiquement toutes les heures, utilisez cron (Linux/Mac) ou Task Scheduler (Windows)
   
   Crontab exemple (toutes les heures) :
   0 * * * * curl http://localhost:3000/api/realestate
   
   Ou utilisez node-cron dans ce fichier :
   
   const cron = require('node-cron');
   
   // Scraper toutes les heures
   cron.schedule('0 * * * *', async () => {
       console.log('⏰ Scraping automatique...');
       await scrapeLeboncoin();
   });

7. NOTIFICATIONS (Bonus)
   Pour recevoir des notifications sur nouvelles annonces :
   
   npm install nodemailer
   
   const nodemailer = require('nodemailer');
   
   async function sendEmailNotification(newListings) {
       const transporter = nodemailer.createTransport({
           service: 'gmail',
           auth: {
               user: 'votre-email@gmail.com',
               pass: 'votre-mot-de-passe-app'
           }
       });
       
       await transporter.sendMail({
           from: 'Dashboard',
           to: 'votre-email@gmail.com',
           subject: `${newListings.length} nouvelles annonces à Seignosse`,
           html: `<h2>Nouvelles annonces</h2>...`
       });
   }

8. CACHE (Recommandé)
   Pour éviter de scraper trop souvent, ajoutez un système de cache :
   
   let cache = { data: null, timestamp: null };
   const CACHE_DURATION = 60 * 60 * 1000; // 1 heure
   
   app.get('/api/realestate', async (req, res) => {
       const now = Date.now();
       
       if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
           return res.json(cache.data);
       }
       
       const listings = await scrapeLeboncoin();
       cache = {
           data: { success: true, count: listings.length, data: listings },
           timestamp: now
       };
       
       res.json(cache.data);
   });
*/
