@echo off

call :isAdmin

if %errorlevel% == 0 (
    goto :run
) else (
    echo Error: Run as administrator.
)

exit /b

:isAdmin
fsutil dirty query %systemdrive% >nul
exit /b

:run

reg add HKCU\SOFTWARE\Chromium\NativeMessagingHosts\eu.gitlab.zatsunenomokou.chromenativebridge /f /ve /t REG_SZ /d %~dp0eu.gitlab.zatsunenomokou.chromenativebridge_win.json

reg add HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\eu.gitlab.zatsunenomokou.chromenativebridge /f /ve /t REG_SZ /d %~dp0eu.gitlab.zatsunenomokou.chromenativebridge_win.json

pause
