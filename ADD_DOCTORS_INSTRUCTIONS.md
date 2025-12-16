# Instructions: Adding Doctors Data to Firebase

## Overview
This guide will help you add 3 doctors from the promotional images to Firebase Firestore. These are **data-only accounts** (no login required).

## Doctors to Add:
1. **Dr. Miguel Marcos M. Soller** - General Practitioner
   - Schedule: Monday, Tuesday, Wednesday, Thursday & Saturday, 9:00 AM - 12:00 NN

2. **Dr. Joanne Fesalbon-See** - IM-Pulmonology
   - Schedule: Saturday, 9:00 AM - 12:00 NN

3. **Dr. Mark Leo L. Geronimo** - Orthopedic Surgery
   - Schedule: Saturday, 1:00 PM - 4:00 PM

---

## Method 1: Browser Console (Easiest) ✅

### Steps:
1. **Open SmartCare app** in your browser
2. **Login as Admin**
3. **Open Browser Console** (F12 or Right-click → Inspect → Console)
4. **Copy the entire code** from `scripts/add-doctors-browser-console.js`
5. **Paste it in the console** and press Enter
6. **Wait for completion** - you'll see success messages

### Expected Output:
```
🚀 Starting to add doctors to Firebase...

✅ Added: Dr. Miguel Marcos M. Soller (General Practitioner) - ID: miguel-marcos-m-soller
✅ Added: Dr. Joanne Fesalbon-See (IM-Pulmonology) - ID: joanne-fesalbon-see
✅ Added: Dr. Mark Leo L. Geronimo (Orthopedic Surgery) - ID: mark-leo-l-geronimo

📊 Summary:
✅ Successfully added: 3
⚠️  Already existed: 0
❌ Errors: 0

✨ Done! Doctors are now in Firebase.
```

---

## Method 2: Admin Page (If Available)

If you have an admin page for adding doctors:
1. Go to `/admin/doctors`
2. Click "Add Doctor"
3. Fill in the information manually using the data below

---

## Doctor Data Reference

### Dr. Miguel Marcos M. Soller
```json
{
  "displayName": "Dr. Miguel Marcos M. Soller",
  "specialty": "General Practitioner",
  "phone": "+639177094452",
  "officeHours": "Monday, Tuesday, Wednesday, Thursday & Saturday: 9:00 AM - 12:00 NN",
  "schedule": [
    {"day": "Monday", "startTime": "09:00", "endTime": "12:00"},
    {"day": "Tuesday", "startTime": "09:00", "endTime": "12:00"},
    {"day": "Wednesday", "startTime": "09:00", "endTime": "12:00"},
    {"day": "Thursday", "startTime": "09:00", "endTime": "12:00"},
    {"day": "Saturday", "startTime": "09:00", "endTime": "12:00"}
  ]
}
```

### Dr. Joanne Fesalbon-See
```json
{
  "displayName": "Dr. Joanne Fesalbon-See",
  "specialty": "IM-Pulmonology",
  "phone": "+639177094452",
  "officeHours": "Saturday: 9:00 AM - 12:00 NN",
  "schedule": [
    {"day": "Saturday", "startTime": "09:00", "endTime": "12:00"}
  ]
}
```

### Dr. Mark Leo L. Geronimo
```json
{
  "displayName": "Dr. Mark Leo L. Geronimo",
  "specialty": "Orthopedic Surgery",
  "phone": "+639177094452",
  "officeHours": "Saturday: 1:00 PM - 4:00 PM",
  "schedule": [
    {"day": "Saturday", "startTime": "13:00", "endTime": "16:00"}
  ]
}
```

---

## Verification

After adding, verify the doctors appear:
1. Go to `/admin/doctors` page
2. You should see all 3 doctors listed
3. Check that their specialties and schedules are correct

---

## Notes

- **No Login Required**: These are data-only accounts
- **Email**: Generated emails (can be changed later)
- **Status**: All set to "active"
- **ID Format**: Generated from name (e.g., "miguel-marcos-m-soller")
- **Location**: All doctors share the same hospital address

---

## Troubleshooting

### If you get permission errors:
- Make sure you're logged in as **admin**
- Check Firestore security rules allow admin to create users

### If doctors don't appear:
- Check browser console for errors
- Verify Firestore connection
- Check that `role: "doctor"` is set correctly

### If duplicate error:
- The script will skip if doctor already exists
- Check existing doctors in `/admin/doctors`

---

**Ready to add?** Use Method 1 (Browser Console) - it's the easiest! 🚀
