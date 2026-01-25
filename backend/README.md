# UniSmart Backend Server

FastAPI backend server for the UniSmart application. This server provides REST API endpoints for course retrieval and optimal schedule generation using constraint programming (CP-SAT solver).

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Setup](#setup)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Architecture](#architecture)
- [Algorithm Details](#algorithm-details)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The UniSmart backend is a FastAPI application that uses Google OR-Tools CP-SAT solver to generate optimal course schedules. It handles:

- Course and section data management
- Schedule conflict detection
- Constraint programming for optimal solutions
- Preference-based scoring

## ✨ Features

- **RESTful API**: Clean, documented API endpoints
- **Constraint Programming**: Uses CP-SAT solver for optimal schedule generation
- **Preference Optimization**: Considers user preferences (times, instructors, day-off)
- **Conflict Detection**: Automatically detects and avoids time conflicts
- **Multiple Solutions**: Generates top N unique schedule options
- **Type Safety**: Pydantic models for request/response validation

## 🚀 Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify installation**:
   ```bash
   python -c "import fastapi, ortools; print('Dependencies installed successfully')"
   ```

## 🏃 Running the Server

### Windows

**Option 1: Using batch file** (recommended):
```bash
start_server.bat
```

**Option 2: Manual start**:
```bash
python main.py
```

### Linux/Mac

```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

### Important Notes

- The server **must** be started with `host="0.0.0.0"` to accept connections from Android emulators
- The server runs on port **8080** by default
- For Android emulators, use `http://10.0.2.2:8080` (this maps to localhost)
- For iOS simulators and web, use `http://localhost:8080`
- For physical devices, use your computer's local IP address (e.g., `http://192.168.1.100:8080`)

### Verify Server is Running

Open your browser and navigate to:
- `http://localhost:8080/health` - Should return `{"status":"healthy"}`
- `http://localhost:8080/` - Should return API information

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response**:
```json
{
  "status": "healthy"
}
```

### Get Courses

```http
GET /courses?semester=A
```

**Query Parameters**:
- `semester` (optional): Filter courses by semester (e.g., "A")

**Response**:
```json
{
  "courses": [
    {
      "id": "CS101",
      "name": "Introduction to Computer Science",
      "semester": "A"
    }
  ]
}
```

### Generate Schedules

```http
POST /generate-schedules
Content-Type: application/json
```

**Request Body**:
```json
{
  "selected_course_ids": ["CS101", "MATH101"],
  "preferences": {
    "preferred_start_time": "09:00",
    "preferred_end_time": "17:00",
    "day_off_requested": 5,
    "course_preferences": [
      {
        "course_id": "CS101",
        "preferred_instructor_id": "inst-1"
      }
    ]
  },
  "max_options": 5
}
```

**Response**:
```json
{
  "status": "success",
  "options": [
    {
      "score": 85,
      "schedule": [
        {
          "course_name": "Introduction to Computer Science",
          "section_id": "intro_l1",
          "type": "Lecture",
          "instructor": "Prof. Ben-Moshe Boaz",
          "meetings": [
            {
              "day": 0,
              "start": "15:00",
              "end": "17:00"
            }
          ]
        }
      ]
    }
  ]
}
```

## 🏗️ Architecture

### Module Structure

```
backend/
├── main.py              # FastAPI application and endpoints
├── models.py            # Pydantic models for validation
├── scheduler_logic.py   # CP-SAT solver implementation
├── mock_db.py          # Mock database with sample data
├── test_endpoint.py    # Testing utilities
└── requirements.txt    # Python dependencies
```

### Key Components

#### main.py
- FastAPI application setup
- CORS middleware configuration
- API endpoint definitions
- Request/response handling

#### models.py
- Pydantic models for type validation
- Request models: `ScheduleRequest`, `Preferences`, `CoursePreference`
- Response models: `ScheduleResponse`, `ScheduleOption`, `ScheduleItem`, `Meeting`

#### scheduler_logic.py
- CP-SAT solver integration
- Conflict detection algorithms
- Schedule scoring system
- Solution generation logic

#### mock_db.py
- Sample course data
- Section and instructor information
- Meeting time data

## 🔬 Algorithm Details

### Schedule Generation Process

1. **Validation**: Validates all course IDs exist
2. **Section Filtering**: Excludes full sections (enrolled >= capacity)
3. **Conflict Graph**: Builds graph of time conflicts between sections
4. **Constraint Modeling**: Creates CP-SAT model with:
   - **Hard Constraints**:
     - Exactly one lecture per course (if available)
     - Exactly one recitation per course (if available)
     - Selected recitation must link to selected lecture
     - No time conflicts between any sections
   - **Soft Constraints** (in objective function):
     - Instructor preferences
5. **Solving**: Iteratively solves to find top N unique solutions
6. **Scoring**: Calculates fit score based on all preferences
7. **Sorting**: Returns solutions sorted by score (best first)

### Scoring System

The scoring system evaluates how well a schedule matches user preferences:

- **Preferred Start Time** (50 points): First lesson of each day within preferred time range
- **Instructor Preferences** (30 points): Matching preferred instructors
- **Day Off Bonus** (20 points): Requested day has no classes

Total score is normalized to 0-100 percentage.

### Time Conflict Detection

Two sections conflict if they have meetings on the same day with overlapping time ranges. The algorithm uses a conflict graph to ensure no conflicting sections are selected together.

## 🧪 Testing

### Test Endpoint Connection

```bash
cd backend
python test_endpoint.py
```

This will:
1. Test the `/health` endpoint
2. Test the `/courses` endpoint
3. Display available courses

### Manual Testing

You can test endpoints using curl:

```bash
# Health check
curl http://localhost:8080/health

# Get courses
curl http://localhost:8080/courses?semester=A

# Generate schedules (example)
curl -X POST http://localhost:8080/generate-schedules \
  -H "Content-Type: application/json" \
  -d '{
    "selected_course_ids": ["CS101"],
    "preferences": {
      "preferred_start_time": "09:00",
      "preferred_end_time": "17:00",
      "day_off_requested": null,
      "course_preferences": []
    },
    "max_options": 3
  }'
```

## 🔧 Troubleshooting

### Connection Issues

**Problem**: Connection timeout errors from frontend

**Solutions**:
1. **Verify server is running**: Check terminal for `INFO: Uvicorn running on http://0.0.0.0:8080`
2. **Check Windows Firewall**: Port 8080 must be allowed
3. **Test in browser**: Navigate to `http://localhost:8080/health`
4. **Verify host binding**: Server must bind to `0.0.0.0`, not `127.0.0.1`

### Device-Specific Connection

#### Android Emulator
- Use `http://10.0.2.2:8080` (already configured in frontend)

#### iOS Simulator
- Use `http://localhost:8080` (already configured in frontend)

#### Physical Device
- Use your computer's IP address (e.g., `http://192.168.1.100:8080`)
- Find IP: Run `.\backend\get_ip_address.ps1` (Windows) or `ipconfig` / `ifconfig`
- Both devices must be on the same Wi-Fi network

### "No courses available" Error

- The backend has 5 courses in the mock database for semester "A"
- If you see this message, the backend isn't reachable
- Follow connection troubleshooting steps above

### Port Conflicts

If port 8080 is already in use:

1. **Find process using port**:
   ```bash
   # Windows
   netstat -ano | findstr :8080
   
   # Linux/Mac
   lsof -i :8080
   ```

2. **Kill process** or **change port** in `main.py`:
   ```python
   uvicorn.run(app, host="0.0.0.0", port=8080)  # Change 8080 to another port
   ```

## 📚 Code Documentation

All code is thoroughly documented with Python docstrings:

- **Functions**: Include parameter descriptions, return types, and examples
- **Classes**: Include attribute descriptions and usage examples
- **Modules**: Include module-level documentation explaining purpose

See individual source files for detailed documentation.

## 🔄 Future Enhancements

- [ ] Database integration (replace mock_db.py)
- [ ] Authentication and authorization
- [ ] Real-time course availability updates
- [ ] Advanced preference options
- [ ] Schedule comparison features
- [ ] Export schedules to calendar formats

## 📝 License

This project is licensed under the MIT License.

---

For frontend setup and connection details, see [BACKEND_CONNECTION.md](../BACKEND_CONNECTION.md) and the main [README.md](../README.md).
