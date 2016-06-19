var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var printWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1500, height: 1000, 'min-height': 700});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    printWindow = null;
  });
});

const ipcMain = require('electron').ipcMain;

ipcMain.on('ignite-print', (event, arg) => {
  printWindow = new BrowserWindow({width: 700, height: 800, 'min-height': 700, 'alwaysOnTop': true, 'resizable': false});
  printWindow.loadURL('file://' + __dirname + '/print.html');
  var data = arg;
  printWindow.on('closed', () => {
    printWindow = null
  })
  //listens for the browser window to say it's ready to print
  ipcMain.on('print-launched', (event, arg) => {
    event.sender.send('print-data', data);
  });

  ipcMain.on('print-pdf', (event, arg) => {
    console.log(arg);
    // printWindow.webContents.printToPDF(arg);
  });
});
