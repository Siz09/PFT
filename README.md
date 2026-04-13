# SmartSpend Mobile

Personal finance tracker focused on a single mobile app (React Native + Expo).

## Project Layout

- [`apps/mobile`](apps/mobile): Main app (Expo SDK 54 + React Native + NativeWind + SQLite)
- [`apps/web`](apps/web): UI design reference only (not required to run mobile app)

## Prerequisites

- Node.js `20.19.4` (recommended)
- Expo Go on phone (SDK 54)
- Android Studio only if you want emulator workflows

## Install

```bash
npm install
cd apps/mobile
npm install
```

## Run (LAN on local network)

```powershell
nvm use 20.19.4
cd apps/mobile
$env:REACT_NATIVE_PACKAGER_HOSTNAME="YOUR_LOCAL_IP"
npx expo start --lan --clear --port 8090
```

```bash
nvm use 20.19.4
cd apps/mobile
export REACT_NATIVE_PACKAGER_HOSTNAME="YOUR_LOCAL_IP"
npx expo start --lan --clear --port 8090
```

Replace `YOUR_LOCAL_IP` with machine LAN IP:

- Windows (PowerShell): `ipconfig`
- macOS/Linux: `ifconfig` or `ip addr`

Scan QR from Expo Go.

## Root Convenience Scripts

From repo root:

- `npm run dev:mobile`
- `npm run android`
- `npm run ios`
- `npm run lint:mobile`
- `npm run test:mobile`
