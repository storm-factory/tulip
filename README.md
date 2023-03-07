
#  Tulip
<div align="center">
  <img src="assets/tulip-logo3.png" width="100" height="100" align="right"/>
</div>

An editor for rally roadbooks built in the electron atom environment using web technologies

Features:
* Import GPX file
* Plan route on map
* Export route GPX and OpeRally GPX
* Print/Export roadbook PDF
* Works on Linux/Mac/Windows


## Install and run
Install [Node.js](https://nodejs.org/)  
```bash
git clone https://github.com/storm-factory/tulip
cd tulip
npm install
```
Copy `api_keys.js.example` to `api_keys.js` and add your google api keys. 

Leave keys empty for Development maps
```bash
npm start
```

## Packaging
For current operating system
```bash
npm run make
```
For Linux
```bash
npm run make-linux
```
For Mac
```bash
npm run  make-mac
```
For Windows
```bash
npm run make-win
```
Packages are placed in **out** directory