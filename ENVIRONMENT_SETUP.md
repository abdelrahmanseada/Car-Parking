# Environment Setup Guide

## Backend API Configuration

To connect the frontend to your backend API, you need to configure the API base URL.

## Step 1: Create Environment File

Create a file named `.env.local` in the project root directory (same level as `package.json`):

```
Car-Parking-main/
├── .env.local          ← Create this file
├── package.json
├── src/
└── ...
```

## Step 2: Add Configuration

Add the following content to `.env.local`:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:3000/api
```

**Important Notes:**
- Replace `http://localhost:3000/api` with your actual backend URL
- The variable MUST start with `VITE_` to be accessible in the app
- Do NOT include a trailing slash
- This file is gitignored and will not be committed

## Step 3: Example Configurations

### Local Development
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Docker/Container
```env
VITE_API_BASE_URL=http://backend:3000/api
```

### Production Server
```env
VITE_API_BASE_URL=https://api.yourcompany.com/api
```

### Different Port
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Step 4: Restart Development Server

After creating/updating `.env.local`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Verification

1. Open your browser's Developer Tools (F12)
2. Go to the Network tab
3. Try logging in or viewing garages
4. Check that requests are being sent to your configured URL

## Default Behavior

If no `.env.local` file exists, the app will use:
```
http://localhost:3000/api
```

## Troubleshooting

### "Network error. Check your connection"
- Verify backend server is running
- Check the URL in `.env.local` is correct
- Ensure no firewall is blocking the connection

### "Request timeout"
- Backend might be slow or unresponsive
- Check backend logs for errors
- Increase timeout in `src/services/api.ts` if needed

### Changes not taking effect
- Make sure you restarted the dev server after editing `.env.local`
- Clear browser cache
- Check for typos in variable name (must be `VITE_API_BASE_URL`)

### CORS errors
- Backend must allow requests from your frontend origin
- Check backend CORS configuration
- Ensure credentials are being sent if required

## Security Notes

- Never commit `.env.local` to version control
- Use environment-specific URLs
- Keep production URLs secure
- Rotate API keys/tokens regularly

