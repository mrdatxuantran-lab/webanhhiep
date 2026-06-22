@echo off
echo ========================================
echo   NhaTro Website - Local Server
echo ========================================
echo.
echo Ban can cai dat mot trong cac cong cu sau de chay website:
echo.
echo [1] Node.js: https://nodejs.org/
echo     Sau do chay: npx -y live-server
echo.
echo [2] Python: https://python.org/
echo     Sau do chay: python -m http.server 3000
echo.
echo [3] VS Code + Extension "Live Server" (Ritwick Dey)
echo     Click chuot phai vao index.html ^> Open with Live Server
echo.
echo ========================================
echo   Dang thu tim cong cu co san...
echo ========================================
echo.

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo Tim thay Node.js! Dang khoi dong server...
    echo Mo trinh duyet tai: http://localhost:3000
    start http://localhost:3000
    npx -y live-server --port=3000
    goto :eof
)

where python >nul 2>&1
if %errorlevel% equ 0 (
    echo Tim thay Python! Dang khoi dong server...
    echo Mo trinh duyet tai: http://localhost:3000
    start http://localhost:3000
    python -m http.server 3000
    goto :eof
)

echo Khong tim thay Node.js hoac Python.
echo Vui long cai dat mot trong hai cong cu tren.
echo Hoac su dung VS Code voi extension "Live Server".
echo.
pause
