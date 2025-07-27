# Firebase Setup Guide - Complete Fix

## Current Issues:

1. ❌ **Storage bucket doesn't exist** - Need to create `inque-31cb5.firebasestorage.app`
2. ❌ **Missing Firestore index** - Need to create index for notifications
3. ❌ **CORS errors** - Will be fixed once bucket exists

## Step-by-Step Fix:

### 1. Create Storage Bucket (CRITICAL)

1. Go to [Firebase Console](https://console.firebase.google.com/project/inque-31cb5)
2. Click **Storage** in the left sidebar
3. Click **"Get started"** or **"Create bucket"**
4. Choose location: **US-CENTRAL1** (or closest to your users)
5. **IMPORTANT:** The bucket name should be: `inque-31cb5.firebasestorage.app`
6. Click **"Create bucket"**

### 2. Create Firestore Index (CRITICAL)

1. Click the link in the error message: https://console.firebase.google.com/v1/r/project/inque-31cb5/firestore/indexes?create_composite=ClFwcm9qZWN0cy9pbnF1ZS0zMWNiNS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXxAC
2. Or manually:
   - Go to **Firestore** → **Indexes**
   - Click **"Create Index"**
   - Collection: `notifications`
   - Fields: `userId` (Ascending), `timestamp` (Descending)
   - Click **"Create"**

### 3. Deploy Rules

Run these commands:

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 4. Clear Browser Cache

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

### 5. Test Everything

1. Refresh the page
2. Try signing up a new user
3. Test notifications
4. Test file uploads

## Expected Results:

- ✅ No more CORS errors
- ✅ Storage uploads work
- ✅ Notifications work properly
- ✅ User signup completes successfully

## Troubleshooting:

If you still see errors:

1. Make sure the storage bucket exists and is named correctly
2. Check that the Firestore index was created
3. Clear browser cache completely
4. Check browser console for specific errors

## Files Already Fixed:

- ✅ `script.js` - Storage bucket configuration
- ✅ `scripts/firebase-init.js` - Storage bucket configuration
- ✅ `scripts/auth.js` - Error handling
- ✅ `firestore.rules` - Notifications permissions
