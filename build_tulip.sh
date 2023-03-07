#!/bin/bash
npx tape test/unit/*.js

echo "building tulip $VERSION for Linux"
npm run make-linux
echo "building tulip $VERSION for OSX"
npm run  make-mac
echo "building tulip $VERSION for Windows"
npm run make-win

echo "tulip builds complete!"
