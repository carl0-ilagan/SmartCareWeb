# How to Install Smart Care on Your Phone

## Prerequisites
- The app must be running on HTTPS (required for PWA)
- For local testing, you can use ngrok or deploy to Vercel/Netlify

## Android Installation

1. Open Chrome browser on your Android phone
2. Navigate to your Smart Care app URL
3. Tap the **3-dot menu** (⋮) in the top-right corner
4. Look for **"Install app"** or **"Add to Home Screen"** option
5. Tap it and confirm the installation
6. The Smart Care icon will appear on your home screen

**Alternative:** If you see an install prompt banner at the bottom, just tap **"Install"**

## iOS Installation (iPhone/iPad)

1. Open **Safari browser** (not Chrome - Chrome on iOS doesn't support PWA installation)
2. Navigate to your Smart Care app URL
3. Tap the **Share button** (square with arrow pointing up) at the bottom
4. Scroll down and tap **"Add to Home Screen"**
5. Edit the name if desired, then tap **"Add"** in the top-right
6. The Smart Care icon will appear on your home screen

## For Local Development Testing

### Option 1: Using ngrok (Recommended for quick testing)

1. Install ngrok: https://ngrok.com/download
2. Start your Next.js app: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
5. Open this URL on your phone's browser
6. Follow the installation steps above

### Option 2: Using your local network IP

1. Find your computer's IP address:
   - Windows: Open CMD, type `ipconfig`, look for IPv4 Address
   - Mac/Linux: Open Terminal, type `ifconfig`, look for inet address
2. Make sure your phone is on the same Wi-Fi network
3. On your phone, go to: `http://YOUR_IP_ADDRESS:3000`
   - Example: `http://192.168.1.100:3000`
4. Note: This might not work fully for PWA since HTTPS is preferred, but basic installation may work

### Option 3: Deploy to Vercel (Free & Recommended)

1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your GitHub repository
4. Deploy (Vercel will automatically provide HTTPS)
5. Open the deployed URL on your phone
6. Install as PWA

## Troubleshooting

### Android: No "Install app" option?
- Make sure you're using Chrome browser
- Check if the site is served over HTTPS
- Clear Chrome cache and try again
- Make sure you visited the site at least once before

### iOS: "Add to Home Screen" not working?
- **Must use Safari** (not Chrome or other browsers)
- Make sure you're using HTTPS
- Try adding from Safari's share menu manually

### App not installing?
- Check browser console for errors
- Ensure service worker is registered (check DevTools > Application > Service Workers)
- Verify manifest.json is accessible at `/manifest.json`

## After Installation

Once installed, the app will:
- ✅ Open in fullscreen (no browser UI)
- ✅ Work offline (cached pages)
- ✅ Load faster (service worker caching)
- ✅ Show up like a native app

## Uninstalling

- **Android:** Long press the icon → Uninstall or App Info → Uninstall
- **iOS:** Long press the icon → Remove App → Delete App

