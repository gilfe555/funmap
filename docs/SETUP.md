# Dev Environment Setup

This guide sets up your local development environment for FunMap.

## Required Tools

All of these should already be installed if you cloned this repo from the project creator. Verify each one:

```bash
node --version      # Should be v18+
npm --version
npx expo --version
eas --version
git --version
gh --version
```

## Fix: ADB Not on PATH (Windows)

The Android SDK tools (including `adb`) need to be on your PATH to run the emulator from the terminal.

1. Open **Start Menu** → search "Edit the system environment variables" → open it
2. Click **Environment Variables**
3. Under **User variables**, find `Path` → click **Edit**
4. Click **New** and add these two paths:
   ```
   C:\Users\<YourUsername>\AppData\Local\Android\Sdk\platform-tools
   C:\Users\<YourUsername>\AppData\Local\Android\Sdk\emulator
   ```
5. Click **OK** on all dialogs
6. **Restart your terminal** (important — the PATH change won't apply until you do)
7. Verify: `adb --version` should now work

## Running on Your Phone (Recommended for GPS Testing)

1. Install **Expo Go** on your Android phone from the Play Store
2. Make sure your phone and computer are on the **same Wi-Fi network**
3. In the project folder, run: `npx expo start`
4. Scan the QR code with your phone camera (Android) or the Expo Go app
5. The app will load on your phone with real GPS

> **Tip:** This is the best way to test the map and Fun toggle because you get real GPS coordinates.

## Running on Android Emulator

1. Make sure ADB is on your PATH (see above)
2. Open Android Studio (if not already open) or the Android Studio Device Manager
3. You have two AVDs available:
   - `Pixel_8` (recommended — modern device)
   - `Medium_Phone_API_36.1`
4. Start the emulator from Android Studio **or** from terminal (after PATH fix):
   ```bash
   emulator -avd Pixel_8
   ```
5. In a separate terminal, run:
   ```bash
   npx expo start --android
   ```
   This will automatically install and launch the app in the emulator.

### Setting a Mock GPS Location in the Emulator

The emulator doesn't have real GPS, but you can set a fake location:

1. In Android Emulator, click the three-dot menu (⋮) on the right side
2. Go to **Location**
3. Enter latitude and longitude (e.g., Tel Aviv: `32.0853, 34.7818`)
4. Click **Set Location**

This lets you see heat blobs at specific coordinates when testing with seed data.

## Environment Variables

Copy the template and fill in your keys:

```bash
cp .env.example .env
```

Then edit `.env` with:
- Your Supabase URL and anon key (from [docs/SUPABASE.md](SUPABASE.md))
- Your Google Maps API key (from [docs/GOOGLE_MAPS.md](GOOGLE_MAPS.md))

> **Never commit `.env`** — it's in `.gitignore`. Share keys with collaborators via a secure channel (e.g., a private message or password manager).

## First Run Checklist

- [ ] `node --version` shows v18+
- [ ] ADB on PATH (`adb --version` works)
- [ ] `.env` file exists with all 3 keys filled in
- [ ] Supabase project created and schema applied (see [SUPABASE.md](SUPABASE.md))
- [ ] `npm install` completes without errors
- [ ] `npx expo start` launches successfully
- [ ] App loads on phone or emulator
