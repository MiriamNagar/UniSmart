# Backend Connection Guide

## Quick Setup

1. **Start the backend server**:
   ```bash
   cd backend
   python main.py
   ```
   Or use: `.\backend\start_server.bat`

2. **Verify it's running**:
   - Open browser: `http://localhost:8080/health`
   - Should see: `{"status":"healthy"}`

## Connection URLs by Device Type

### Android Emulator
- **Already configured**: `http://10.0.2.2:8080`
- This works for both Expo Go and development builds
- No changes needed!

### iOS Simulator
- **Already configured**: `http://localhost:8080`
- This works for both Expo Go and development builds
- No changes needed!

### Physical Device (Expo Go)
- **Requires your computer's IP address**
- Steps:
  1. Find your IP: Run `.\backend\get_ip_address.ps1` or check with `ipconfig`
  2. Update the API URL in `app/(student)/(planner-flow)/course-selection.tsx`:
     ```typescript
     const API_BASE_URL = Platform.OS === "android" 
       ? "http://10.0.2.2:8080"  // Keep for emulator
       : "http://YOUR_IP:8080";  // Change YOUR_IP to your actual IP
     ```
  3. Also update `utils/api.ts` with the same IP
  4. Make sure your phone and computer are on the **same Wi-Fi network**

## Testing

Test the backend endpoint:
```bash
cd backend
python test_endpoint.py
```

This should show 5 courses from the mock database.

## Common Issues

### Connection Timeout
- ✅ Backend running? Check terminal for `INFO: Uvicorn running on http://0.0.0.0:8080`
- ✅ Windows Firewall blocking? Allow port 8080
- ✅ Using physical device? Make sure you're using the IP address, not localhost
- ✅ Same network? Phone and computer must be on same Wi-Fi

### "No courses available"
- The backend has 5 courses in the mock database for semester "A"
- If you see this message, the backend isn't reachable
- Follow the troubleshooting steps above

## Port Changed from 8000 to 8080

We changed the default port to 8080 to avoid conflicts. All configurations have been updated.




