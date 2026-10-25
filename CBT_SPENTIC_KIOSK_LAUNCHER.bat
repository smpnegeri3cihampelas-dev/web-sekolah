@echo off
title CBT SMPN 3 Cihampelas - Mode Ujian Kiosk Terkunci
color 1f
cls

echo ======================================================================
echo          SMP NEGERI 3 CIHAMPELAS - CBT EXAM KIOSK LAUNCHER
echo ======================================================================
echo.
echo  Mode Ujian Terkunci (Kiosk) akan segera dijalankan.
echo  Fitur Kiosk:
echo   - Layar Penuh 100%% (Menutupi seluruh layar Windows)
echo   - Kolom URL Google & Tab Browser dinonaktifkan
echo   - Tombol Tutup / Minimize dinonaktifkan
echo.
echo  Tekan tombol apa saja untuk MEMULAI UJIAN...
pause >nul

:: URL Ujian CBT SMPN 3 Cihampelas
set TARGET_URL=http://localhost:3000/elearning

:: Cari Google Chrome atau Microsoft Edge
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    echo Menjalankan Ujian via Google Chrome Kiosk...
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk "%TARGET_URL%" --disable-pinch --overscroll-history-navigation=0 --no-first-run --no-default-browser-check --disable-extensions
    goto END
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    echo Menjalankan Ujian via Google Chrome Kiosk (x86)...
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --kiosk "%TARGET_URL%" --disable-pinch --overscroll-history-navigation=0 --no-first-run --no-default-browser-check --disable-extensions
    goto END
)

if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    echo Menjalankan Ujian via Google Chrome Local...
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --kiosk "%TARGET_URL%" --disable-pinch --overscroll-history-navigation=0 --no-first-run --no-default-browser-check --disable-extensions
    goto END
)

:: Jika Chrome tidak ditemukan, gunakan Microsoft Edge (pasti ada di setiap Windows 10/11)
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    echo Menjalankan Ujian via Microsoft Edge Kiosk...
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk "%TARGET_URL%" --edge-kiosk-type=fullscreen --no-first-run --disable-extensions
    goto END
)

:: Fallback default browser
echo Browser utama tidak ditemukan di path default, membuka browser bawaan...
start "" "%TARGET_URL%"

:END
exit
