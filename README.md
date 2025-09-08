## �� Features

### Core Functionality

- **Social Authentication**: Google, GitHub, and email/password login
- **Widget Showcase**: Upload and display interactive projects/widgets
- **User Profiles**: Customizable profiles with stats and social features
- **Real-time Notifications**: Live notification system with Firebase
- **Responsive Design**: Mobile-first approach with modern UI/UX

### Advanced Features

- **Drag & Drop Upload**: Intuitive file upload system (HTML, CSS, JS, images)
- **Timeline Management**: Dynamic content timeline with social interactions
- **User Discovery**: Explore other creators and their projects
- **Social Interactions**: Follow/unfollow, like, and comment system
- **Project Inventory**: Organized showcase of user projects

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Custom CSS with modern design patterns
- **Deployment**: Firebase Hosting
- **Icons**: Custom icon system and Font Awesome
- **Fonts**: Inter & Orbitron (Google Fonts)

## 📁 Project Structure

nicholas.github.io/
├── assets/ # Static assets (images, icons, media)
├── core/ # Core Firebase configuration
├── pages/ # Additional pages (explore, users, inventory)
├── scripts/ # Main application logic
│ ├── auth/ # Authentication system
│ ├── firebase/ # Firebase setup and utilities
│ ├── social/ # Social features (follow, notifications)
│ ├── upload/ # File upload functionality
│ ├── widgets/ # Widget management system
│ └── ui/ # UI components and canvas
├── widgets/ # User-uploaded widget examples
└── index.html # Main application entry point

## 🚀 Getting Started

### Prerequisites

- Node.js (for development)
- Firebase account
- Modern web browser

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/nicholasjvr/nicholasjvr.github.io.git
   cd nicholasjvr.github.io
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Firebase Setup**

   - Create a Firebase project
   - Enable Authentication, Firestore, and Storage
   - Update Firebase configuration in `core/firebase-core.js`

4. **Run locally**
   ```bash
   npm start
   ```

## �� Configuration

### Firebase Configuration

Update `core/firebase-core.js` with your Firebase project credentials:

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

### Environment Variables

- `RECAPTCHA_SITE_KEY`: Google reCAPTCHA site key
- Firebase configuration (see above)

## �� Features in Detail

### Authentication System

- Multi-provider login (Google, GitHub, Email)
- Email verification
- Password reset functionality
- Profile management
- Session persistence

### Widget Showcase

- Drag & drop file upload
- Support for HTML, CSS, JS, and image files
- Real-time preview
- Version control
- Public/private visibility

### Social Features

- User following system
- Real-time notifications
- Activity timeline
- User discovery
- Profile customization

### UI/UX Highlights

- Responsive sidebar navigation
- Modern card-based design
- Smooth animations
- Dark/light theme support
- Mobile-optimized interface

## 🚀 Deployment

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init hosting

# Deploy
firebase deploy
```

### Manual Deployment

1. Build the project
2. Upload files to your hosting provider
3. Configure Firebase hosting rules

## 📚 Documentation

For detailed documentation, visit our [Documentation Hub](docs/):

- **[Getting Started](docs/getting-started.md)** - Complete setup and installation guide
- **[Architecture Overview](docs/architecture.md)** - System design and architecture
- **[API Reference](docs/api-reference.md)** - Complete API documentation
- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to the project

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For detailed contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## �� Acknowledgments

- Firebase for backend services
- Google Fonts for typography
- Font Awesome for icons
- The open-source community for inspiration

## 📞 Contact

- **Author**: Nicholas JVR
- **GitHub**: [@nicholasjvr](https://github.com/nicholasjvr)
- **Website**: [nicholasjvr.github.io](https://nicholasjvr.github.io)

---

⭐ **Star this repository if you find it helpful!**
