/* ============================================================
   Did You Know That? — app.js
   All application logic lives here.
   ============================================================ */

const API_URL = 'https://api.api-ninjas.com/v1/facts';
const API_KEY  = '2XEi9vKcFzPJOit1TptpNxQUhD8HHxVYNA8fZ4sZ';
const LS_KEY   = 'didyouknow_last_fact';

/* ── DOM References ── */
let factText, loader, generateBtn, shareBtn, toast;

/* ── State ── */
let currentFact = '';
let toastTimer  = null;

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  factText    = document.getElementById('factText');
  loader      = document.getElementById('loader');
  generateBtn = document.getElementById('generateBtn');
  shareBtn    = document.getElementById('shareBtn');
  toast       = document.getElementById('toast');

  generateBtn.addEventListener('click', handleGenerate);
  shareBtn.addEventListener('click', handleShare);

  const saved = loadSavedFact();
  if (saved) {
    displayFact(saved);
  } else {
    fetchFact();
  }
});

/* ── Fetch ── */
const fetchFact = async () => {
  setLoadingState(true);

  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: { 'X-Api-Key': API_KEY },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // The API returns an array; grab the first item's .fact field
    const fact = data?.[0]?.fact;
    if (!fact) throw new Error('No fact returned from API.');

    saveFact(fact);
    displayFact(fact);

  } catch (err) {
    console.error('Failed to fetch fact:', err);
    showToast('Couldn\'t load a fact. Check your API key or connection.');
    setLoadingState(false);
  }
};

/* ── Display ── */
const displayFact = (fact) => {
  currentFact = fact;

  // Fade out, swap text, fade in
  factText.classList.remove('visible');

  setTimeout(() => {
    factText.textContent = fact;
    setLoadingState(false);
    factText.classList.add('visible');
    shareBtn.disabled = false;
  }, 200);
};

/* ── Loading UI ── */
const setLoadingState = (isLoading) => {
  if (isLoading) {
    factText.classList.remove('visible');
    factText.textContent = '';
    loader.classList.add('active');
    generateBtn.disabled = true;
    shareBtn.disabled    = true;
  } else {
    loader.classList.remove('active');
    generateBtn.disabled = false;
  }
};

/* ── Handlers ── */
const handleGenerate = () => {
  triggerHaptic();
  fetchFact();
};

const handleShare = async () => {
  if (!currentFact) return;

  const shareData = {
    title: 'Did You Know That?',
    text: currentFact,
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled — not an error worth surfacing
      if (err.name !== 'AbortError') {
        console.warn('Share failed:', err);
      }
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(currentFact);
      showToast('Fact copied to clipboard!');
    } catch (err) {
      console.error('Clipboard write failed:', err);
      showToast('Could not copy — please copy the text manually.');
    }
  }
};

/* ── Haptic Feedback ── */
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(40);
    } catch (_) {
    }
  }
};

/* ── LocalStorage ── */
const saveFact = (fact) => {
  try {
    localStorage.setItem(LS_KEY, fact);
  } catch (_) {
  }
};

const loadSavedFact = () => {
  try {
    return localStorage.getItem(LS_KEY) || null;
  } catch (_) {
    return null;
  }
};

/* ── Toast ── */
const showToast = (message, duration = 3000) => {
  if (toastTimer) clearTimeout(toastTimer);

  toast.textContent = message;
  toast.classList.add('show');

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
};
