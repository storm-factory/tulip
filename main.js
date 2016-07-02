const ipcMain = require('electron').ipcMain;
const fs = require('fs');

const electron = require('electron');
// Module to control application life.
const {app} = electron;
// Module to create native browser window.
const {BrowserWindow} = electron;

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
  createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1500, height: 1000, 'min-height': 700});

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html')

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
    printWindow = null;
  })
}

/*
  the below should go in their own folders and be required
*/
var data;
ipcMain.on('ignite-print', (event, arg) => {
  printWindow = new BrowserWindow({width: 650, height: 700, 'min-height': 700, 'resizable': false, icon: 'tulip-logo.ico'});
  printWindow.loadURL('file://' + __dirname + '/print.html');
  data = arg;
  printWindow.on('closed', () => {
    printWindow = null
  })

});

//listens for the browser window to say it's ready to print
ipcMain.on('print-launched', (event, arg) => {
  event.sender.send('print-data', data);
});

// NOTE this is about as robust as a wet paper bag and fails just as gracefully
ipcMain.on('print-pdf', (event, arg) => {
  var size = arg.opts.pageSize;
  if(arg.opts.pageSize != 'Letter' && arg.opts.pageSize != 'A5'){
    size = 'Roll'
  }
  var filename = arg.filepath.replace('.tlp', size + '.pdf')
  printWindow.webContents.printToPDF(arg.opts, (error, data) => {
    if (error) throw error;
    fs.writeFile(filename, data, (error) => {
      if (error)
        throw error;
      printWindow.close();
    });
  });
});

//listens for the browser window to ask for the documents folder
ipcMain.on('get-documents-path', (event, arg) => {
  event.sender.send('documents-path', app.getPath('documents'));
});
