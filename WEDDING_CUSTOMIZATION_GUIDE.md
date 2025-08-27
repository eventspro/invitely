# Wedding Website Customization Guide

## Easy Text Editing

All the text content on your wedding website can be easily customized by editing the configuration file:

**File to edit: `client/src/config/wedding-config.ts`**

## What You Can Customize

### 1. **Couple Names**
```typescript
couple: {
  groomName: "Հարություն",      // Groom's name
  brideName: "Տաթև",           // Bride's name  
  combinedNames: "Հարություն & Տաթև"  // Names displayed together
}
```

### 2. **Wedding Date & Time**
```typescript
wedding: {
  date: "2024-08-18T15:00:00",    // Wedding date/time (YYYY-MM-DDTHH:MM:SS)
  displayDate: "18 ՕԳՈՍՏՈՍ 2024", // How the date appears on the site
  month: "Օգոստոս 2024",           // Month name for calendar
  day: "18"                       // Wedding day number
}
```

### 3. **Hero Section (Main Banner)**
```typescript
hero: {
  title: "Հրավիրում ենք մեր հարսանիքին։",     // Main title
  welcomeMessage: "Your welcome message...",  // Welcome text
  musicButton: "Երաժշտություն"          // Music button text
}
```

### 4. **Countdown Timer**
```typescript
countdown: {
  subtitle: "Ֆցր հարսանիքի ծանուցում ծանծգն է",  // Subtitle text
  labels: {
    days: "օր",      // Days label
    hours: "ժամ",    // Hours label
    minutes: "րոպ",  // Minutes label
    seconds: "վայրկ" // Seconds label
  }
}
```

### 5. **Timeline Events**
```typescript
timeline: {
  title: "Ծրագիր",  // Section title
  events: [
    {
      time: "13:00",
      title: "Պսակադրություն",
      description: "Նուր Նարգիզ ծետալթեր"
    },
    // Add more events or modify existing ones
  ]
}
```

### 6. **Location Details**
```typescript
locations: {
  sectionTitle: "Վայրեր",
  church: {
    title: "Եկեղեցի",
    name: "Սուրբ Գրիգոր Լուսավորիչ Եկեղեցի",
    description: "Պսակադրության արարողություն",
    mapButton: "Քարտեզ"
  },
  restaurant: {
    title: "Ռեստորան",
    name: "Արարատ Ռեստորան", 
    description: "Ընդունելության և տոնակատարության վայր",
    mapButton: "Քարտեզ"
  }
}
```

### 7. **RSVP Form**
```typescript
rsvp: {
  title: "Հաստատել մասնակցությունը",
  description: "Խնդրում ենք հաստատել ձեր մասնակցությունը մինչև մարտի 1-ը",
  form: {
    firstName: "Անուն",
    lastName: "Ազգանուն",
    email: "Էլ․ հասցե",
    // ... all form labels and text
  }
}
```

### 8. **Navigation Menu**
```typescript
navigation: {
  home: "Գլխավոր",
  countdown: "Հաշվարկ",
  calendar: "Օրացույց",
  locations: "Վայրեր",
  timeline: "Ծրագիր",
  rsvp: "Հաստատում"
}
```

## How to Make Changes

1. **Open the file:** `client/src/config/wedding-config.ts`
2. **Edit the text** you want to change (keep the quotes)
3. **Save the file**
4. **The website will automatically update** with your changes

## Important Notes

- Keep all quotation marks (`"`) around text
- Don't change the property names (like `groomName:` - only change what comes after the colon)
- For the wedding date, use the format: `YYYY-MM-DDTHH:MM:SS`
- Save the file after making changes to see them on the website

## Email Configuration

RSVP responses will be automatically sent to these email addresses:
```typescript
email: {
  recipients: [
    "harutavetisyan0@gmail.com",
    "tatevhovsepyan22@gmail.com"
  ]
}
```

That's it! Your website will automatically update with any changes you make to this configuration file.