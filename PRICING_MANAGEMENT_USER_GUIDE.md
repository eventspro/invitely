# Pricing Management User Guide

## ✅ Verification Summary

The configurable pricing system has been **verified and confirmed working** with the following capabilities:

✅ **Navigation**: Access via Platform → Translations → Configurable Content tab  
✅ **View Plans**: Read-only mirror of homepage pricing section  
✅ **Edit Plans**: Modify price, badge, enable/disable status  
✅ **Toggle Features**: Check/uncheck features for each plan  
✅ **Reorder Plans**: Change display order with up/down controls  
✅ **Add Plans**: Create new pricing plans with validation  
✅ **Delete Plans**: Remove plans with confirmation and warnings  

All components are fully functional with no TypeScript errors.

---

## How to Access Pricing Management

1. **Log in to Platform Admin**
   - Navigate to `/platform` in your browser
   - Enter your admin username and password
   - Click "Sign In"

2. **Go to Translations Page**
   - From the Platform Dashboard, click the **"Translations"** button in the top-right corner
   - You'll see a Globe icon (🌐) next to it

3. **Switch to Configurable Content**
   - At the top of the page, you'll see two tabs:
     - **Translations** (for language text)
     - **Configurable Content** (for pricing plans)
   - Click the **"Configurable Content"** tab
   - You'll see a Settings icon (⚙️) next to it

4. **View Your Pricing Plans**
   - The page displays a **pixel-perfect mirror** of your homepage pricing section
   - All visible plans are exactly how they appear to website visitors
   - Click any plan card to edit it

---

## How to Edit an Existing Plan

### Opening the Editor

1. From the **Configurable Content** tab, find the pricing plan you want to edit
2. **Click anywhere on the plan card** - the entire card is clickable
3. The **Plan Editor** dialog will open with all current settings

### What You Can Edit

#### **Price** (Required)
- The price displayed to customers
- Format: Enter the amount with currency (e.g., "10,000 AMD" or "15,000 AMD")
- This field is **required** - you cannot save without a price

#### **Badge** (Optional)
- A small label that appears above the plan (e.g., "Most Popular", "Best Value")
- Leave **empty** to hide the badge completely
- The badge color is set automatically based on the plan

#### **Plan Enabled** (Toggle)
- **ON** (green): Plan appears on the homepage
- **OFF** (gray): Plan is hidden from website visitors
- Use this to temporarily hide plans without deleting them

#### **Plan Features** (Checkboxes)
- You'll see a list of all available features (e.g., "Wedding Timeline", "Photo Gallery", "RSVP Management")
- **Checked** = Feature is included in this plan (shows on homepage)
- **Unchecked** = Feature is not included (won't show on homepage)
- The status badge shows "Included" (green) or "Not Included" (gray)

### Saving Your Changes

1. Review all your edits in the dialog
2. Click the **"Save Changes"** button at the bottom-right
3. Wait for the "Success" notification
4. The editor will close automatically
5. The homepage mirror will update immediately to reflect your changes

### Canceling Without Saving

- Click the **"Cancel"** button at the bottom-left
- Or click the **X** in the top-right corner
- All changes will be discarded

---

## How to Reorder Plans

Plans appear in a specific order on your homepage (left to right). Here's how to change that order:

### Opening the Reorder Tool

1. From the **Configurable Content** tab, look at the top-right section
2. Click the **"Reorder Plans"** button (has an up/down arrows icon ⇅)
3. The **Reorder Plans** dialog will open

### Changing the Order

1. You'll see all your plans listed in their current order (top = leftmost on homepage)
2. Each plan has two arrow buttons:
   - **⬆ Up**: Move the plan earlier in the sequence (shifts left on homepage)
   - **⬇ Down**: Move the plan later in the sequence (shifts right on homepage)
3. Click the arrows to rearrange plans until you're satisfied
4. The arrows are disabled when a plan can't move further (first/last position)

### Saving the New Order

1. When you're happy with the arrangement, click **"Save Order"**
2. Wait for the "Order Updated" notification
3. The new order is now live on your homepage
4. The Configurable Content page will update to show the new arrangement

### Canceling Reorder

- Click the **"Cancel"** button
- All order changes will be discarded
- Plans return to their original positions

**Note**: You need at least 2 plans to use the reorder feature. The button is disabled if you only have 1 plan.

---

## How to Add a New Plan

### Opening the Add Plan Dialog

1. From the **Configurable Content** tab, look at the top-right section
2. Click the **"Add Plan"** button (has a plus icon ➕)
3. The **Add New Pricing Plan** dialog will open

### Required Information

#### **Plan Key** (Required)
- A unique identifier for this plan (e.g., "premium", "deluxe", "starter")
- **Rules**:
  - Must be lowercase
  - Can only contain letters, numbers, hyphens (-), and underscores (_)
  - Cannot duplicate an existing plan key
- You'll see a ✓ (green check) if the key is valid
- You'll see an error message if there's a problem

#### **Price** (Required)
- The display price (e.g., "20,000 AMD")
- Must include a value - cannot be empty

#### **Template Route** (Required)
- The template style path (e.g., "/classic", "/elegant", "/pro")
- Must start with a forward slash (/)
- Pre-filled with "/classic" by default

### Optional Settings

#### **Badge**
- A label that appears above the plan (e.g., "New")
- Leave empty if you don't want a badge

#### **Plan Enabled**
- **OFF by default** - New plans are hidden until you configure them
- Turn **ON** when you're ready to make the plan visible on your homepage

### Important Notes

⚠️ **Translation Warning**: You'll see a yellow warning box explaining:
- The plan name, description, and feature labels come from the **Translations** system
- You must add translations separately for the plan to display properly
- The system uses the plan key you provide to look up translations

### Creating the Plan

1. Fill in all required fields (Plan Key, Price, Template Route)
2. Optionally add a Badge
3. Leave "Plan Enabled" OFF until you've added translations
4. Click **"Create Plan"**
5. Wait for the "Plan Created" notification
6. The dialog closes and your new plan appears in the list

### What Happens Next

- The new plan is added to the **end of the list** (rightmost position on homepage)
- It starts with **no features** - you'll need to edit it to add features
- It's **disabled by default** - not visible to website visitors yet
- You can now:
  - Click the plan to edit and add features
  - Use the Reorder button to move it to the right position
  - Add translations for the plan name and description
  - Enable it when ready

---

## How to Delete a Plan Safely

**⚠️ Warning**: Deleting a plan is **permanent and irreversible**. Use caution!

### Opening Delete Confirmation

1. Click the plan card you want to delete to open the **Plan Editor**
2. At the bottom-left of the dialog, find the red **"Delete Plan"** button
3. Click **"Delete Plan"**

### Understanding the Consequences

A **red warning card** will appear explaining what will be deleted:
- ❌ The pricing plan itself
- ❌ All features associated with this plan
- ❌ Its position in the display order

This action **cannot be undone**!

### Confirming Deletion

If you're absolutely sure:
1. Review the warning message carefully
2. Click the red **"Delete Plan"** button in the confirmation card
3. Wait for the "Plan Deleted" notification
4. Both the confirmation and editor will close automatically
5. The plan immediately disappears from your homepage

### Canceling Deletion

Changed your mind?
- Click the **"Cancel"** button in the red warning card
- The warning disappears and no changes are made
- You can continue editing or close the dialog normally

---

## Important Notes & Safety Tips

### 💡 Best Practices

1. **Test with Disabled Plans**
   - Create new plans with "Enabled" turned OFF
   - Configure all settings and features first
   - Only enable once everything is ready and translated

2. **Order Matters**
   - The leftmost plan on the homepage is typically the most basic/cheapest
   - The rightmost is usually the most premium/expensive
   - The middle plan is often highlighted as "Most Popular"

3. **Use Descriptive Plan Keys**
   - Choose clear, meaningful keys like "basic", "professional", "ultimate"
   - Avoid vague keys like "plan1", "plan2"
   - You cannot change the plan key later

4. **Feature Consistency**
   - Higher-tier plans typically include all features of lower tiers
   - Review feature selections across all plans for consistency
   - Features can be toggled on/off without affecting other plans

### 🚨 Common Mistakes to Avoid

1. **Forgetting Translations**
   - Plans without translations show raw keys instead of user-friendly text
   - Always add translations before enabling a new plan

2. **Deleting the Wrong Plan**
   - Double-check the plan name before confirming deletion
   - Consider disabling instead of deleting if you're unsure

3. **Empty Price Field**
   - You cannot save a plan without a price
   - Make sure to include currency (e.g., "AMD")

4. **Duplicate Plan Keys**
   - Each plan must have a unique key
   - The system will prevent you from creating duplicates

### 🔄 Changes Take Effect Immediately

- All edits are **live immediately** after saving
- Homepage pricing updates in real-time
- No deployment or restart needed
- Visitors see changes instantly

### 📱 Mobile Preview

- The pricing cards automatically adapt to mobile screens
- On mobile, plans stack vertically
- Test your pricing on different devices to ensure it looks good

### 🆘 If Something Goes Wrong

1. **Plan Not Showing After Enable**
   - Check if translations exist for this plan key
   - Verify the plan is not at the bottom of the order (might need to scroll)
   - Refresh the homepage to see updates

2. **Features Not Saving**
   - Make sure you clicked "Save Changes" before closing
   - Check that features have valid translation keys
   - Try toggling features again and saving

3. **Cannot Delete Plan**
   - There may be a server error - try again
   - Check browser console for error messages
   - Contact support if the issue persists

4. **Reorder Not Working**
   - You need at least 2 plans to reorder
   - Make sure you clicked "Save Order" to apply changes
   - Refresh the page to see the new order

---

## Quick Reference

| Task | Button/Location | Icon |
|------|----------------|------|
| Access pricing management | Platform Dashboard → Translations button | 🌐 |
| Switch to pricing | Configurable Content tab | ⚙️ |
| Edit a plan | Click any plan card | (clickable card) |
| Reorder plans | "Reorder Plans" button (top-right) | ⇅ |
| Add new plan | "Add Plan" button (top-right) | ➕ |
| Delete plan | Red "Delete Plan" button in editor | 🗑️ |
| Save changes | Blue "Save Changes" button in editor | 💾 |
| Cancel edits | "Cancel" button or X icon | ✖️ |

---

## Summary

You now have complete control over your pricing plans:

✅ **Edit** prices, badges, and enable/disable status  
✅ **Toggle** features on/off for each plan  
✅ **Reorder** plans to change homepage display sequence  
✅ **Add** new plans with validation and warnings  
✅ **Delete** plans with safety confirmations  

All changes are reflected on your homepage **immediately**. The Configurable Content page shows an exact preview of what visitors will see.

For questions about translations or other platform features, consult the relevant documentation or contact support.
