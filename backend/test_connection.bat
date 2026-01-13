@echo off
echo Testing backend connection...
echo.

echo 1. Testing localhost connection...
curl -s http://localhost:8080/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Backend is accessible from localhost
) else (
    echo    [FAIL] Backend is NOT accessible from localhost
    echo    Make sure the backend is running: python main.py
    goto :end
)

echo.
echo 2. Testing IP address connection (192.168.1.249)...
curl -s http://192.168.1.249:8080/health 2>nul
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Backend is accessible from IP address
) else (
    echo    [FAIL] Backend is NOT accessible from IP address
    echo    This is likely a Windows Firewall issue!
    echo    Try: Allow port 8080 through Windows Firewall
)

echo.
echo 3. Testing courses endpoint...
curl -s http://192.168.1.249:8080/courses?semester=A 2>nul | findstr /C:"courses" >nul
if %ERRORLEVEL% EQU 0 (
    echo    [OK] Courses endpoint is working
) else (
    echo    [FAIL] Courses endpoint returned unexpected result
)

:end
echo.
echo Press any key to exit...
pause >nul




