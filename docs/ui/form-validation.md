# Form Validation in IGRP Studio

Welcome to the Form Validation feature in IGRP Studio! This guide will show you how to easily add validation rules to your form fields using our visual interface.

## 🎯 What is Form Validation?

Form validation ensures that users enter correct and complete information in your forms. For example:

- Making sure an email field contains a valid email address
- Requiring a password to be at least 8 characters long
- Ensuring a number field only accepts positive values

## 🚀 How to Use Form Validation

### Step 1: Open Your Form

1. Navigate to your project in IGRP Studio
2. Open the form you want to add validation to
3. Select the form field you want to validate

### Step 2: Access Validation Settings

1. In the form field properties, look for the **Shield icon** 🔒
2. Click on the shield icon to open the validation popover
3. You'll see three tabs: **Validations**, **Zod Schema**, and **Preview**

### Step 3: Configure Validations

#### Basic Validations Tab

This is where you'll spend most of your time configuring validation rules.

**Required vs Optional:**

- **Required**: Field must be filled out (default for most fields)
- **Optional**: Field can be left empty

**Type-Specific Validations:**
The available validations change based on your field type:

**For Text Fields (String, Email, Password):**

- **Min/Max Length**: Set minimum and maximum character limits
- **Email**: Validates email format
- **URL**: Validates web address format
- **UUID**: Validates UUID format
- **Regex**: Custom pattern matching (advanced)
- **Starts With**: Field must begin with specific text
- **Ends With**: Field must end with specific text
- **Includes**: Field must contain specific text

**For Number Fields:**

- **Min/Max**: Set minimum and maximum values
- **Positive**: Only positive numbers allowed
- **Negative**: Only negative numbers allowed
- **Integer**: Only whole numbers (no decimals)
- **Finite**: Excludes infinity values

**For Date Fields:**

- **Min Date**: Earliest allowed date
- **Max Date**: Latest allowed date

**For Boolean Fields:**

- **Required/Optional**: Whether the field must be checked

### Step 4: Preview Your Validations

Switch to the **Preview** tab to see:

- All active validations for the current field
- A summary of what rules are applied
- Clear indication if no validations are set

### Step 5: Generate Zod Schema (Optional)

The **Zod Schema** tab shows you the automatically generated validation code:

- Perfect for developers who want to use the validation in their code
- Click "Copy to Clipboard" to copy the generated schema
- Use this code in your React applications with libraries like React Hook Form

## 📝 Real-World Examples

### Example 1: User Registration Form

**Email Field:**

- ✅ Required
- ✅ Email validation
- Result: Ensures users enter a valid email address

**Password Field:**

- ✅ Required
- ✅ Min Length: 8
- ✅ Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)` (requires lowercase, uppercase, and number)
- Result: Strong password requirements

**Age Field:**

- ✅ Required
- ✅ Min: 18
- ✅ Max: 100
- ✅ Integer
- Result: Age must be between 18-100

### Example 2: Product Form

**Product Name:**

- ✅ Required
- ✅ Min Length: 2
- ✅ Max Length: 100
- Result: Product name between 2-100 characters

**Price:**

- ✅ Required
- ✅ Positive
- ✅ Finite
- Result: Must be a positive number

**SKU:**

- ✅ Required
- ✅ Regex: `^[A-Z]{2}-\d{4}-[A-Z]{2}$`
- Result: Must follow pattern like "AB-1234-CD"

## 🎨 User Interface Guide

### Validation Popover Layout

```
┌─────────────────────────────────────┐
│ [Validations] [Zod Schema] [Preview] │
├─────────────────────────────────────┤
│ Set validations for form field      │
│                                     │
│ Basic Validations:                  │
│ ☑ Required    ☐ Optional           │
│                                     │
│ Type-Specific Validations:          │
│ Min Length: [___]                   │
│ Max Length: [___]                   │
│ ☑ Email                            │
└─────────────────────────────────────┘
```

### Visual Indicators

- **Shield Icon** 🔒: Click to open validation settings
- **Checkmarks** ☑: Active validations
- **Empty boxes** ☐: Inactive validations
- **Input fields**: Enter specific values (min/max, dates, etc.)

## 💡 Tips for Better Validation

### 1. Start Simple

- Begin with basic required/optional settings
- Add specific validations as needed
- Don't over-validate - focus on essential rules

### 2. User-Friendly Messages

- Keep validation rules reasonable
- Consider user experience when setting limits
- Test your validations with real data

### 3. Common Patterns

- **Email**: Always use email validation for email fields
- **Passwords**: Use min length + regex for security
- **Phone Numbers**: Use regex for format consistency
- **Dates**: Use min/max dates for logical ranges

### 4. Performance Considerations

- Avoid overly complex regex patterns
- Keep validation rules focused and necessary
- Consider server-side validation for critical data

## 🔧 Advanced Features

### Custom Regex Patterns

For advanced users, you can create custom validation patterns:

**Phone Number (US):**

```
^\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$
```

**Postal Code (US):**

```
^\d{5}(-\d{4})?$
```

**Credit Card Number:**

```
^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$
```

### Date Validation

- Use ISO date format (YYYY-MM-DD)
- Set logical date ranges
- Consider timezone implications

## 🚨 Troubleshooting

### Common Issues

**Validation not showing:**

- Make sure you've selected a form field
- Check that the field type is supported
- Verify the shield icon is visible

**Validation not working:**

- Ensure validation rules are properly configured
- Check that field types match validation types
- Test with valid and invalid data

**Zod schema errors:**

- Verify all validation rules are compatible
- Check for syntax errors in custom regex
- Ensure proper field type selection

### Getting Help

If you encounter issues:

1. Check the validation preview tab
2. Verify field type compatibility
3. Test with simple validation rules first
4. Consult the Zod Schema tab for code issues

## 🎯 Best Practices

### For Form Designers

- **Be Consistent**: Use similar validation patterns across forms
- **Be Clear**: Validation rules should be obvious to users
- **Be Helpful**: Provide clear error messages
- **Be Reasonable**: Don't make forms too restrictive

### For Developers

- **Test Thoroughly**: Validate with various input scenarios
- **Consider Edge Cases**: Handle empty, null, and invalid data
- **Performance**: Keep validation rules efficient
- **Security**: Validate on both client and server side

## 📚 Next Steps

Now that you understand form validation:

1. **Try it out**: Add validation to a simple form field
2. **Experiment**: Test different validation combinations
3. **Build confidence**: Start with basic validations, then add complexity
4. **Share knowledge**: Help team members understand the feature

## 🎉 Congratulations!

You're now ready to create robust, user-friendly forms with proper validation in IGRP Studio. The visual interface makes it easy to add professional validation rules without writing code.

Happy form building! 🚀
