# Google Maps API Key Setup

FunMap uses Google Maps for the interactive map. You need a Google Maps API key for Android.

## Free Tier

Google Maps gives **$200/month** in free credits, which covers roughly **28,000 map loads/month** — more than enough for development and early-stage usage. You only need to enter a credit card to set up billing, but won't be charged unless you exceed the free tier.

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it `FunMap` → click **Create**
4. Make sure the new project is selected in the dropdown

### 2. Enable the Maps SDK for Android

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for **Maps SDK for Android**
3. Click on it → click **Enable**

### 3. Set Up Billing (Required by Google)

1. Go to **Billing** in the left sidebar
2. Link a billing account (or create one)
3. Enter your credit card — you won't be charged until you exceed $200/month in usage

### 4. Create an API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **API key**
3. Your API key is created — copy it

### 5. Restrict the API Key (Important for Security)

Restricting the key prevents it from being used by others if it's ever exposed.

1. Click on the newly created API key to edit it
2. Under **Application restrictions**, select **Android apps**
3. Click **+ Add an item** and enter:
   - **Package name:** `com.funmap.app`
   - **SHA-1 certificate fingerprint:** for development, run this command and paste the output:
     ```bash
     cd android && ./gradlew signingReport
     ```
     (You can skip this for now and add it later once the Android project is generated)
4. Under **API restrictions**, select **Restrict key** and choose:
   - Maps SDK for Android
5. Click **Save**

### 6. Add the Key to Your Project

Add the key to your `.env` file:
```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

The key is also referenced in `app.json` under `android.config.googleMaps.apiKey` — Expo reads it from `.env` automatically via `process.env`.

> **Never commit your API key.** The `.env` file is gitignored. Share the key with collaborators via a secure channel.

## Troubleshooting

**Map shows as gray/blank:** The API key is wrong or the Maps SDK for Android isn't enabled. Double-check both.

**"This API key is not authorized":** The package name restriction doesn't match. During development with Expo Go, try temporarily removing the Android app restriction (add it back before production).

**Billing alert:** Set up a billing budget alert in Google Cloud (Billing → Budgets & alerts) so you're notified if usage ever approaches the free tier limit.
