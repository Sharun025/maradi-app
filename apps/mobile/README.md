# Maradi Mobile

Expo app with TypeScript and Expo Router.

## Prerequisites

- Node.js 18+
- Expo Go app on your device (for physical device testing)
- iOS Simulator (macOS) or Android Emulator (for simulator testing)

## Development

```bash
# From monorepo root
npm run dev

# Or from apps/mobile
cd apps/mobile && npx expo start
```

- **iOS Simulator**: Press `i` in the terminal
- **Android Emulator**: Press `a` in the terminal
- **Web**: Press `w` in the terminal
- **Expo Go**: Scan the QR code with your device

## Scripts

| Command               | Description                   |
| --------------------- | ----------------------------- |
| `npm run dev`         | Start Expo development server |
| `npm run android`     | Start with Android            |
| `npm run ios`         | Start with iOS                |
| `npm run web`         | Start with web                |
| `npm run build`       | Export for production         |
| `npm run lint`        | Run ESLint                    |
| `npm run check-types` | Run TypeScript check          |
