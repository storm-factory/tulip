# Install
## Download executable
You may download Tulip from the [Downloads page](downloads.md)

## Using snap store

[![Get it from the Snap Store](https://snapcraft.io/en/light/install.svg)](https://snapcraft.io/tulip-roadbook)

or from console:
```bash
sudo snap install --edge tulip-roadbook
```

## Run from source
You will need [inkscape](https://inkscape.org/) installed on your system

Clone or download the repository and go to source code folder
```bash
git clone https://gitlab.com/drid/tulip.git
cd tulip
# Install node modules
npm install
# Generate SVGs
npm run convert-svg
```
Start the application
```bash
npm run
```


## Build and install
You will need [inkscape](https://inkscape.org/) installed on your system

Clone or download the repository and go to source code folder
```bash
git clone https://gitlab.com/drid/tulip.git
cd tulip
# Install node modules
npm install
# Generate SVGs
npm run convert-svg
```

Available build commands are:
```bash
# All linux binaries
npm run build-linux
# Windows binaries
npm run build-win
# Mac
npm run build-mac
```
also for specific Linux package type you can use electron builder directly
```bash
# AppImage
npx electron-builder --linux appimage
# Snap
npx electron-builder --linux snap
# DEB
npx electron-builder --linux deb
# RPM
npx electron-builder --linux rpm
```