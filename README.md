# SmartSpend - Personal Finance Tracker

A modern, responsive personal finance tracker built with React and Firebase, designed for students and young professionals.

## 🚀 Features

- **Firebase Authentication**: Secure user registration and login
- **Real-time Data**: User-specific financial data with Firebase Firestore
- **Transaction Management**: Add, edit, delete, and filter transactions
- **Budget Tracking**: Set budgets and track spending by category
- **Interactive Charts**: Visual representation of financial data
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works seamlessly on all devices
- **Data Export**: Export your financial data as JSON

## 🛠 Tech Stack

- **Frontend**: React 19, JavaScript
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Routing**: React Router
- **Notifications**: React Toastify

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js (v14 or higher)
- npm or yarn
- A Firebase project

## 🔧 Firebase Setup

### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Follow the setup wizard

### Step 2: Get Firebase Configuration
1. In your Firebase project, click the gear icon → Project settings
2. Scroll down to "Your apps" and click the web icon (`</>`)
3. Register your app and copy the configuration object

### Step 3: Update Firebase Config
Replace the placeholder values in `src/firebase-config.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

### Step 4: Enable Authentication
1. In Firebase Console, go to Authentication → Sign-in method
2. Enable "Email/Password" authentication
3. (Optional) Enable Google sign-in for future use

### Step 5: Set up Firestore Database
1. Go to Firestore Database in Firebase Console
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location for your database

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartspend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Update Firebase configuration**
   - Edit `src/firebase-config.js` with your Firebase project details

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## 📱 Usage

### Getting Started
1. **Register**: Create a new account with email and password
2. **Login**: Sign in to access your dashboard
3. **Add Transactions**: Record your income and expenses
4. **Set Budgets**: Create monthly budgets for different categories
5. **Track Progress**: Monitor your spending with visual charts

### Key Features
- **Dashboard**: Overview of your financial health
- **Transactions**: Detailed transaction management with filtering
- **Budget**: Set and track category-based budgets
- **Settings**: Customize your experience and manage data

## 🔒 Security Features

- Firebase Authentication for secure user management
- User-specific data isolation
- Secure data transmission with HTTPS
- Client-side data validation

## 📊 Data Structure

The app uses the following data structure:

### Transactions
```javascript
{
  id: timestamp,
  type: 'income' | 'expense',
  amount: number,
  category: string,
  description: string,
  date: 'YYYY-MM-DD'
}
```

### Budgets
```javascript
{
  id: timestamp,
  category: string,
  amount: number,
  spent: number (calculated)
}
```

## 🎨 Customization

### Themes
- Light and dark mode support
- Customizable color scheme in `tailwind.config.js`
- Theme preference stored in localStorage

### Categories
- Modify categories in `src/data/mockData.js`
- Add new expense and income categories as needed

## 🚀 Deployment

### Deploy to Netlify
1. Build the project: `npm run build`
2. Deploy the `build` folder to Netlify
3. Set up environment variables if needed

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the deployment prompts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:
1. Check the Firebase Console for authentication/database errors
2. Ensure your Firebase configuration is correct
3. Check browser console for error messages
4. Verify Firebase rules allow read/write access

## 🔮 Future Enhancements

- [ ] Google Sign-In integration
- [ ] Data synchronization across devices
- [ ] Advanced reporting and analytics
- [ ] Recurring transaction support
- [ ] Bill reminders and notifications
- [ ] Multi-currency support
- [ ] Data import from bank statements

---

Built with ❤️ for better financial management