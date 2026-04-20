/* ============================================================
   Did You Know That? — app.js
   Celá logika aplikace je tady.
   ============================================================ */

// URL adresa externího API, které vrací zajímavé fakty
const API_URL = 'https://api.api-ninjas.com/v1/facts';
// Tajný klíč pro přístup k API (každý vývojář má svůj vlastní)
const API_KEY = '2XEi9vKcFzPJOit1TptpNxQUhD8HHxVYNA8fZ4sZ';
// Klíč pro uložení posledního zobrazeného faktu do paměti prohlížeče
const LS_LAST = 'didyouknow_last_fact';
// Klíč pro uložení oblíbených faktů do paměti prohlížeče
const LS_FAVS = 'didyouknow_favorites';

/* ── Odkazy na prvky v HTML stránce ── */
// Tyto proměnné budou odkazovat na konkrétní tlačítka, texty atd. na stránce
let factText, loader, generateBtn, shareBtn, favBtn, toast;
let tabBtnDiscover, tabBtnFavorites;
let panelDiscover, panelFavorites;
let favList, favEmpty, favBadge;

/* ── Stav aplikace ── */
// Aktuálně zobrazený fakt (text)
let currentFact = '';
// Časovač pro upozornění (toast notifikace)
let toastTimer = null;

/* ════════════════════════════════════════
   SPUŠTĚNÍ APLIKACE
   Tato funkce se spustí automaticky hned po načtení stránky v prohlížeči.
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Načteme si odkazy na všechny důležité prvky na stránce podle jejich HTML id
  factText    = document.getElementById('factText');    // Prvek kde se zobrazuje text faktu
  loader      = document.getElementById('loader');      // Animace načítání (točící se kolečko)
  generateBtn = document.getElementById('generateBtn'); // Tlačítko "Vygenerovat nový fakt"
  shareBtn    = document.getElementById('shareBtn');    // Tlačítko "Sdílet"
  favBtn      = document.getElementById('favBtn');      // Tlačítko srdce (oblíbené)
  toast       = document.getElementById('toast');       // Dočasná zpráva (např. "Uloženo!")

  // Záložky (Discover / Favorites)
  tabBtnDiscover  = document.getElementById('tabBtnDiscover');
  tabBtnFavorites = document.getElementById('tabBtnFavorites');
  panelDiscover   = document.getElementById('tab-discover');   // Obsah záložky Discover
  panelFavorites  = document.getElementById('tab-favorites');  // Obsah záložky Favorites

  // Prvky v záložce oblíbených
  favList  = document.getElementById('favList');   // Seznam oblíbených faktů
  favEmpty = document.getElementById('favEmpty'); // Zpráva "Zatím žádné oblíbené"
  favBadge = document.getElementById('favBadge'); // Číslo (počet oblíbených) na ikoně záložky

  // Přiřadíme funkce k tlačítkům – co se stane po kliknutí
  generateBtn.addEventListener('click', handleGenerate);         // Klik → načti nový fakt
  shareBtn.addEventListener('click', handleShare);               // Klik → sdílej fakt
  favBtn.addEventListener('click', handleFavoriteToggle);        // Klik → přidej/odeber z oblíbených
  tabBtnDiscover.addEventListener('click', () => switchTab('discover'));    // Přepni na záložku Discover
  tabBtnFavorites.addEventListener('click', () => switchTab('favorites'));  // Přepni na záložku Favorites

  // Aktualizujeme číslo na ikoně záložky oblíbených
  updateBadge();

  // Zkusíme načíst naposledy zobrazený fakt z paměti prohlížeče
  const saved = loadLastFact();
  if (saved) {
    // Pokud existuje uložený fakt, zobrazíme ho rovnou (bez volání API)
    displayFact(saved);
  } else {
    // Pokud nic uloženo není, stáhneme nový fakt z internetu
    fetchFact();
  }
});

/* ════════════════════════════════════════
   PŘEPÍNÁNÍ ZÁLOŽEK
════════════════════════════════════════ */
const switchTab = (tab) => {
  const isDiscover = tab === 'discover'; // Je aktivní záložka "Discover"?

  // Zobrazíme/skryjeme příslušné panely (přidáme/odebereme třídu "active")
  panelDiscover.classList.toggle('active', isDiscover);
  panelFavorites.classList.toggle('active', !isDiscover);

  // Zvýrazníme aktivní tlačítko záložky
  tabBtnDiscover.classList.toggle('active', isDiscover);
  tabBtnDiscover.setAttribute('aria-selected', isDiscover);     // Pro čtečky obrazovky
  tabBtnFavorites.classList.toggle('active', !isDiscover);
  tabBtnFavorites.setAttribute('aria-selected', !isDiscover);

  // Pokud jsme přepnuli na Favorites, překreslíme seznam oblíbených
  if (!isDiscover) renderFavorites();
};

/* ════════════════════════════════════════
   STAHOVÁNÍ FAKTU Z API
════════════════════════════════════════ */
const fetchFact = async () => {
  setLoadingState(true); // Zapneme animaci načítání a zablokujeme tlačítka

  try {
    // Pošleme požadavek na server API (jako když napíšete URL do prohlížeče, ale programově)
    const response = await fetch(API_URL, {
      method: 'GET',                          // Typ požadavku: čtení dat
      headers: { 'X-Api-Key': API_KEY },      // Přiložíme tajný klíč pro ověření
    });

    // Pokud server vrátil chybový kód (např. 401, 500), vyhodíme chybu
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    // Převedeme odpověď ze serveru z JSON formátu na JavaScript objekt
    const data = await response.json();
    // Vytáhneme text faktu z odpovědi (je uložen jako první prvek pole)
    const fact = data?.[0]?.fact;
    if (!fact) throw new Error('No fact returned from API.');

    // Uložíme fakt do paměti prohlížeče a zobrazíme ho
    saveLastFact(fact);
    displayFact(fact);

  } catch (err) {
    // Pokud cokoliv selže, zapíšeme chybu do konzole a ukážeme uživateli zprávu
    console.error('Failed to fetch fact:', err);
    showToast('Couldn\'t load a fact. Check your API key or connection.');
    setLoadingState(false); // Vypneme animaci načítání
  }
};

/* ════════════════════════════════════════
   ZOBRAZENÍ FAKTU NA STRÁNCE
════════════════════════════════════════ */
const displayFact = (fact) => {
  currentFact = fact;                        // Uložíme fakt jako aktuálně zobrazený
  factText.classList.remove('visible');      // Skryjeme text (pro plynulou animaci)

  // Počkáme 200ms a pak text plynule zobrazíme
  setTimeout(() => {
    factText.textContent = fact;             // Nastavíme text faktu
    setLoadingState(false);                  // Vypneme animaci načítání
    factText.classList.add('visible');       // Zobrazíme text s animací
    shareBtn.disabled = false;               // Povolíme tlačítko sdílení
    favBtn.disabled   = false;               // Povolíme tlačítko oblíbených
    syncFavButton();                         // Aktualizujeme ikonu srdce (plné/prázdné)
  }, 200);
};

/* ════════════════════════════════════════
   STAV NAČÍTÁNÍ (zapnout/vypnout)
════════════════════════════════════════ */
const setLoadingState = (isLoading) => {
  if (isLoading) {
    // Načítání ZAP: skryjeme fakt, ukážeme kolečko, zablokujeme tlačítka
    factText.classList.remove('visible');
    factText.textContent = '';
    loader.classList.add('active');
    generateBtn.disabled = true;
    shareBtn.disabled    = true;
    favBtn.disabled      = true;
  } else {
    // Načítání VYP: skryjeme kolečko, povolíme tlačítko generování
    loader.classList.remove('active');
    generateBtn.disabled = false;
  }
};

/* ════════════════════════════════════════
   OBSLUHA KLIKNUTÍ NA TLAČÍTKA
════════════════════════════════════════ */

// Klik na "Nový fakt"
const handleGenerate = () => {
  triggerHaptic(); // Vibrační odezva na mobilu (pokud je dostupná)
  fetchFact();     // Stáhni nový fakt
};

// Klik na "Sdílet"
const handleShare = async () => {
  if (!currentFact) return; // Pokud není žádný fakt, nic nedělej

  // Připravíme zprávu ke sdílení s textem faktu a odkazem na web
  const message = `Did you know that? "${currentFact}"\n\nhttps://facts-generator-zapletal.netlify.app/`;
  const shareData = {
    title: 'Did You Know That?',
    text: message,
    url: 'https://facts-generator-zapletal.netlify.app/',
  };

  if (navigator.share) {
    // Pokud prohlížeč/mobil podporuje nativní sdílení (systémové menu), použijeme ho
    try {
      await navigator.share(shareData);
    } catch (err) {
      // Pokud uživatel sdílení zrušil (klikl "Zpět"), ignorujeme to
      if (err.name !== 'AbortError') console.warn('Share failed:', err);
    }
  } else {
    // Na počítači nativní sdílení není → zkopírujeme text do schránky
    try {
      await navigator.clipboard.writeText(message);
      showToast('Fact copied to clipboard!');
    } catch (err) {
      console.error('Clipboard write failed:', err);
      showToast('Could not copy — please copy the text manually.');
    }
  }
};

// Klik na srdce (přidat/odebrat z oblíbených)
const handleFavoriteToggle = () => {
  if (!currentFact) return; // Pokud není žádný fakt, nic nedělej
  triggerHaptic();           // Vibrační odezva

  const favs    = loadFavorites();               // Načteme seznam oblíbených
  const isSaved = favs.includes(currentFact);    // Je aktuální fakt již oblíbený?

  if (isSaved) {
    removeFavorite(currentFact);      // Ano → odebereme ho
    showToast('Removed from favorites.');
  } else {
    addFavorite(currentFact);         // Ne → přidáme ho
    showToast('Saved to favorites!');
  }

  // Spustíme animaci "pop" na tlačítku srdce
  favBtn.classList.remove('pop');
  void favBtn.offsetWidth; // Trik: vynutíme překreslení, aby se animace spustila znovu
  favBtn.classList.add('pop');

  syncFavButton();  // Aktualizujeme vzhled tlačítka (plné/prázdné srdce)
  updateBadge();    // Aktualizujeme počítadlo na záložce
};

/* ════════════════════════════════════════
   OBLÍBENÉ – OPERACE S DATY
════════════════════════════════════════ */

// Načte seznam oblíbených faktů z localStorage (paměť prohlížeče)
const loadFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_FAVS)) || []; // Vrátíme pole, nebo prázdné pole
  } catch (_) { return []; } // Pokud je paměť nedostupná/poškozená, vrátíme prázdné pole
};

// Uloží celý seznam oblíbených do localStorage
const saveFavorites = (favs) => {
  try {
    localStorage.setItem(LS_FAVS, JSON.stringify(favs)); // Převedeme pole na text a uložíme
  } catch (_) {}
};

// Přidá fakt na začátek seznamu oblíbených (nejnovější je první)
const addFavorite = (fact) => {
  const favs = loadFavorites();
  if (!favs.includes(fact)) {     // Přidáme jen pokud tam ještě není
    favs.unshift(fact);           // unshift = vloží na začátek pole
    saveFavorites(favs);
  }
};

// Odebere konkrétní fakt ze seznamu oblíbených
const removeFavorite = (fact) => {
  const favs = loadFavorites().filter(f => f !== fact); // Vytvoříme pole bez daného faktu
  saveFavorites(favs);
};

/* ════════════════════════════════════════
   OBLÍBENÉ – ZOBRAZENÍ V UI
════════════════════════════════════════ */

// Aktualizuje vzhled tlačítka srdce podle toho, zda je aktuální fakt oblíbený
const syncFavButton = () => {
  if (!currentFact) return;
  const isSaved = loadFavorites().includes(currentFact);
  favBtn.classList.toggle('saved', isSaved); // Třída "saved" = plné srdce (červené)
  favBtn.setAttribute('aria-label', isSaved ? 'Remove from favorites' : 'Save to favorites');
};

// Aktualizuje číslo (badge) na záložce Favorites
const updateBadge = () => {
  const count = loadFavorites().length;
  // Zobrazíme počet (max. "99+"), nebo nic pokud je seznam prázdný
  favBadge.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
  favBadge.classList.toggle('visible', count > 0); // Schováme badge pokud je počet 0
};

// Překreslí celý seznam oblíbených faktů v záložce Favorites
const renderFavorites = () => {
  const favs = loadFavorites();
  favList.innerHTML = ''; // Smažeme starý seznam (začneme znovu)

  if (favs.length === 0) {
    // Pokud je seznam prázdný, zobrazíme zprávu "Zatím žádné oblíbené"
    favEmpty.classList.add('visible');
    return;
  }

  favEmpty.classList.remove('visible'); // Skryjeme prázdnou zprávu

  // Pro každý oblíbený fakt vytvoříme kartu (HTML prvek)
  favs.forEach((fact) => {
    const card = document.createElement('article'); // Nový HTML element <article>
    card.className = 'fav-card';
    // Vložíme HTML s textem faktu a tlačítkem pro odebrání (srdce)
    card.innerHTML = `
      <p class="fav-card-text">${escapeHtml(fact)}</p>
      <button class="fav-remove-btn" aria-label="Remove from favorites">
        <svg class="fav-remove-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5
                   2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08
                   C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5
                   c0 3.77-3.4 6.86-8.55 11.53L12 21.35z"/>
        </svg>
      </button>
    `;

    // Přidáme obsluhu kliknutí na tlačítko pro odebrání z oblíbených
    card.querySelector('.fav-remove-btn').addEventListener('click', () => {
      triggerHaptic();
      removeFavorite(fact);  // Odebereme fakt z oblíbených
      updateBadge();         // Aktualizujeme počítadlo

      // Pokud byl odebíraný fakt právě zobrazený, aktualizujeme srdce na hlavní stránce
      if (fact === currentFact) syncFavButton();

      // Animace: karta se plynule vymizí (opacity → 0) a pak se celý seznam překreslí
      card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(12px)';
      setTimeout(() => renderFavorites(), 260); // Po 260ms překreslíme seznam
    });

    favList.appendChild(card); // Přidáme kartu do seznamu na stránce
  });
};

/* ════════════════════════════════════════
   LOKÁLNÍ PAMĚŤ – Poslední fakt
════════════════════════════════════════ */

// Uloží fakt do localStorage, aby přežil zavření prohlížeče
const saveLastFact = (fact) => {
  try { localStorage.setItem(LS_LAST, fact); } catch (_) {}
};

// Načte poslední zobrazený fakt z localStorage
const loadLastFact = () => {
  try { return localStorage.getItem(LS_LAST) || null; } catch (_) { return null; }
};

/* ════════════════════════════════════════
   POMOCNÉ FUNKCE
════════════════════════════════════════ */

// Spustí vibrace na mobilním zařízení (jako hmatová odezva při kliknutí)
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(40); } catch (_) {} // 40ms vibrací
  }
};

// Zobrazí dočasnou zprávu v dolní části obrazovky (tzv. toast notifikace)
const showToast = (message, duration = 3000) => {
  if (toastTimer) clearTimeout(toastTimer); // Zrušíme předchozí časovač (pokud existuje)
  toast.textContent = message;
  toast.classList.add('show');              // Zobrazíme zprávu
  // Po 3 sekundách (výchozí) zprávu opět skryjeme
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
};

// Ochrana proti XSS útokům: převede speciální HTML znaky na bezpečné entity
// Např. "<script>" se stane "&lt;script&gt;" a nezpustí se jako kód
const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;   // Nastavíme jako prostý text (prohlížeč escapuje automaticky)
  return div.innerHTML;    // Vrátíme bezpečnou HTML verzi
};

/* ── Service Worker (offline podpora) ── */
// Zaregistrujeme Service Worker – soubor sw.js, který umožňuje fungování aplikace
// i bez internetového připojení (ukládá stránku do cache prohlížeče)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}