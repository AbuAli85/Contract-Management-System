# 🔐 CAPTCHA Troubleshooting Guide

## 🚨 **Error: "unexpected_failure" - CAPTCHA verification process failed**

This error occurs when your Supabase project has CAPTCHA verification enabled, but your application doesn't have the proper CAPTCHA configuration.

## 🎯 **Quick Fix (Recommended for Development)**

### Option 1: Disable CAPTCHA in Supabase Dashboard

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Settings"

3. **Find CAPTCHA Section**
   - Look for "CAPTCHA" or "Security" settings
   - You should see options for hCaptcha or Turnstile

4. **Disable CAPTCHA**
   - Set "Enable CAPTCHA" to **OFF**
   - Or remove the CAPTCHA configuration entirely
   - Click "Save" or "Update"

5. **Test Authentication**
   - Try logging in again
   - The error should be resolved

### Option 2: Use the Helper Script

Run the built-in helper script:

```bash
npm run auth:fix-captcha
```

This will provide step-by-step instructions and check your local configuration.

## 🔧 **Advanced Configuration (For Production)**

If you need CAPTCHA in production, follow these steps:

### Step 1: Get CAPTCHA Keys

**For hCaptcha:**
1. Go to [https://www.hcaptcha.com/](https://www.hcaptcha.com/)
2. Sign up for an account
3. Create a new site
4. Get your Site Key and Secret Key

**For Cloudflare Turnstile:**
1. Go to [https://dash.cloudflare.com/](https://dash.cloudflare.com/)
2. Navigate to Turnstile
3. Create a new site
4. Get your Site Key and Secret Key

### Step 2: Configure in Supabase

1. **In Supabase Dashboard:**
   - Go to Authentication → Settings
   - Find the CAPTCHA section
   - Select your provider (hCaptcha or Turnstile)
   - Enter your Site Key and Secret Key
   - Enable CAPTCHA

2. **In Your Application:**
   - Update your environment variables
   - Add CAPTCHA site key to your app
   - Implement CAPTCHA verification in your forms

### Step 3: Update Your App

The authentication forms now include CAPTCHA support:

- **Login Form**: Automatically shows CAPTCHA when needed
- **Signup Form**: Includes CAPTCHA verification
- **Error Handling**: Comprehensive CAPTCHA error messages

## 🧪 **Testing CAPTCHA**

### Test Without CAPTCHA (Development)
```bash
# Disable CAPTCHA in Supabase Dashboard
# Then test your authentication
npm run dev
```

### Test With CAPTCHA (Production)
```bash
# Configure CAPTCHA in Supabase Dashboard
# Update your app with CAPTCHA keys
# Test the full authentication flow
```

## 🐛 **Common Issues and Solutions**

### Issue 1: "CAPTCHA verification process failed"
**Solution**: Disable CAPTCHA in Supabase Dashboard or configure it properly

### Issue 2: CAPTCHA not showing in forms
**Solution**: Check if CAPTCHA is enabled in Supabase and your app has the proper configuration

### Issue 3: CAPTCHA keys not working
**Solution**: Verify your keys are correct and match between Supabase and your CAPTCHA provider

### Issue 4: CAPTCHA works in development but not production
**Solution**: Check environment variables and ensure CAPTCHA keys are properly configured for production

## 📋 **Environment Variables**

Add these to your `.env.local` file if using CAPTCHA:

```env
# hCaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_site_key_here
HCAPTCHA_SECRET_KEY=your_secret_key_here

# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

## 🔍 **Debugging Steps**

1. **Check Supabase Dashboard**
   - Verify CAPTCHA settings
   - Check if CAPTCHA is enabled/disabled

2. **Check Browser Console**
   - Look for CAPTCHA-related errors
   - Check network requests

3. **Check Application Logs**
   - Look for authentication errors
   - Check CAPTCHA verification logs

4. **Test Authentication Flow**
   - Try different user accounts
   - Test both login and signup

## 📚 **Additional Resources**

- [Supabase CAPTCHA Documentation](https://supabase.com/docs/guides/auth/captcha)
- [hCaptcha Documentation](https://docs.hcaptcha.com/)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Supabase Authentication Guide](https://supabase.com/docs/guides/auth)

## 🆘 **Still Having Issues?**

If you're still experiencing problems:

1. **Check the Error Handler**: The app now includes a comprehensive CAPTCHA error handler
2. **Run the Helper Script**: `npm run auth:fix-captcha`
3. **Check Supabase Status**: Visit [status.supabase.com](https://status.supabase.com)
4. **Review Documentation**: Check the official Supabase documentation

## ✅ **Verification Checklist**

- [ ] CAPTCHA is disabled in Supabase Dashboard (for development)
- [ ] Authentication forms are working without CAPTCHA errors
- [ ] Login and signup flows are functional
- [ ] Error handling is working properly
- [ ] CAPTCHA is configured for production (if needed)

---

**Note**: This guide covers the most common CAPTCHA issues. For specific problems, check the Supabase documentation or contact support.
