# Did You Know That?

**Did You Know That?** is a simple PWA built with **HTML, CSS, and vanilla JavaScript**. It displays a random fact as soon as you open it.

## Features

* Shows a random fact on load
* Generate a new fact with a button
* Share the fact using the Web Share API
* Light haptic feedback with the Vibration API
* Saves the last fact using localStorage

## Project Files

* index.html
* style.css
* app.js

## How to Run the Project

This project uses **Progressive Web App (PWA)** features, so it must be served via a local server (it will not work correctly if opened directly via `file://`).

### Requirements

* Node.js (includes npm)

### Steps

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd <your-project-folder>
   ```

2. Run a local server using:

   ```bash
   npx serve
   ```

3. Open your browser and go to:

   ```
   http://localhost:3000
   ```

## Notes

* PWA features like the **Service Worker** and **manifest** require `http://localhost` or HTTPS.
* If something doesn’t update (e.g. styles or icons), clear the cache or unregister the Service Worker in DevTools.
