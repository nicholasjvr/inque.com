# Firebase Setup Guide - Fixing Storage and Firestore Issues

## Issues Fixed:

1. ✅ **Storage Bucket Configuration** - Updated from `inque-31cb5.appspot.com` to `inque-31cb5.firebasestorage.app`
2. ✅ **Firestore Rules** - Added notifications collection permissions
3. ✅ **Auth Code** - Fixed storage error handling and removed undefined variable

## Steps to Complete Setup:

### 1. Create Storage Bucket (Required)

1. Go to [Firebase Console](https://console.firebase.google.com/project/inque-31cb5)
2. Navigate to **Storage** in the left sidebar
3. Click **"Get started"** or **"Create bucket"**
4. Choose location: **US-CENTRAL1** (or closest to your users)
5. Bucket name should be: `inque-31cb5.firebasestorage.app`

### 2. Deploy Rules

Run one of these commands in your terminal:

**Option A - Using the batch file:**

```bash
deploy-rules.bat
```

**Option B - Using PowerShell:**

```powershell
.\deploy-rules.ps1
```

**Option C - Manual commands:**

```bash
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 3. Test the Setup

1. Refresh your website
2. Try signing up a new user
3. Check the browser console for any remaining errors
4. Test the "Test Upload" and "Test Notifications" buttons

## What Was Fixed:

### Storage Bucket Configuration

- **Before:** `inque-31cb5.appspot.com` (doesn't exist)
- **After:** `inque-31cb5.firebasestorage.app` (correct bucket)

### Firestore Rules

- Added permissions for notifications collection
- Users can now read/write their own notifications

### Auth Code

- Fixed undefined `slot` variable in signup process
- Better error handling for storage operations
- Graceful fallback if storage setup fails

## Expected Results:

- ✅ User signup should work without storage errors
- ✅ Notifications should work properly
- ✅ File uploads should work once bucket is created
- ✅ No more CORS errors for storage operations

## Troubleshooting:

If you still see errors:

1. Make sure the storage bucket exists in Firebase console
2. Check that rules were deployed successfully
3. Clear browser cache and refresh
4. Check browser console for specific error messages

## Files Modified:

- `script.js` - Fixed storage bucket name
- `scripts/firebase-init.js` - Fixed storage bucket name
- `scripts/auth.js` - Fixed signup code and error handling
- `firestore.rules` - Added notifications permissions
- `deploy-rules.bat` - Deployment script (new)
- `deploy-rules.ps1` - Deployment script (new)
