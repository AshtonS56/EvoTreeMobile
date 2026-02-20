# EvoTree Mobile (Expo)

This project now runs as an Expo React Native app for iOS and Android.

## Run in Expo Go

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm start
   ```
3. Scan the QR code with Expo Go on iOS or Android.

## Build for App Store / Play Store

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to Expo:
   ```bash
   eas login
   ```
3. Configure and build production binaries:
   ```bash
   eas build --platform ios --profile production
   eas build --platform android --profile production
   ```
4. Submit builds:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Environment

Set the backend URL in `.env`:

```bash
EXPO_PUBLIC_API_URL=https://backend.evotree.tech
```

## Current feature parity

- Firebase login/signup/password reset/account management
- Personal phylogenetic tree saved to Firestore
- World tree synced with backend API
- Camera/gallery image species identification via iNaturalist
- Species-to-taxonomy tree building via GBIF
- News feed retrieval and daily local cache
- Save tree image to device photo library
