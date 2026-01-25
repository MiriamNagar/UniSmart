# UniSmart - Optimal Academic Flow

UniSmart is a React Native application built with Expo that helps university students generate optimal course schedules based on their preferences. The app uses constraint programming (CP-SAT solver) to find the best schedule combinations that satisfy hard constraints (no conflicts, required sections) while maximizing soft constraints (preferred times, instructors, day-off requests).

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Backend Integration](#backend-integration)
- [Development](#development)
- [Documentation](#documentation)
- [Contributing](#contributing)

## ✨ Features

- **Smart Schedule Generation**: Uses Google OR-Tools CP-SAT solver to generate optimal schedules
- **Preference-Based Optimization**: Considers preferred times, instructors, and day-off requests
- **Multi-Platform Support**: Works on iOS, Android, and Web
- **User-Friendly Interface**: Intuitive course selection and schedule visualization
- **Save & Compare**: Save multiple schedule options and compare them
- **Alerts & Notifications**: Stay updated with course and registration alerts
- **Notes Management**: Organize notes in custom folders

## 🏗️ Architecture

### Frontend
- **Framework**: React Native with Expo Router
- **Language**: TypeScript
- **State Management**: React Context API
- **Navigation**: File-based routing with Expo Router
- **Styling**: React Native StyleSheet with theme support

### Backend
- **Framework**: FastAPI (Python)
- **Solver**: Google OR-Tools CP-SAT
- **API**: RESTful API with Pydantic validation
- **Data**: Mock database (can be replaced with real database)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python 3.8 or higher
- npm or yarn
- Expo CLI (installed globally or via npx)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd UniSmart
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install backend dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Start the backend server**:
   ```bash
   # Windows
   .\backend\start_server.bat
   
   # Linux/Mac
   cd backend
   python main.py
   ```

5. **Start the frontend**:
   ```bash
   npx expo start
   ```

6. **Run on your device**:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app (physical device)

## 📁 Project Structure

```
UniSmart/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   ├── (onboarding)/     # Onboarding flow
│   ├── (student)/         # Student interface
│   │   └── (planner-flow)/ # Schedule generation flow
│   ├── (admin)/           # Admin interface
│   └── index.tsx          # Splash screen
├── backend/               # FastAPI backend
│   ├── main.py           # FastAPI application
│   ├── models.py         # Pydantic models
│   ├── scheduler_logic.py # CP-SAT solver logic
│   ├── mock_db.py        # Mock database
│   └── requirements.txt  # Python dependencies
├── components/            # Reusable React components
│   ├── bottom-navigation.tsx
│   └── ui/               # UI components
├── contexts/             # React Context providers
│   └── selection-context.tsx
├── hooks/                # Custom React hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
├── utils/                # Utility functions
│   ├── api.ts            # API client
│   ├── data-transformers.ts
│   └── schedule-transformer.ts
├── types/                # TypeScript type definitions
│   └── api.ts
├── constants/            # App constants
│   ├── routes.ts
│   └── theme.ts
└── README.md
```

## 🔌 Backend Integration

The frontend communicates with the FastAPI backend for schedule generation. See [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md) for detailed connection setup.

### API Endpoints

- `GET /health` - Health check
- `GET /courses?semester=A` - Get available courses
- `POST /generate-schedules` - Generate optimal schedule options

### Connection URLs

- **Android Emulator**: `http://10.0.2.2:8080`
- **iOS Simulator**: `http://localhost:8080`
- **Physical Device**: `http://<your-ip>:8080` (see BACKEND_CONNECTION.md)

## 💻 Development

### Code Style

- **Frontend**: TypeScript with ESLint
- **Backend**: Python with type hints
- **Documentation**: JSDoc for TypeScript, docstrings for Python

### Running Tests

```bash
# Backend tests
cd backend
python test_endpoint.py

# Frontend (when tests are added)
npm test
```

### Building for Production

```bash
# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

## 📚 Documentation

### Code Documentation

All code is thoroughly documented with:
- **Backend**: Python docstrings following Google/NumPy style
- **Frontend**: JSDoc comments for functions and TypeScript interfaces
- **Components**: Component-level documentation explaining purpose and usage

### Key Documentation Files

- [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md) - Backend setup and connection guide
- [backend/README.md](./backend/README.md) - Backend-specific documentation
- [api_contract.md](./api_contract.md) - API contract specification

### Module Documentation

#### Backend Modules

- **main.py**: FastAPI application with endpoint definitions
- **models.py**: Pydantic models for request/response validation
- **scheduler_logic.py**: CP-SAT solver implementation
- **mock_db.py**: Mock database with sample course data

#### Frontend Modules

- **utils/api.ts**: API client for backend communication
- **utils/data-transformers.ts**: Data format conversion utilities
- **utils/schedule-transformer.ts**: Schedule format transformation
- **contexts/selection-context.tsx**: Global state management
- **components/bottom-navigation.tsx**: Navigation components

## 🎯 How It Works

### Schedule Generation Algorithm

1. **Course Selection**: User selects courses they want to take
2. **Preference Input**: User sets preferred times, instructors, and day-off
3. **Section Filtering**: System filters out full sections (enrolled >= capacity)
4. **Conflict Detection**: Builds conflict graph for time overlaps
5. **Constraint Solving**: Uses CP-SAT solver to find valid combinations:
   - Hard constraints: No conflicts, required sections, lecture-recitation linkage
   - Soft constraints: Preferred times, instructors, day-off
6. **Scoring**: Each solution is scored based on preference matching
7. **Results**: Top N solutions returned sorted by score

### Scoring System

- **Preferred Start Time** (50 points): First lesson of each day within preferred range
- **Instructor Preferences** (30 points): Matching preferred instructors
- **Day Off Bonus** (20 points): Requested day has no classes

Total score is normalized to 0-100 percentage.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google OR-Tools for the CP-SAT solver
- Expo team for the excellent React Native framework
- FastAPI for the modern Python web framework

---

For more information, see the [backend README](./backend/README.md) and [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md).
