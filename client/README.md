# 💻 InterviewIQ Frontend Client

The frontend application for InterviewIQ is a modern, responsive single-page web app built with **React 19**, **Vite 7**, **TailwindCSS v4**, **Redux Toolkit**, and **LiveKit WebRTC**.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (npm v9+)

### Installation
```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

### Development Server
```bash
npm run dev
```
The app will be accessible at [http://localhost:5173](http://localhost:5173).

---

## 🛠️ Key Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server with hot module replacement (HMR) |
| `npm run build` | Compiles and optimizes assets for production distribution |
| `npm run preview` | Locally preview the production build |
| `npm run lint` | Run ESLint across all JSX and JS files |

---

## 📁 Directory Structure

```
client/src/
├── assets/          # Static icons, branding assets, and demo media
├── components/      # Reusable UI components (TruGenVideoInterviewer, Monaco Editor, V2Room)
├── context/         # React Context providers (ThemeContext)
├── hooks/           # Custom React hooks (useContinuousSTT)
├── pages/           # Application views (Home, Auth, Dashboard, V2Interview, Recruiter, SuperAdmin)
├── redux/           # Redux Toolkit store and slices (userSlice)
├── utils/           # Helper utilities (Firebase Auth integration)
├── App.jsx          # Route declarations, RBAC guards, and core layouts
├── index.css        # Tailwind CSS and global styling
└── main.jsx         # Application root entry point
```
