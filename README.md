# ztoolbox-app

Packaging : https://github.com/electron-userland/electron-packager

```
electron-packager <sourcedir> <appname> --platform=<platform> --arch=<arch> [optional flags...]
```

# Xfce Clipboard Manager Issue

Xfce doesn't run a clipboard daemon by default, which can break copy/paste operations.

Solution: Enable `Clipman` (or GNOME clipboard plugin):
1. Go to Menu → Settings → Session and Startup → Application Autostart
2. Look for "Clipman" and enable it (check the box)
3. If Clipman isn't there, look for "GNOME Settings Daemon's clipboard plugin" instead
4. After enabling, log out and log back in

This is because, without a clipboard manager running, the X11 selection buffer may not properly persist clipboard content between applications.
