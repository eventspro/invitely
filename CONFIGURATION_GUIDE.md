# Configuration Guide - WeddingSites Platform

This guide explains how to control all configurable content on the platform including pricing plans, features, FAQ, footer, and social media links.

## 📍 Two Configuration Systems

The platform uses a **hybrid configuration approach**:

### 🔧 **Structural Configuration** → `shared/content-config.ts`
Control the structure and behavior:
- Which plans are enabled/disabled
- Plan prices (10,000 AMD, 17,000 AMD, etc.)
- Which features are included (✓ or ✗)
- Display order
- Badge colors
- Social media URLs
- FAQ enabled/disabled

**Changes require:** Code edit + server restart

### 📝 **Text Content** → Translation Editor UI (`/platform/translations`)
Control all visible text in 3 languages (EN, HY, RU):
- Plan names ("Basic", "Premium", etc.)
- Plan descriptions
- Feature names ("Wedding Timeline", "RSVP", etc.)
- FAQ questions and answers
- Footer text
- All user-visible text

**Changes require:** Just edit in UI - no restart needed!

---

## 🎨 How It Works

When a user visits the site:
1. **Structure loaded** from `content-config.ts` (enabled plans, prices, features)
2. **Text loaded** from translations database (names, descriptions in user's language)
3. **Page renders** combining both

**Example:**
```typescript
// content-config.ts defines structure
{
  id: "premium",
  price: "23,000 AMD",        // ← Hardcoded in config
  features: [
    { translationKey: "...", included: true }  // ← Structure
  ]
}

// Translations provide the text
"Premium" // ← From translations (editable via UI)
"Complete wedding website solution" // ← From translations
```

---

## 🎯 What You Can Control

### 1. **Pricing Plans** (`pricingPlans` in content-config.ts)

Control all aspects of your pricing tiers:

```typescript
{
  id: "premium",              // Unique identifier
  enabled: true,              // Show/hide this plan
  order: 2,                   // Display order (0-based)
  nameKey: "...",            // Translation key for plan name
  price: "23,000 AMD",       // Actual price displayed
  badgeKey: "...",           // Optional badge text key
  badgeColor: "bg-emerald-500", // Badge background color
  descriptionKey: "...",     // Translation key for description
  popular: true,             // Highlight as "Most Popular"
  templateRoute: "/romantic", // Route to demo template
  features: [...]            // List of features (see below)
}
```

#### **Plan Features**

Each plan has a `features` array:

```typescript
{
  id: "f1",
  translationKey: "templatePlans.features.Wedding Timeline",
  icon: "Calendar",          // Lucide icon name
  included: true             // ✓ or ✗ on comparison table
}
```

**Available Icons:**
- `Calendar`, `Heart`, `MapPin`, `Mail`, `Camera`, `Music`, `Settings`, `QrCode`, `Download`, `Upload`

#### **How to Add/Remove Features:**

1. Open `shared/content-config.ts`
2. Find the plan you want to modify
3. Add/remove features from the `features` array
4. Set `included: true` to show ✓ or `false` to show ✗

**Example - Add "Video Gallery" to Ultimate plan:**

```typescript
{
  id: "ultimate",
  features: [
    // ... existing features
    { 
      id: "f10", 
      translationKey: "templatePlans.features.Video Gallery", 
      icon: "Video", 
      included: true 
    }
  ]
}
```

#### **How to Enable/Disable a Plan:**

```typescript
{
  id: "deluxe",
  enabled: false,  // Set to false to hide this plan
  // ... rest of config
}
```

#### **How to Change Plan Order:**

```typescript
// Plans are sorted by the `order` field
{
  id: "premium",
  order: 0,  // Will show first
}
{
  id: "basic",
  order: 1,  // Will show second
}
```

---

### 2. **Social Media Links** (`socialLinks`)

Control all social media and contact links:

```typescript
{
  id: "instagram",
  enabled: true,              // Show/hide this link
  order: 0,                   // Display order
  platform: "instagram",      // Platform identifier
  icon: "SiInstagram",        // React Icons name
  url: "https://instagram.com/weddingsites",
  label: "Instagram"
}
```

**Available Platforms:**
- `instagram` - Instagram profile
- `telegram` - Telegram channel/group
- `facebook` - Facebook page
- `email` - Email address (use `mailto:`)
- `phone` - Phone number (use `tel:`)

**How to Update Links:**

1. Open `shared/content-config.ts`
2. Find `socialLinks` array
3. Update the `url` field:

```typescript
{
  id: "instagram",
  url: "https://instagram.com/YOUR_HANDLE",  // Change this
}
```

**How to Add New Social Platform:**

```typescript
socialLinks: [
  // ... existing links
  {
    id: "whatsapp",
    enabled: true,
    order: 5,
    platform: "whatsapp",
    icon: "MessageCircle",
    url: "https://wa.me/37412345678",
    label: "WhatsApp"
  }
]
```

---

### 3. **FAQ Section** (`faq`)

Control frequently asked questions:

```typescript
faq: {
  enabled: true,              // Show/hide entire FAQ section
  titleKey: "faq.title",      // Translation key for title
  subtitleKey: "faq.subtitle", // Translation key for subtitle
  items: [
    {
      id: "faq1",
      enabled: true,          // Show/hide this question
      order: 0,               // Display order
      questionKey: "faq.items.0.question",
      answerKey: "faq.items.0.answer"
    }
  ]
}
```

**How to Add New FAQ:**

```typescript
items: [
  // ... existing FAQs
  {
    id: "faq7",
    enabled: true,
    order: 6,
    questionKey: "faq.items.6.question",
    answerKey: "faq.items.6.answer"
  }
]
```

Then add translations in language files (`client/src/config/languages/en.ts`, `hy.ts`, `ru.ts`):

```typescript
faq: {
  items: {
    6: {
      question: "How do I customize colors?",
      answer: "You can customize all colors through the template settings..."
    }
  }
}
```

**How to Disable FAQ Section:**

```typescript
faq: {
  enabled: false,  // Entire section won't show
  // ...
}
```

---

### 4. **Footer Configuration** (`footer`)

Control footer content and structure:

```typescript
footer: {
  brandName: "WeddingSites",
  copyrightKey: "footer.copyright",
  showSocialLinks: true,      // Show/hide social icons in footer
  sections: [
    {
      id: "services",
      enabled: true,          // Show/hide this column
      order: 0,               // Column order
      titleKey: "footer.services.title",
      links: [
        {
          id: "l1",
          enabled: true,      // Show/hide this link
          order: 0,
          textKey: "footer.services.items.0",
          href: "/templates"  // Optional link URL
        }
      ]
    }
  ]
}
```

**Footer Sections:**
- `services` - Your services list
- `features` - Feature highlights
- `contact` - Contact information

**How to Add Footer Column:**

```typescript
sections: [
  // ... existing sections
  {
    id: "support",
    enabled: true,
    order: 3,
    titleKey: "footer.support.title",
    links: [
      { id: "l1", enabled: true, order: 0, textKey: "footer.support.items.0", href: "/help" },
      { id: "l2", enabled: true, order: 1, textKey: "footer.support.items.1", href: "/docs" }
    ]
  }
]
```

**How to Hide Social Links in Footer:**

```typescript
footer: {
  showSocialLinks: false,  // Social icons won't appear in footer
  // ...
}
```

---

### 5. **Main Features Section** (`features`)

Control the "Features" section on homepage:

```typescript
features: [
  {
    id: "elegant-designs",
    enabled: true,
    order: 0,
    icon: "Globe",              // Lucide icon name
    titleKey: "features.items.0.title",
    descriptionKey: "features.items.0.description"
  }
]
```

**Common Icons:**
- `Globe`, `Users`, `Smartphone`, `Palette`, `Camera`, `Lock`, `Heart`, `Star`, `Check`

---

## 🎨 Translation Keys

All visible text uses translation keys defined in language files.

**Language Files Location:**
- English: `client/src/config/languages/en.ts`
- Armenian: `client/src/config/languages/hy.ts`
- Russian: `client/src/config/languages/ru.ts`

**Example - Adding Plan Badge Translation:**

In `en.ts`:
```typescript
templatePlansSection: {
  planBadges: {
    ultimate: "All Inclusive"  // Add this
  }
}
```

---

## 🔧 Quick Configuration Examples

### Example 1: Add a New Plan Feature

**Goal:** Add "Custom Domain" to Ultimate plan

1. Open `shared/content-config.ts`
2. Find `id: "ultimate"` in `pricingPlans`
3. Add to features:

```typescript
features: [
  // ... existing features
  { 
    id: "f10", 
    translationKey: "templatePlans.features.Custom Domain", 
    icon: "Globe", 
    included: true 
  }
]
```

4. Add translation in `client/src/config/languages/en.ts`:

```typescript
templatePlansSection: {
  features: {
    "Custom Domain": "Custom Domain"
  }
}
```

### Example 2: Change Social Media URL

**Goal:** Update Instagram handle

1. Open `shared/content-config.ts`
2. Find `id: "instagram"` in `socialLinks`
3. Update URL:

```typescript
{
  id: "instagram",
  url: "https://instagram.com/NEW_HANDLE"
}
```

### Example 3: Disable a Pricing Plan

**Goal:** Temporarily hide "Deluxe" plan

```typescript
{
  id: "deluxe",
  enabled: false,  // Plan won't show on website
  // ... rest stays the same
}
```

### Example 4: Reorder Plans

**Goal:** Show Premium first, then Basic

```typescript
{
  id: "premium",
  order: 0  // Shows first
},
{
  id: "basic",
  order: 1  // Shows second
}
```

### Example 5: Add WhatsApp Contact

```typescript
socialLinks: [
  // ... existing
  {
    id: "whatsapp",
    enabled: true,
    order: 5,
    platform: "whatsapp",
    icon: "MessageCircle",
    url: "https://wa.me/37412345678",
    label: "WhatsApp"
  }
]
```

---

## 🚀 Applying Changes

After editing `shared/content-config.ts`:

1. **Save the file**
2. **Restart dev server** (if running):
   ```bash
   npm run dev
   ```
3. **Refresh browser** - changes will appear immediately

## ✏️ Editing Text Content via Translation UI

All user-visible text can be edited through the web interface without touching code:

### **Access the Translation Editor:**
1. Navigate to: **`http://localhost:5001/platform/translations`** (dev) or **`yourdomain.com/platform/translations`** (production)
2. The page will show all editable text on your site
3. Click any text to edit inline
4. Changes save automatically
5. Switch language to edit translations

### **What You Can Edit:**

#### **Pricing Plan Text:**
- Plan names: "Basic" → "Starter Package"
- Descriptions: "Perfect for..." → "Ideal for..."
- Badge text: "Most Popular" → "Best Value"
- Feature names: "Wedding Timeline" → "Event Schedule"

#### **FAQ Content:**
- Questions: Edit any FAQ question
- Answers: Edit any FAQ answer
- Add/remove via content-config.ts, edit text via UI

#### **Footer:**
- Copyright text
- Section titles
- Link labels

#### **Social Media:**
- Labels only (URLs in content-config.ts)

### **Quick Edit Example:**

To change "Basic" plan name to "Starter":
1. Go to `/platform/translations`
2. Find "Basic" in the page
3. Click on it
4. Type "Starter"
5. Press Enter
6. Done! (changes reflect immediately)

---

## 📝 Best Practices

1. **Always use translation keys** - Never hardcode visible text
2. **Test in all languages** - Check EN, HY, RU after changes
3. **Keep order sequential** - Use 0, 1, 2, 3... for `order` fields
4. **Backup before major changes** - Copy content-config.ts before editing
5. **Validate URLs** - Ensure social links work before deploying

---

## 🆘 Troubleshooting

**Issue:** Plan not showing
- Check `enabled: true`
- Verify `order` is unique
- Check browser console for errors

**Issue:** Translation not appearing
- Verify translation key exists in language files
- Check spelling exactly matches
- Ensure language file is properly formatted

**Issue:** Icon not displaying
- Use exact Lucide icon names (case-sensitive)
- Common icons: Calendar, Heart, MapPin, Mail, Camera, Music, Settings

**Issue:** Social link broken
- Verify URL format (https://, mailto:, tel:)
- Test link in browser directly
- Check for typos in URL

---

## 📧 Support

For help with configuration, contact the development team or check the main README.md for additional documentation.
