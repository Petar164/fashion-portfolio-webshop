# Cloudinary Setup Guide

## Step 1: Create a Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account (25GB storage, 25GB bandwidth)
3. Verify your email address

## Step 2: Get Your API Credentials

1. Once logged in, go to your **Dashboard**
2. You'll see your **Cloud Name**, **API Key**, and **API Secret**
3. Copy these values

## Step 3: Add to Environment Variables

Add these to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Important:** Never commit your `.env` file to git! These are sensitive credentials.

## Step 4: Restart Your Dev Server

After adding the environment variables, restart your Next.js dev server:

```bash
npm run dev
```

## How It Works

- Images are uploaded to Cloudinary's cloud storage
- Images are automatically optimized for web
- Images are served via CDN for fast loading
- All images are stored in the `fashionvoid` folder in your Cloudinary account

## Features

- ✅ Direct file upload from your computer
- ✅ Drag & drop support
- ✅ Automatic image optimization
- ✅ CDN delivery for fast loading
- ✅ Free tier: 25GB storage, 25GB bandwidth

## Troubleshooting

**Error: "Failed to upload image"**
- Check that your Cloudinary credentials are correct in `.env`
- Make sure you've restarted your dev server after adding credentials
- Check that the file is an image (jpg, png, gif, etc.) and under 10MB

**Error: "No file provided"**
- Make sure you're selecting a file before clicking upload
- Try refreshing the page

