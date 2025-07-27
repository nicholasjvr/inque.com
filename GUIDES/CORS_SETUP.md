# Firebase Storage CORS Setup Guide

## The Issue

You're experiencing CORS errors when trying to upload files to Firebase Storage. The preflight requests are failing with 400 status codes.

## Solution: Manual CORS Configuration

Since `gsutil` is not available, we need to set CORS through the Google Cloud Console:

### Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Select your project: `inque-31cb5`
3. Navigate to **Cloud Storage** > **Buckets**

### Step 2: Find Your Storage Bucket

1. Look for the bucket: `inque-31cb5.appspot.com`
2. Click on the bucket name

### Step 3: Set CORS Configuration

1. In the bucket details page, click on the **"CORS"** tab
2. Click **"Add CORS rule"**
3. Use this configuration:

```json
[
  {
    "origin": [
      "https://inque-31cb5.web.app",
      "https://inque-31cb5.firebaseapp.com",
      "http://localhost:5000",
      "http://localhost:3000"
    ],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-resumable"
    ]
  }
]
```

4. Click **"Save"**

### Step 4: Test the Upload

1. Go back to your app: https://inque-31cb5.web.app
2. Try uploading a file through the widget management interface
3. Check the browser console for any remaining CORS errors

## Alternative: Use Firebase CLI with gsutil

If you want to use the command line, you can install the Google Cloud SDK:

1. Download from: https://cloud.google.com/sdk/docs/install
2. Install and run: `gcloud init`
3. Then run: `gsutil cors set cors.json gs://inque-31cb5.appspot.com`

## Current Status

✅ Storage rules deployed correctly
✅ CORS configuration file created
⏳ Manual CORS setup needed through Google Cloud Console

## Expected Result

After setting CORS, uploads should work without the "Response to preflight request doesn't pass access control check" errors.
