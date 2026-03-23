/* ============================================================
   Did You Know That? — app.js
   All application logic lives here.
   ============================================================ */

const API_URL    = 'https://api.api-ninjas.com/v1/facts';
const API_KEY    = '2XEi9vKcFzPJOit1TptpNxQUhD8HHxVYNA8fZ4sZ';
const LS_LAST    = 'didyouknow_last_fact';
const LS_FAVS    = 'didyouknow_favorites';

/* ── DOM References ── */
let factText, loader, generateBtn, shareBtn, favBtn, toast;
let tabBtnDiscover, tabBtnFavorites;
let panelDiscover, panelFavorites;
let favList, favEmpty, favBadge;

/* ── State ── */
let currentFact = '';
let toastTimer  = null;

/* ════════════════════════════════════════
   BOOT
════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Discover
  factText    = document.getElementById('factText');
  loader      = document.getElementById('loader');
  generateBtn = document.getElementById('generateBtn');
  shareBtn    = document.getElementById('shareBtn');
  favBtn      = document.getElementById('favBtn');
  toast       = document.getElementById('toast');

  // Tabs
  tabBtnDiscover  = document.getElementById('tabBtnDiscover');
  tabBtnFavorites = document.getElementById('tabBtnFavorites');
  panelDiscover   = document.getElementById('tab-discover');
  panelFavorites  = document.getElementById('tab-favorites');

  // Favorites
  favList  = document.getElementById('favList');
  favEmpty = document.getElementById('favEmpty');
  favBadge = document.getElementById('favBadge');

  // Event listeners
  generateBtn.addEventListener('click', handleGenerate);
  shareBtn.addEventListener('click', handleShare);
  favBtn.addEventListener('click', handleFavoriteToggle);
  tabBtnDiscover.addEventListener('click', () => switchTab('discover'));
  tabBtnFavorites.addEventListener('click', () => switchTab('favorites'));

  // Init
  updateBadge();

  const saved = loadLastFact();
  if (saved) {
    displayFact(saved);
  } else {
    fetchFact();
  }
});

/* ════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════ */
const switchTab = (tab) => {
  const isDiscover = tab === 'discover';

  // Panels
  panelDiscover.classList.toggle('active', isDiscover);
  panelFavorites.classList.toggle('active', !isDiscover);

  // Tab buttons
  tabBtnDiscover.classList.toggle('active', isDiscover);
  tabBtnDiscover.setAttribute('aria-selected', isDiscover);
  tabBtnFavorites.classList.toggle('active', !isDiscover);
  tabBtnFavorites.setAttribute('aria-selected', !isDiscover);

  if (!isDiscover) renderFavorites();
};

/* ════════════════════════════════════════
   FETCH
════════════════════════════════════════ */
const fetchFact = async () => {
  setLoadingState(true);

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: { 'X-Api-Key': API_KEY },
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const fact = data?.[0]?.fact;
    if (!fact) throw new Error('No fact returned from API.');

    saveLastFact(fact);
    displayFact(fact);

  } catch (err) {
    console.error('Failed to fetch fact:', err);
    showToast('Couldn\'t load a fact. Check your API key or connection.');
    setLoadingState(false);
  }
};

/* ════════════════════════════════════════
   DISPLAY
════════════════════════════════════════ */
const displayFact = (fact) => {
  currentFact = fact;
  factText.classList.remove('visible');

  setTimeout(() => {
    factText.textContent = fact;
    setLoadingState(false);
    factText.classList.add('visible');
    shareBtn.disabled = false;
    favBtn.disabled   = false;
    syncFavButton();
  }, 200);
};

/* ════════════════════════════════════════
   LOADING STATE
════════════════════════════════════════ */
const setLoadingState = (isLoading) => {
  if (isLoading) {
    factText.classList.remove('visible');
    factText.textContent = '';
    loader.classList.add('active');
    generateBtn.disabled = true;
    shareBtn.disabled    = true;
    favBtn.disabled      = true;
  } else {
    loader.classList.remove('active');
    generateBtn.disabled = false;
  }
};

/* ════════════════════════════════════════
   HANDLERS
════════════════════════════════════════ */
const handleGenerate = () => {
  triggerHaptic();
  fetchFact();
};

const handleShare = async () => {
  if (!currentFact) return;

  const message = `Did you know that? "${currentFact}"\n\nhttps://facts-generator-zapletal.netlify.app/`;
  const shareData = {
    title: 'Did You Know That?',
    text: message,
    url: 'https://facts-generator-zapletal.netlify.app/',
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      if (err.name !== 'AbortError') console.warn('Share failed:', err);
    }
  } else {
    try {
      await navigator.clipboard.writeText(message);
      showToast('Fact copied to clipboard!');
    } catch (err) {
      console.error('Clipboard write failed:', err);
      showToast('Could not copy — please copy the text manually.');
    }
  }
};

const handleFavoriteToggle = () => {
  if (!currentFact) return;
  triggerHaptic();

  const favs    = loadFavorites();
  const isSaved = favs.includes(currentFact);

  if (isSaved) {
    removeFavorite(currentFact);
    showToast('Removed from favorites.');
  } else {
    addFavorite(currentFact);
    showToast('Saved to favorites!');
  }

  // Pop animation
  favBtn.classList.remove('pop');
  void favBtn.offsetWidth; // reflow to restart animation
  favBtn.classList.add('pop');

  syncFavButton();
  updateBadge();
};

/* ════════════════════════════════════════
   FAVORITES — CRUD
════════════════════════════════════════ */
const loadFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_FAVS)) || [];
  } catch (_) { return []; }
};

const saveFavorites = (favs) => {
  try {
    localStorage.setItem(LS_FAVS, JSON.stringify(favs));
  } catch (_) {}
};

const addFavorite = (fact) => {
  const favs = loadFavorites();
  if (!favs.includes(fact)) {
    favs.unshift(fact); // newest first
    saveFavorites(favs);
  }
};

const removeFavorite = (fact) => {
  const favs = loadFavorites().filter(f => f !== fact);
  saveFavorites(favs);
};

/* ════════════════════════════════════════
   FAVORITES — UI
════════════════════════════════════════ */
const syncFavButton = () => {
  if (!currentFact) return;
  const isSaved = loadFavorites().includes(currentFact);
  favBtn.classList.toggle('saved', isSaved);
  favBtn.setAttribute('aria-label', isSaved ? 'Remove from favorites' : 'Save to favorites');
};

const updateBadge = () => {
  const count = loadFavorites().length;
  favBadge.textContent = count > 0 ? (count > 99 ? '99+' : count) : '';
  favBadge.classList.toggle('visible', count > 0);
};

const renderFavorites = () => {
  const favs = loadFavorites();
  favList.innerHTML = '';

  if (favs.length === 0) {
    favEmpty.classList.add('visible');
    return;
  }

  favEmpty.classList.remove('visible');

  favs.forEach((fact) => {
    const card = document.createElement('article');
    card.className = 'fav-card';
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

    card.querySelector('.fav-remove-btn').addEventListener('click', () => {
      triggerHaptic();
      removeFavorite(fact);
      updateBadge();
      // If this was the current displayed fact, re-sync the heart button
      if (fact === currentFact) syncFavButton();
      // Animate card out before removing
      card.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(12px)';
      setTimeout(() => renderFavorites(), 260);
    });

    favList.appendChild(card);
  });
};

/* ════════════════════════════════════════
   LOCALSTORAGE — Last Fact
════════════════════════════════════════ */
const saveLastFact = (fact) => {
  try { localStorage.setItem(LS_LAST, fact); } catch (_) {}
};

const loadLastFact = () => {
  try { return localStorage.getItem(LS_LAST) || null; } catch (_) { return null; }
};

/* ════════════════════════════════════════
   UTILS
════════════════════════════════════════ */
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(40); } catch (_) {}
  }
};

const showToast = (message, duration = 3000) => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
};

// Prevent XSS when injecting facts into innerHTML
const escapeHtml = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/* ── Service Worker ── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}