# UniSmart Backend Server

FastAPI backend server for the UniSmart application.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

### Windows
```bash
start_server.bat
```

Or manually:
```bash
python main.py
```

### Linux/Mac
```bash
python main.py
```

Or using uvicorn directly (make sure to use 0.0.0.0 for emulator access):
```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```

## Important Notes

- The server **must** be started with `host="0.0.0.0"` to accept connections from Android emulators
- The server runs on port 8080 by default
- For Android emulators, use `http://10.0.2.2:8080` (this maps to localhost)
- For iOS simulators and web, use `http://localhost:8080`
- For physical devices, use your computer's local IP address (e.g., `http://192.168.1.100:8080`)

## Endpoints

- `GET /health` - Health check endpoint
- `GET /courses?semester=A` - Get courses for a semester
- `POST /generate-schedules` - Generate schedule options
- `GET /` - API information

## Troubleshooting

If you're getting connection timeout errors:

1. **Make sure the server is running** (check the terminal output)
2. **Verify the server is bound to `0.0.0.0`** (not just `127.0.0.1`) - you should see `INFO: Uvicorn running on http://0.0.0.0:8080`
3. **Check Windows Firewall** - port 8080 must be allowed
4. **Test the backend directly in a browser**: `http://localhost:8080/health`

### Connection by Device Type:

- **Android Emulator**: Use `http://10.0.2.2:8080` (this is already configured)
- **iOS Simulator**: Use `http://localhost:8080` (this is already configured)
- **Physical Device (Expo Go)**: 
  - Find your computer's IP address:
    - Run: `.\backend\get_ip_address.ps1` (Windows PowerShell)
    - Or manually: Open PowerShell and run `ipconfig`, look for IPv4 Address
  - Update the API URL in the app to use your IP (e.g., `http://192.168.1.100:8080`)
  - Both your computer and phone must be on the same Wi-Fi network

### Expo Go Specific Issues:

- **Expo Go** uses network connections differently than development builds
- For physical devices, you **must** use your computer's local IP address (not `localhost` or `10.0.2.2`)
- If using Android Emulator with Expo Go, `10.0.2.2:8080` should work
- Make sure both devices are on the same network

