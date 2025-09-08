# Widget Upload and Display Guide

## Overview

The widget upload and display system has been enhanced to work with a new data model where widgets are stored in a separate `widgets` collection and user profiles contain an array of widget IDs.

## Features

### 1. Widget Upload System

- **Drag & Drop Support**: Upload widget files by dragging them into the upload area
- **File Validation**: Supports HTML, CSS, JS, images, audio, and video files
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Metadata Management**: Add title, description, category, and tags to your widgets
- **Multiple File Support**: Upload multiple files for a single widget

### 2. Widget Display System

- **Iframe Integration**: Widgets are displayed in secure iframes
- **Preview Modal**: Full-screen preview of widgets in a modal
- **Edit Functionality**: Edit widget metadata and re-upload files
- **Delete Functionality**: Remove widgets with confirmation
- **Stats Display**: View widget statistics (views, likes, shares)

### 3. Profile Menu Integration

- **Widget Count**: Shows the number of widgets in your profile
- **Widget Management**: List all your widgets with quick actions
- **Quick Actions**: Preview, edit, and delete widgets directly from the profile menu

## How to Test

### 1. Upload a Widget

1. **Login** to your account
2. **Navigate** to a widget slot (empty slot will show upload interface)
3. **Drag and drop** files or click to select files
4. **Fill in** the widget metadata:
   - Title: "Simple Calculator"
   - Description: "A beautiful calculator with history"
   - Category: "tool"
   - Tags: "calculator, math, utility"
5. **Click** "Upload Widget"
6. **Watch** the progress bar and wait for completion

### 2. Test Widget Display

1. **After upload**, the widget should appear in the slot
2. **Click** "Preview" to see the widget in full screen
3. **Click** "Edit" to modify the widget metadata
4. **Click** "Delete" to remove the widget

### 3. Test Profile Menu Integration

1. **Open** the profile menu (sidebar or profile dropdown)
2. **Look for** the "My Widgets" section
3. **See** your widget count and list of widgets
4. **Use** the quick action buttons to manage widgets

## Test Widget Files

### Simple Calculator Widget

I've created a test calculator widget in `widgets/test-calculator/index.html` that you can use to test the upload functionality:

**Files to upload:**

- `widgets/test-calculator/index.html` (main widget file)

**Upload as:**

- Title: "Simple Calculator"
- Description: "A beautiful calculator with history and keyboard support"
- Category: "tool"
- Tags: "calculator, math, utility, interactive"

## Technical Details

### Data Model

- **Widgets Collection**: Stores widget metadata and file URLs
- **User Profiles**: Contains array of widget IDs
- **File Storage**: Widget files stored in Firebase Storage

### File Structure

```
widgets/
├── test-calculator/
│   └── index.html          # Main widget file
└── app-widget-1/           # Existing widget
    ├── widget.html
    ├── widget.css
    └── widget.js
```

### Security

- **Iframe Sandbox**: Widgets run in sandboxed iframes
- **File Validation**: Only allowed file types can be uploaded
- **Size Limits**: Maximum file size enforced
- **User Isolation**: Users can only access their own widgets

## Debug Features

### Console Logging

The system includes comprehensive debug logging:

- `[WidgetDisplay]` - Widget display system logs
- `[WidgetUploadManager]` - Upload system logs
- `[MAIN DEBUG]` - Main application logs

### Error Handling

- **Upload Errors**: Displayed as toast notifications
- **Validation Errors**: Real-time form validation
- **Network Errors**: Graceful fallback and retry

## Mobile Support

- **Responsive Design**: Works on all screen sizes
- **Touch Support**: Optimized for touch interactions
- **Mobile Modals**: Full-screen modals on mobile devices

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **ES6 Support**: Uses modern JavaScript features
- **Firebase**: Requires Firebase project setup

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file size and type restrictions
2. **Widget Not Displaying**: Ensure `index.html` is the main file
3. **Preview Not Working**: Check iframe sandbox settings
4. **Profile Menu Not Showing**: Ensure user is logged in

### Debug Steps

1. **Check Console**: Look for error messages
2. **Verify Firebase**: Ensure Firebase is properly configured
3. **Check Network**: Verify file uploads are completing
4. **Test Files**: Try with the provided test widget

## Future Enhancements

- **Widget Templates**: Pre-built widget templates
- **Widget Marketplace**: Share and discover widgets
- **Advanced Editing**: In-browser widget editor
- **Widget Analytics**: Detailed usage statistics
- **Collaboration**: Multi-user widget editing
