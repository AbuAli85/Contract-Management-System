# Google Maps Integration Setup

This document explains how to set up Google Maps API for the attendance location picker feature.

## Overview

The attendance link manager now includes Google Maps integration, allowing employers to search for locations like "Grand Mall Muscat" or "City Center Muscat" instead of manually entering coordinates.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project with billing enabled
3. Google Maps JavaScript API and Places API enabled

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project

### 2. Enable Required APIs

Enable the following APIs in your GCP project:

1. **Maps JavaScript API**
   - Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
   - Search for "Maps JavaScript API"
   - Click "Enable"

2. **Places API**
   - Search for "Places API"
   - Click "Enable"

### 3. Create API Key

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 4. Restrict API Key (Recommended)

For security, restrict your API key:

1. Click on the API key you just created
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domain(s):
     - `localhost:3000/*` (for development)
     - `127.0.0.1:3000/*` (for local development)
     - `https://portal.thesmartpro.io/*` (for production - **REQUIRED**)
     - `https://*.thesmartpro.io/*` (for all subdomains, optional)
     - `https://yourdomain.com/*` (if using a different domain)

   **Important**: You must add your production domain exactly as shown above. The domain must match exactly, including the protocol (`https://`) and the trailing `/*` wildcard.

3. Under "API restrictions":
   - Select "Restrict key"
   - Choose:
     - Maps JavaScript API
     - Places API
4. Click "Save"

**Note**: It may take a few minutes for API key restrictions to propagate. If you see `RefererNotAllowedMapError`, wait 2-3 minutes and refresh the page.

### 5. Add API Key to Environment Variables

Add the API key to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important**:
- The variable name must start with `NEXT_PUBLIC_` to be accessible in the browser
- Never commit your `.env.local` file to version control
- Add `.env.local` to your `.gitignore` file

### 6. Restart Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

## Features

The Google Maps location picker provides:

1. **Autocomplete Search**: Type location names like "Grand Mall Muscat" and get suggestions
2. **Location Details**: Automatically extracts coordinates and address
3. **Oman-Specific Results**: Results are restricted to Oman for better accuracy
4. **Multiple Location Sources**: Choose between:
   - Google Maps Search (recommended)
   - Office Location (from your saved locations)
   - Custom Coordinates (manual entry)

## Usage

1. When creating an attendance link, select "Google Maps Search" as the location source
2. Type a location name (e.g., "Grand Mall Muscat")
3. Select from the autocomplete suggestions
4. The system automatically extracts:
   - Latitude and longitude
   - Full address
   - Location name

## Troubleshooting

### "Loading Google Maps..." message persists

- Check that your API key is correctly set in `.env.local`
- Verify the API key has the correct restrictions
- Ensure Maps JavaScript API and Places API are enabled
- Check browser console for error messages

### No suggestions appear

- Verify Places API is enabled in GCP
- Check API key restrictions allow your domain
- Ensure you're typing at least 3 characters
- Check browser console for API errors

### API Key errors in console

- Verify the API key is correct
- Check API restrictions allow the required APIs
- Ensure billing is enabled on your GCP project
- Check API quotas haven't been exceeded

### RefererNotAllowedMapError

**Error Message**: `Google Maps JavaScript API error: RefererNotAllowedMapError`

**Cause**: Your API key is restricted to specific domains, and the current domain is not in the allowed list.

**Solution**:
1. Go to [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "Application restrictions" > "HTTP referrers (web sites)", add:
   - `https://portal.thesmartpro.io/*` (for production)
   - `localhost:3000/*` (for development)
4. Click "Save"
5. Wait 2-3 minutes for changes to propagate
6. Refresh your browser page

**Important**:
- The domain must match exactly (including `https://` and trailing `/*`)
- Changes may take a few minutes to take effect
- Clear browser cache if the error persists after 5 minutes

## Cost Considerations

Google Maps API has usage-based pricing:

- **Maps JavaScript API**: Free tier includes $200/month credit
- **Places API**:
  - Autocomplete: $2.83 per 1,000 requests
  - Place Details: $17 per 1,000 requests

For most applications, the free tier should be sufficient. Monitor usage in the [GCP Console](https://console.cloud.google.com/apis/dashboard).

## Security Best Practices

1. **Restrict API Key**: Always restrict your API key to specific domains and APIs
2. **Use Environment Variables**: Never hardcode API keys in source code
3. **Monitor Usage**: Set up billing alerts in GCP
4. **Rotate Keys**: Regularly rotate API keys if compromised

## Alternative: Using Office Locations

If you prefer not to use Google Maps, you can:

1. Manually add office locations via the database or admin panel
2. Select "Office Location" when creating attendance links
3. Use "Custom Coordinates" for manual entry

## Support

For issues with:
- **Google Maps API**: Check [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- **Application Integration**: Check application logs and browser console

