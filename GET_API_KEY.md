# 🔑 How to Get Your FREE Gemini API Key (2 Minutes!)

## Why You Need This

The warning "**Demo Mode Active**" appears because you haven't set up your **FREE** Google Gemini API key yet. 

**Without the key**: You get basic demo recipes
**With the key**: You get AI-powered, personalized recipes! ✨

---

## 🎁 Step-by-Step Guide (Super Easy!)

### Step 1: Get Your Free API Key

1. **Click this link**: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

2. **Sign in** with your Google account (Gmail)

3. Click **"Create API Key"** button

4. Choose **"Create API key in new project"** (recommended)

5. **Copy** the API key that appears (it looks like: `AIzaSyABC123...`)

---

### Step 2: Add the Key to Your Project

1. **Open** the `.env` file in your project root folder:
   ```
   D:\project\waste food market\.env
   ```

2. **Replace** the empty value with your API key:
   ```env
   GEMINI_API_KEY=AIzaSyABC123xyz...paste-your-key-here
   GOOGLE_VISION_KEY=
   PORT=3001
   ```

3. **Save** the file

---

### Step 3: Restart the Server

**Stop the current server** (Press `Ctrl+C` in the terminal) and restart:

```bash
npm run dev:full
```

**That's it!** 🎉 The warning will disappear and you'll have full AI features!

---

## 🆓 Free Gemini Models Available

Once you add your API key, you can choose from these FREE models:

| Model | Speed | Quality | Best For |
|-------|-------|---------|----------|
| **Gemini 2.0 Flash Exp** ⚡ | ⚡⚡⚡ | ⭐⭐⭐⭐ | Latest experimental features |
| **Gemini 1.5 Flash** 🚀 | ⚡⚡⚡ | ⭐⭐⭐⭐ | Fast, balanced (recommended) |
| **Gemini 1.5 Flash-8B** ⚡⚡ | ⚡⚡⚡⚡ | ⭐⭐⭐ | Fastest responses |
| **Gemini 1.5 Pro** 👑 | ⚡⚡ | ⭐⭐⭐⭐⭐ | Best quality, longer recipes |
| **Gemini Pro** 📝 | ⚡⚡ | ⭐⭐⭐⭐ | Legacy model |

**All models are 100% FREE!** ✅

---

## 📊 Free Tier Limits

Google Gemini API free tier includes:

- ✅ **15 requests per minute**
- ✅ **1,500 requests per day**
- ✅ **1 million tokens per day**
- ✅ No credit card required
- ✅ Perfect for personal use!

For a recipe app, this means you can generate **hundreds of recipes per day** for free!

---

## 🔒 Is It Safe?

**YES!** Your API key:
- ✅ Is stored only in your `.env` file (never committed to git)
- ✅ Only works for your Google account
- ✅ Can be deleted/regenerated anytime
- ✅ Only has access to Gemini API (nothing else)

---

## 🎨 Optional: Camera Scanner Key (Google Vision)

For the **camera ingredient scanner** feature, you can also get a free Google Cloud Vision API key:

### Quick Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Cloud Vision API**
4. Create **API Key** in Credentials
5. Add to `.env`:
   ```env
   GOOGLE_VISION_KEY=your-vision-key-here
   ```

**Note**: Cloud Vision has 1,000 free requests per month.

---

## 🖼️ Optional: Local TFJS Classifier

If you don't want to use the Cloud Vision API, the app can run an optional local image classifier (MobileNet) in-browser using TensorFlow.js. This avoids sending images to a remote service but adds a weighty dependency to the client bundle.

To enable local TFJS classification:
1. From the project root run:
```bash
cd curi-cuisine
npm install @tensorflow/tfjs @tensorflow-models/mobilenet
```
2. In the app UI, open Camera Scanner and toggle "Use local TFJS classifier" if the banner indicates Vision is not configured.
3. Restart the dev server to pick up bundle changes.

Note: TFJS models increase the client bundle size and may be slower on older devices; prefer the Cloud Vision API for best results.

---

## ❓ Troubleshooting

### "Invalid API Key" Error

1. Check for extra spaces in `.env` file
2. Make sure the key starts with `AIzaSy`
3. Verify the key is active in [Google AI Studio](https://makersuite.google.com/app/apikey)

### Warning Still Shows

1. Make sure you saved the `.env` file
2. Restart the server (`Ctrl+C` then `npm run dev:full`)
3. Clear browser cache and refresh

### Rate Limit Errors

You've hit the free tier limit. Wait a minute or check your quota at [Google AI Studio](https://makersuite.google.com/app/apikey).

---

## 🎯 Quick Copy-Paste Template

**Your `.env` file should look like this:**

```env
# Replace YOUR_KEY_HERE with actual key from https://makersuite.google.com/app/apikey
GEMINI_API_KEY=YOUR_KEY_HERE

# Optional: For camera scanner feature
GOOGLE_VISION_KEY=

# Server port (don't change unless needed)
PORT=3001
```

---

## ✨ What Changes After Adding the Key?

**Before** (Demo Mode):
- ❌ "Demo Mode Active" warning shows
- ❌ Basic fallback recipes only
- ❌ Model selector disabled
- ❌ Limited recipe quality

**After** (Full AI Mode):
- ✅ No warnings!
- ✅ AI-generated personalized recipes
- ✅ All models available
- ✅ Better recipe quality
- ✅ Nutrition analysis
- ✅ Smart substitutions
- ✅ Multi-language translation

---

## 🚀 Summary

1. **Get key**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. **Add to `.env`**: `GEMINI_API_KEY=your-key-here`
3. **Restart server**: `npm run dev:full`
4. **Enjoy!** 🎉

**Takes literally 2 minutes and it's 100% FREE!**

---

## 📞 Still Need Help?

If you're still seeing the warning after following these steps:

1. Check the `.env` file is in the root folder (`D:\project\waste food market\.env`)
2. Verify there are no spaces before/after the `=` sign
3. Make sure you restarted the server
4. Check the browser console for any error messages

**The app works without the key, but you're missing out on amazing AI features!** 🤖✨
