# Development Instructions

## Running the App Locally with Internet Access

When starting the app for development, use the tunnel command by default so
ngrok starts alongside the Expo dev server:

```bash
npm run web:tunnel
```

This command:
1. Starts the Expo web dev server on `localhost:8081`
2. Automatically creates an ngrok tunnel to expose the app publicly
3. Displays the public HTTPS URL in the console (e.g., `https://abc123-xyz.ngrok.io`)

The public URL is perfect for testing on mobile devices or from anywhere on the internet.

If the user asks to "start the app" or otherwise launch the dev server, prefer
`npm run web:tunnel` and report both the local URL and the ngrok HTTPS URL once
they are available.

### Regular Development (Local Only)

For local testing only without internet access, or when the user explicitly asks
for a local-only server:

```bash
npm run web
```

## Installation

Always run `npm install` after pulling changes or on first setup.

## Dependencies

The project uses:
- **Expo** for React Native web development
- **React Query** for data fetching
- **Supabase** for backend services
- **NativeWind** for Tailwind CSS styling
