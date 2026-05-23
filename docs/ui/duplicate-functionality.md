# Duplicate Functionality Documentation

## Overview

The Duplicate functionality allows users to create exact copies of existing pages and components within the IGRP Studio. This feature is designed to save time when creating similar pages or components that share common functionality, styling, or structure.

## 🎯 **Intention & Purpose**

### Why Duplicate?

- **Time Saving**: Instead of creating pages/components from scratch, duplicate existing ones
- **Consistency**: Maintain consistent structure and functionality across similar items
- **Template Usage**: Use existing pages/components as templates for new ones
- **Rapid Prototyping**: Quickly create variations of existing designs
- **Future-Proof**: Duplicated items are completely independent of the original

### Use Cases

- Creating multiple similar pages (e.g., user profile, admin profile, settings pages)
- Duplicating components with similar functionality (e.g., different forms, cards, modals)
- Using existing pages as templates for new features
- Creating variations of existing designs with minor modifications

## 🚀 **How to Use**

### Step 1: Access the Duplicate Option

1. Navigate to the **Pages** section in IGRP Studio
2. Find the page or component you want to duplicate
3. Click the **three dots menu** (⋮) on the item
4. Select **"Duplicate"** from the dropdown menu

### Step 2: Configure the Duplicate

1. A modal will open with pre-filled information
2. **Description**: Automatically adds "Copy" suffix (e.g., "User Profile Copy")
3. **Name**: Automatically adds "Copy" suffix (e.g., "UserProfileCopy")
4. **Path** (Pages only): Automatically adds "-copy" suffix (e.g., "user-profile-copy")

### Step 3: Customize (Optional)

- **Description**: Modify the description to better reflect the new item's purpose
- **Name**: Change the name to something more specific
- **Path**: Update the path to match your routing structure

### Step 4: Save

- Click **"Duplicate"** to create the copy
- The new item will appear in your pages/components list
- A success message will confirm the duplication

## 🔧 **Technical Details**

### What Gets Copied

The duplicate functionality performs a **deep copy** of the original item, preserving:

#### For Pages:

- ✅ All page properties and configurations
- ✅ Types, states, and functions
- ✅ Force dynamic settings
- ✅ Parent-child relationships
- ✅ All custom properties and metadata

#### For Components:

- ✅ Component properties and configurations
- ✅ Arguments and parameters
- ✅ Icon settings
- ✅ Scope settings (app/page)
- ✅ All custom properties and metadata

### What Gets Modified

- **ID**: New unique identifier generated
- **Name**: Adds "Copy" suffix
- **Description**: Adds "Copy" suffix
- **Path**: Adds "-copy" suffix (pages only)

### Independence

- ✅ Duplicated items are **completely independent** of the original
- ✅ Changes to the original won't affect the copy
- ✅ Changes to the copy won't affect the original
- ✅ Each item has its own unique ID and properties

## 📁 **File Structure**

```
src/renderer/src/generators/ui/page/
├── duplicate-modal.tsx          # Main duplicate modal component
├── list-pages.tsx              # Updated with duplicate functionality
├── page-card.tsx               # Updated with duplicate option
├── shared.tsx                  # Updated with duplicate menu item
└── utils/
    └── duplicate-functionality.md  # This documentation
```

## 🎨 **User Interface**

### Dropdown Menu

- **Edit**: Modify the original item
- **Duplicate**: Create a copy (NEW)
- **Add Components**: Add components to the item
- **Create SubPage**: Create child pages (pages only)
- **Delete**: Remove the item

### Modal Interface

- **Title**: Shows what's being duplicated
- **Description**: Explains the duplication process
- **Form Fields**: Pre-filled with copy-friendly names
- **Validation**: Ensures proper naming conventions
- **Actions**: Cancel or Duplicate buttons

## ⚠️ **Important Notes**

### Naming Conventions

- Names must follow the pattern: `[a-zA-Z0-9]+` (no spaces or hyphens)
- Paths must follow Next.js routing patterns
- Duplicate names are allowed (each item has a unique ID)

### Limitations

- Cannot duplicate items that are currently being edited
- Cannot duplicate items with invalid configurations
- Path conflicts may occur if similar paths already exist

### Best Practices

1. **Use Descriptive Names**: Change the auto-generated names to be more specific
2. **Review Paths**: Ensure paths align with your routing strategy
3. **Test After Duplication**: Verify the duplicated item works as expected
4. **Clean Up**: Remove unused duplicates to keep your project organized

## 🔄 **Workflow Example**

### Scenario: Creating Multiple User Pages

1. **Create Base Page**: Create a "UserProfile" page with all necessary components
2. **Duplicate**: Use duplicate to create "UserProfileCopy"
3. **Customize**: Modify the copy for "AdminProfile"
4. **Repeat**: Duplicate again for "ManagerProfile"
5. **Result**: Three similar pages with consistent structure but different purposes

### Benefits:

- ✅ Consistent user experience across pages
- ✅ Reduced development time
- ✅ Maintainable codebase
- ✅ Easy to update similar pages

## 🆘 **Troubleshooting**

### Common Issues

**Q: Why can't I see the duplicate option?**
A: Make sure you're clicking the three dots menu (⋮) on the item, not elsewhere.

**Q: Why is the path field missing?**
A: The path field only appears when duplicating pages, not components.

**Q: Why does the duplicate fail?**
A: Check that the name follows the naming convention (no spaces/hyphens) and the path is valid.

**Q: Can I duplicate a page with components?**
A: Yes! The duplicate will include all associated components and their configurations.

## 📈 **Future Enhancements**

Potential improvements for the duplicate functionality:

- Bulk duplication of multiple items
- Template library for common page/component patterns
- Smart naming suggestions based on project context
- Preview of what will be duplicated
- Undo functionality for accidental duplications

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Author**: IGRP Studio Team
