# Expo Go Connection Troubleshooting

## The Issue
- ✅ Web app works at `http://localhost:8081` (Expo web dev server)
- ❌ Expo Go on physical device can't connect to backend at `192.168.1.249:8080`

## Quick Checks

### 1. Is the Backend Running?
- Open terminal where backend should be running
- Should see: `INFO: Uvicorn running on http://0.0.0.0:8080`
- If not running: `cd backend && python main.py`

### 2. Test Backend from Your PC
Open in browser:
- `http://localhost:8080/health` → Should show `{"status":"healthy"}`
- `http://192.168.1.249:8080/health` → Should show `{"status":"healthy"}`

If localhost works but IP doesn't → **Windows Firewall issue!**

### 3. Windows Firewall (Most Common Issue!)

**Option A: Quick Test (Temporarily disable)**
1. Windows Settings → Privacy & Security → Windows Security → Firewall & network protection
2. Temporarily turn off firewall for your network
3. Test Expo Go connection
4. **Remember to turn it back on!**

**Option B: Allow Port 8080 (Recommended)**
1. Windows Settings → Privacy & Security → Windows Security → Firewall & network protection
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter "8080" → Next
6. Select "Allow the connection" → Next
7. Check all profiles → Next
8. Name it "Python Backend Port 8080" → Finish

**Option C: Allow Python (Alternative)**
1. Windows Settings → Privacy & Security → Windows Security → Firewall & network protection
2. Click "Allow an app through firewall"
3. Find "Python" in the list
4. Check both "Private" and "Public" boxes
5. Click OK

### 4. Same Network?
- Your phone and computer must be on the **same Wi-Fi network**
- Check phone Wi-Fi settings
- Check computer Wi-Fi settings
- They should show the same network name

### 5. Test Connection Script
Run: `.\backend\test_connection.bat`
This will test if the backend is accessible from the IP address.

## Still Not Working?

### Check Backend Binding
Make sure backend is bound to `0.0.0.0`, not `127.0.0.1`:
- Check `backend/main.py` - should have: `uvicorn.run(app, host="0.0.0.0", port=8080)`
- Restart backend after any changes

### Try Different Port
Sometimes port 8080 is blocked. Try port 3000:
1. Change `backend/main.py`: `port=3000`
2. Change `app/(student)/(planner-flow)/course-selection.tsx`: `http://192.168.1.249:3000`
3. Change `utils/api.ts`: `http://192.168.1.249:3000`
4. Restart backend
5. Update firewall rule for port 3000

### Check Expo Go Network Permissions
- On Android: Settings → Apps → Expo Go → Permissions → Make sure "Network" is enabled
- On iOS: Should be enabled by default

## Verification Steps

1. ✅ Backend running (`http://localhost:8080/health` works)
2. ✅ Backend accessible via IP (`http://192.168.1.249:8080/health` works)
3. ✅ Same Wi-Fi network
4. ✅ Windows Firewall allows port 8080
5. ✅ Expo Go app reloaded/restarted after code changes

If all these pass, Expo Go should connect!




