# Getting Started Guide

Welcome to the Nicholas JVR Portfolio & Social Platform! This guide will help you get up and running quickly.

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Firebase Account** - [Sign up here](https://firebase.google.com/)
- **Modern Web Browser** (Chrome, Firefox, Safari, Edge)

### 1. Clone the Repository

```bash
git clone https://github.com/nicholasjvr/nicholasjvr.github.io.git
cd nicholasjvr.github.io
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Setup

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "nicholas-portfolio")
4. Follow the setup wizard

#### Enable Services

1. **Authentication**

   - Go to Authentication → Sign-in method
   - Enable Email/Password, Google, and GitHub providers
   - Add your domain to authorized domains

2. **Firestore Database**

   - Go to Firestore Database → Create database
   - Start in test mode (for development)

3. **Storage**
   - Go to Storage → Get started
   - Start in test mode (for development)

#### Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click the web app icon (</>)
4. Register your app with a nickname
5. Copy the configuration object

### 4. Configure the Application

#### Update Firebase Configuration

Edit `core/firebase-core.js` and replace the config object:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};
```

#### Set up reCAPTCHA (Optional)

1. Go to [Google reCAPTCHA](https://www.google.com/recaptcha/admin)
2. Create a new site
3. Add your domain
4. Copy the site key
5. Update the reCAPTCHA script in `index.html`

### 5. Run the Application

#### Development Mode

```bash
npm start
```

#### Production Build

```bash
npm run build
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure Overview

```
nicholas.github.io/
├── 📄 index.html              # Main application entry point
├── 📄 main.js                 # Application initialization
├── 📁 core/                   # Core configuration
│   ├── firebase-core.js      # Firebase setup
│   └── styles.css            # Main styles
├── 📁 scripts/               # Application logic
│   ├── auth/                 # Authentication system
│   ├── social/               # Social features
│   ├── widgets/              # Widget management
│   ├── upload/               # File upload system
│   └── ui/                   # UI components
├── 📁 pages/                 # Additional pages
├── 📁 assets/                # Static assets
└── 📁 docs/                  # Documentation
```

## 🔧 Development Workflow

### 1. Making Changes

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with a descriptive message: `git commit -m "Add feature description"`
5. Push to your branch: `git push origin feature/your-feature`
6. Create a Pull Request

### 2. Debugging

The application includes comprehensive debug logging. Open your browser's developer console to see:

- Authentication events
- File upload progress
- Social interactions
- Error messages

### 3. Testing

- Test on multiple browsers
- Test responsive design on mobile devices
- Verify Firebase rules work correctly
- Check file upload functionality

## 🚀 Deployment

### Firebase Hosting (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Deploy
firebase deploy
```

### Manual Deployment

1. Build the project: `npm run build`
2. Upload files to your hosting provider
3. Configure Firebase hosting rules

## 🐛 Troubleshooting

### Common Issues

#### Firebase Connection Errors

- Verify your Firebase configuration
- Check that all services are enabled
- Ensure your domain is authorized

#### File Upload Issues

- Check file size limits (50MB max)
- Verify file types are allowed
- Ensure Firebase Storage rules are correct

#### Authentication Problems

- Verify OAuth providers are configured
- Check authorized domains in Firebase
- Ensure email verification is working

#### Performance Issues

- Check browser console for errors
- Verify Firebase rules are optimized
- Monitor network requests

### Getting Help

1. Check the [Architecture Documentation](architecture.md)
2. Review Firebase documentation
3. Open an issue on GitHub
4. Check browser console for error messages

## 📚 Next Steps

- Read the [Architecture Documentation](architecture.md)
- Explore the codebase structure
- Set up your development environment
- Start contributing!

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](../CONTRIBUTING.md) for details.

## 📞 Support

- **GitHub Issues**: [Create an issue](https://github.com/nicholasjvr/nicholasjvr.github.io/issues)
- **Documentation**: Check the `docs/` folder
- **Firebase Support**: [Firebase Documentation](https://firebase.google.com/docs)

---

Happy coding! 🎉
