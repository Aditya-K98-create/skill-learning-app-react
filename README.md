🚀 Skill Learning Companion App (React Native + Expo)
📱 Overview

Skill Learning App is a modern gamified learning platform built using React Native and Expo.
It helps users track their learning progress, manage goals, and stay motivated using streaks, XP points, and leaderboard rankings.

✨ Features
🎯 Goal Management (Add / Track Learning Goals)
📊 Dashboard with Progress & Activity Insights
🔥 Streak System (Daily consistency tracking)
🏆 Leaderboard (Compare with other users)
📚 Learning Modules (Courses & Videos)
👤 User Profile with Achievements
🌙 Dark Mode Support
🔔 Notifications System
🔐 Firebase Authentication (Login / Register)
🧠 Activity Heatmap (Last 60 days progress)
🛠 Tech Stack
⚛️ React Native (Expo)
🔥 Firebase (Authentication + Realtime DB)
🧩 Context API (State Management)
🎨 Custom UI Design (Modern + Clean)
💾 AsyncStorage (Persistence)
📸 Screenshots
🏠 Dashboard

SS

🎯 Goals Page

SS

📊 Leaderboard

SS

📚 Learning Page

SS

👤 Profile Page

SS
🔐 Login / Register

SS

⚙️ Installation & Setup
# Clone the repository
git clone https://github.com/your-username/skill-learning-app-react.git

# Navigate to project
cd skill-learning-app-react

# Install dependencies
npm install

# Start the app
npx expo start
🔐 Firebase Setup
Create a Firebase project
Enable Authentication (Email/Password)
Create Realtime Database
Replace config in:
config/firebase.ts
skill-learning-app-react/
│
├── app/                      # Main application (Expo Router)
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   │
│   ├── (tabs)/              # Bottom tab navigation screens
│   │   ├── dashboard.tsx    # Home / Dashboard
│   │   ├── goals.tsx        # Goals management
│   │   ├── leaderboard.tsx  # Ranking system
│   │   ├── learning.tsx     # Learning modules
│   │   ├── profile.tsx      # User profile
│   │   ├── _layout.tsx      # Tab layout
│   │   │
│   │   └── goal/            # Dynamic goal pages
│   │       └── [goalId].tsx
│   │
│   ├── _layout.tsx          # Root layout (providers setup)
│   └── index.tsx            # Entry screen / redirect
│
├── assets/                  # Static assets
│   ├── images/              # App images/icons
│   ├── Videos/              # Learning videos (if any)
│   └── icon.png
│
├── components/              # Reusable UI components
│   ├── context/             # Context providers
│   │   ├── AuthContext.tsx
│   │   ├── GoalContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── ui/                  # UI elements (buttons, icons, etc.)
│   └── shared components
│
├── config/                  # Configuration files
│   └── firebase.ts          # Firebase setup
│
├── constants/               # App constants
│   └── theme.ts             # Theme & colors
│
├── context/                 # Global context (extra)
│   └── ThemeContext.tsx
│
├── hooks/                   # Custom hooks
│   └── use-theme-color.ts
│
├── utils/                   # Utility functions
│   └── notifications.ts
│
├── admin-panel/             # Separate admin dashboard (React + Vite)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── scripts/                 # Helper scripts
│   └── reset-project.js
│
├── app.json                 # Expo config
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── .gitignore
└── README.md

🚀 Future Improvements
📈 Weekly analytics graph
🤝 Social sharing (friends system)
🏅 More achievements & badges
🎥 Video progress tracking
☁️ Cloud sync improvements
👨‍💻 Author

Aditya
💙 Passionate Web & App Developer

⭐ Support

If you like this project:

👉 Give it a ⭐ on GitHub
👉 Share with your friends
