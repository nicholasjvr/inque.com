# Create Firestore Index for Notifications

## Quick Fix:

Click this link to create the missing index:
https://console.firebase.google.com/v1/r/project/inque-31cb5/firestore/indexes?create_composite=ClFwcm9qZWN0cy9pbnF1ZS0zMWNiNS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgl0aW1lc3RhbXAQAhoMCghfX25hbWVfXxAC

## Manual Steps:

1. Go to [Firebase Console](https://console.firebase.google.com/project/inque-31cb5)
2. Click **Firestore Database** in the left sidebar
3. Click **Indexes** tab
4. Click **"Create Index"**
5. Fill in:
   - **Collection ID:** `notifications`
   - **Fields:**
     - `userId` (Ascending)
     - `timestamp` (Descending)
6. Click **"Create"**

## What This Fixes:

- ✅ Notifications will load properly
- ✅ No more "query requires an index" errors
- ✅ Real-time notifications will work

## After Creating Index:

1. Wait for the index to build (may take a few minutes)
2. Refresh your website
3. Test notifications again
