#!/bin/bash
npx tape test/unit/*.js

echo "what is the build version?"
read VERSION
echo "building tulip $VERSION for Linux"
npx electron-packager . --appname=tulip --platform=linux --arch=x64 --icon=tulip-logo.ico --app-version=$VERSION --overwrite
echo "building tulip $VERSION for OSX"
npx electron-packager . --appname=tulip --platform=darwin --arch=x64 --icon=tulip-logo.ico --app-version=$VERSION --overwrite
echo "building tulip $VERSION for Windows"
npx electron-packager . --appname=tulip --platform=win32 --arch=x64 --icon=tulip-logo.ico --app-version=$VERSION --overwrite

echo "tulip builds complete!"
