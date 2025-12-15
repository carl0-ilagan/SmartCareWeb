# Gmail API Setup Guide

## Step 1: OAuth Client Credentials

You need to create an OAuth client in Google Cloud Console. Here's how:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application" as the application type
6. Add authorized redirect URI: `http://localhost:3000/api/gmail/callback` (for production, use your domain)
7. Copy your Client ID and Client Secret

## Step 2: Add to Environment Variables

Add these to your `.env.local` file (replace with your actual credentials):

```env
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_ADMIN_EMAIL=your_admin_email@gmail.com
```

## Step 3: Get Refresh Token

1. Go to `/admin/messages` page
2. Click on the "Gmail" tab
3. Click the "Connect Gmail Account" button
4. You will be redirected to Google to authorize
5. After authorization, you will be redirected back with a refresh token
6. Copy the refresh token and add it to `.env.local`:

```env
GMAIL_REFRESH_TOKEN=your_refresh_token_here
```

## Step 4: Restart Your Server

After adding all environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Step 5: Test

1. Go to `/admin/messages`
2. Click on "Gmail" tab
3. Click the refresh button or wait for auto-fetch
4. Your Gmail emails should now appear!

## Troubleshooting

- If you see "Gmail API not configured", make sure all environment variables are set correctly
- If OAuth fails, check that your redirect URI matches exactly: `http://localhost:3000/api/gmail/callback`
- Make sure you've authorized the Gmail API scope in Google Cloud Console
