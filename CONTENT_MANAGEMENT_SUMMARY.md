# Content Management Summary

## 🎯 Quick Answer: Yes, Most Content is Editable via UI!

### What's Editable via Translation UI (`/platform/translations`):
✅ **All text content** in 3 languages (EN, HY, RU):
- Pricing plan names ("Basic", "Premium", "Ultimate")
- Plan descriptions ("Perfect for intimate weddings...")
- Feature names ("Wedding Timeline", "RSVP Functionality")
- FAQ questions and answers
- Footer text and links
- Navigation menu items
- Hero section text
- Any visible text on the site

**How to edit:**
1. Go to `http://localhost:5001/platform/translations`
2. Click any text on the page
3. Type your changes
4. Press Enter
5. **No restart needed** - changes appear instantly!

---

### What Requires Code Changes (`shared/content-config.ts`):
⚙️ **Structural configuration**:
- Plan prices (10,000 AMD → 15,000 AMD)
- Enable/disable plans
- Which features are included (✓ vs ✗)
- Display order
- Social media URLs
- Badge colors
- Enable/disable FAQ section

**How to edit:**
1. Open `shared/content-config.ts`
2. Modify the configuration
3. Save file
4. Restart dev server (`npm run dev`)

---

## 📊 Content Management Matrix

| What You Want to Change | Where to Edit | Restart Needed? |
|-------------------------|---------------|-----------------|
| Plan name ("Basic" → "Starter") | Translation UI | ❌ No |
| Plan price (10,000 → 15,000 AMD) | content-config.ts | ✅ Yes |
| Plan description text | Translation UI | ❌ No |
| Enable/disable a plan | content-config.ts | ✅ Yes |
| Feature name ("RSVP" → "Guest List") | Translation UI | ❌ No |
| Include/exclude feature (✓ → ✗) | content-config.ts | ✅ Yes |
| FAQ question text | Translation UI | ❌ No |
| Add new FAQ | content-config.ts + UI | ✅ Yes (then edit text in UI) |
| Social media label | Translation UI | ❌ No |
| Social media URL | content-config.ts | ✅ Yes |
| Footer copyright text | Translation UI | ❌ No |
| Footer sections | content-config.ts | ✅ Yes |
| Badge text ("Most Popular") | Translation UI | ❌ No |
| Badge color (bg-blue-500) | content-config.ts | ✅ Yes |

---

## 🎨 Real-World Examples

### Example 1: Change Plan Name (NO restart needed)
**Want:** Rename "Basic" to "Starter Package"

**Steps:**
1. Go to `/platform/translations`
2. Find "Basic" text
3. Click it and change to "Starter Package"
4. Press Enter
5. ✅ Done! Live immediately

---

### Example 2: Change Plan Price (RESTART needed)
**Want:** Change Basic from 10,000 AMD to 12,000 AMD

**Steps:**
1. Open `shared/content-config.ts`
2. Find:
   ```typescript
   {
     id: "basic",
     price: "10,000 AMD",  // ← Change this
   }
   ```
3. Change to:
   ```typescript
   price: "12,000 AMD",
   ```
4. Save file
5. Run `npm run dev`
6. ✅ Done!

---

### Example 3: Add Feature to Plan (RESTART needed)
**Want:** Add "Video Gallery" to Ultimate plan

**Steps:**
1. Open `shared/content-config.ts`
2. Find `id: "ultimate"`
3. Add to features array:
   ```typescript
   features: [
     // ... existing features
     { 
       id: "f10", 
       translationKey: "templatePlans.features.Video Gallery", 
       icon: "Video", 
       included: true 
     }
   ]
   ```
4. Save and restart
5. Go to Translation UI
6. Find "Video Gallery" and translate it
7. ✅ Done!

---

### Example 4: Update Instagram URL (RESTART needed)
**Want:** Change Instagram handle

**Steps:**
1. Open `shared/content-config.ts`
2. Find socialLinks:
   ```typescript
   {
     id: "instagram",
     url: "https://instagram.com/weddingsites"  // ← Change this
   }
   ```
3. Update URL
4. Save and restart
5. ✅ Done!

---

### Example 5: Change FAQ Text (NO restart needed)
**Want:** Update FAQ answer

**Steps:**
1. Go to `/platform/translations`
2. Find the FAQ answer text
3. Click and edit
4. Press Enter
5. ✅ Done! Live immediately

---

## 🔑 Key Takeaways

### **For Content Editors (Non-Technical):**
👉 Use **Translation UI** (`/platform/translations`)
- Edit any text you see
- No coding required
- Changes are instant
- Works in all 3 languages

### **For Developers/Administrators:**
👉 Use **content-config.ts**
- Change prices, enable/disable items
- Structural changes
- Requires code editing
- Need to restart server

---

## 📁 File Locations

- **Structural Config:** `shared/content-config.ts`
- **Translation Files:** 
  - `client/src/config/languages/en.ts`
  - `client/src/config/languages/hy.ts`
  - `client/src/config/languages/ru.ts`
- **Translation Editor:** `/platform/translations` (web UI)
- **Main Page:** `client/src/pages/main.tsx`

---

## 🎓 Training Guide

### For Content Managers:
1. Bookmark `/platform/translations`
2. Click any text to edit
3. Press Enter to save
4. That's it!

### For Developers:
1. Read `CONFIGURATION_GUIDE.md` for details
2. Edit `content-config.ts` for structure
3. Let content managers handle text via UI
4. Separation of concerns = happy team!

---

## 💡 Pro Tips

1. **Text changes?** → Use Translation UI (faster, no restart)
2. **Structural changes?** → Use content-config.ts
3. **Testing?** → Make changes in dev, test all 3 languages
4. **Backup?** → Copy content-config.ts before major changes
5. **Translation keys?** → Keep them descriptive and organized

---

## 🆘 Common Questions

**Q: Can I add a new pricing plan via Translation UI?**
A: No, you need to add it in `content-config.ts` first, then edit its text via UI.

**Q: Can I change prices via Translation UI?**
A: No, prices are in `content-config.ts` because they're structural data, not translation text.

**Q: Can I change feature names via Translation UI?**
A: Yes! Feature names are text content, fully editable via UI.

**Q: Do I need to edit all 3 language files?**
A: No! The Translation UI handles all 3 languages. Edit once per language.

**Q: What if I break something in content-config.ts?**
A: Keep a backup. If it breaks, restore the backup and restart.

---

## 📞 Need Help?

- **Configuration Guide:** See `CONFIGURATION_GUIDE.md`
- **Code Issues:** Check `README.md`
- **Translation Help:** Check Translation Editor UI instructions
