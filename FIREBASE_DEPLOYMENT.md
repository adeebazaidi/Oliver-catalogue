# Firebase Setup & Deployment Guide

This guide will walk you through setting up your Firebase backend (Database + Storage) and deploying your compiled application to the web using Firebase Hosting.

## Phase 1: Creating the Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Give your project a name (e.g., `oliver-catalogue`) and click Continue.
4. (Optional) Disable Google Analytics unless you specifically want it, then click **Create project**.
5. Once your project is ready, click **Continue** to go to your dashboard.

## Phase 2: Register the Web App & Get Credentials

1. On the Project Overview page, click the **Web icon `</>`** (it looks like a white circle with brackets).
2. Register the app with a nickname (e.g., `Catalogue Web App`).
3. **Check the box** that says "Also set up **Firebase Hosting** for this app."
4. Click **Register app**.
5. You will see a block of code with a `firebaseConfig` object. **Keep this tab open**, you will need these keys in Phase 4.
6. Click **Next** through the rest of the steps and click **Continue to console**.

## Phase 3: Enable the Backend Services

Your app requires a Database (Firestore) to save text data and Storage to save images.

### A. Enable Firestore (Database)
1. In the left sidebar, click **Build > Firestore Database**.
2. Click **Create database**.
3. Select your location (choose one closest to you/your users).
4. Start in **Test mode** (this allows reads/writes during development).
5. Click **Enable**.

### B. Enable Storage (Images)
1. In the left sidebar, click **Build > Storage**.
2. Click **Get started**.
3. Start in **Test mode**.
4. Click **Done** / Enable.

## Phase 4: Configure Your Local Project

You need to tell your local code how to connect to this specific Firebase project.

1. In your local code editor, rename the file `.env.example` to `.env` (or create a new `.env` file in the root folder).
2. Copy the keys from the `firebaseConfig` you got in Phase 2 and paste them into your `.env` file like this:

```env
VITE_FIREBASE_API_KEY="your-api-key-here"
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```
*(Never share this `.env` file publicly, it contains your private keys!)*

## Phase 5: Initialize Hosting Locally

Now you will prepare your computer to send the code to Firebase. Open your terminal in your project folder (`d:\AntiGravity\Oliver-catalogue`):

1. **Install the CLI:** 
   ```bash
   npm install -g firebase-tools
   ```
2. **Log into your Google Account:**
   ```bash
   firebase login
   ```
   *(This will open a browser window asking you to authenticate).*
3. **Initialize the Project:**
   ```bash
   firebase init hosting
   ```
   * **Question 1:** Select `Use an existing project` and select the project you made in Phase 1.
   * **Question 2 (Public Directory):** Type `dist` and press Enter. (CRITICAL STEP)
   * **Question 3 (Single-page app):** Type `y` and press Enter.
   * **Question 4 (GitHub Deploys):** Type `N` and press Enter.
   * **Question 5 (Overwrite index.html?):** Type `N` and press Enter. (CRITICAL STEP)

## Phase 6: Build and Deploy!

You are now ready to go live. Anytime you make code changes, you just run these two commands:

1. **Compile the optimized production code:**
   ```bash
   npm run build
   ```
   *(This creates the final `dist` folder).*

2. **Deploy to the internet:**
   ```bash
   firebase deploy
   ```

Firebase will print out a **Hosting URL** in your terminal (e.g., `https://oliver-catalogue.web.app`). Your software is now live and fully functioning!

---

### Custom Domains (Optional)
If you bought a domain name for your software (e.g., `www.mycataloguesoftware.com`):
1. Go to the Firebase Console -> Build -> Hosting.
2. Click **Add custom domain**.
3. Follow the instructions to add the DNS TXT records to your domain provider (GoDaddy, Namecheap, etc.). Firebase provisions free SSL automatically.
