const { ipcMain, Menu, app, BrowserWindow, dialog } = require('electron');
const remoteMain = require('@electron/remote/main');
const fs = require('fs');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;
var printWindow = null;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  remoteMain.initialize();
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
  const template = [
    {label: "Tulip",
    submenu: [
      { label: "Settings", accelerator: "CmdOrCtrl+,", click: function() { mainWindow.webContents.send('open-settings'); }},
      { type: "separator" },
      { label: "Save", accelerator: "CmdOrCtrl+S", click: function() { mainWindow.webContents.send('save-roadbook'); }},
      { label: "Save As", accelerator: "CmdOrCtrl+Shift+S", click: function() { mainWindow.webContents.send('save-roadbook-as'); }},
      { label: "Open", accelerator: "CmdOrCtrl+O", click: function() { mainWindow.webContents.send('open-roadbook'); }},
      { type: "separator" },
      { label: "Quit", accelerator: "CmdOrCtrl+Q", click: function() { app.quit(); }},
    ]},
    {label: "Edit",
    submenu: [
      { label: "Undo Text", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo Text", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
      { type: "separator" },
      {
        label: "Tracks",
        submenu: [
        { label: "Add Track 360", accelerator: "CmdOrCtrl+1", click: function() { mainWindow.webContents.send('add-track-0'); }},
        { label: "Add Track 45", accelerator: "CmdOrCtrl+2", click: function() { mainWindow.webContents.send('add-track-45'); }},
        { label: "Add Track 90", accelerator: "CmdOrCtrl+3", click: function() { mainWindow.webContents.send('add-track-90'); }},
        { label: "Add Track 135", accelerator: "CmdOrCtrl+4", click: function() { mainWindow.webContents.send('add-track-135'); }},
        { label: "Add Track 180", accelerator: "CmdOrCtrl+5", click: function() { mainWindow.webContents.send('add-track-180'); }},
        { label: "Add Track 225", accelerator: "CmdOrCtrl+6", click: function() { mainWindow.webContents.send('add-track-225'); }},
        { label: "Add Track 270", accelerator: "CmdOrCtrl+7", click: function() { mainWindow.webContents.send('add-track-270'); }},
        { label: "Add Track 315", accelerator: "CmdOrCtrl+8", click: function() { mainWindow.webContents.send('add-track-315'); }},
        { type: "separator" },
        { label: "Set Track HP", accelerator: "CmdOrCtrl+Option+1", click: function() { mainWindow.webContents.send('set-track-hp'); }},
        { label: "Set Track P", accelerator: "CmdOrCtrl+Option+2", click: function() { mainWindow.webContents.send('set-track-p'); }},
        { label: "Set Track PP", accelerator: "CmdOrCtrl+Option+3", click: function() { mainWindow.webContents.send('set-track-pp'); }},
        { label: "Set Track RO", accelerator: "CmdOrCtrl+Option+4", click: function() { mainWindow.webContents.send('set-track-ro'); }},
        { label: "Set Track DCW", accelerator: "CmdOrCtrl+Option+5", click: function() { mainWindow.webContents.send('set-track-dcw'); }},
      ]},
      { type: "separator" },
      { label: "Add Glyph", accelerator: "CmdOrCtrl+Option+G", click: function() { mainWindow.webContents.send('add-glyph'); }},
    ]
    },
    {label: "Io",
    submenu: [
      { label: "Import GPX", accelerator: "CmdOrCtrl+I", click: function() { mainWindow.webContents.send('import-gpx'); }},
      { label: "Export GPX", accelerator: "CmdOrCtrl+E", click: function() { mainWindow.webContents.send('export-gpx'); }},
      { label: "Export OpenRally GPX", click: function() { mainWindow.webContents.send('export-openrally-gpx'); }},
      { label: "Export PDF", accelerator: "CmdOrCtrl+P", click: function() { mainWindow.webContents.send('export-pdf'); }},
	  { label: "Export Lexicon Key", click: function() { mainWindow.webContents.send('export-lexicon'); }},
    ]
    },
    {label: "View",
    submenu: [
      { label: "Reload", accelerator: "CmdOrCtrl+R", click: function() { mainWindow.webContents.send('reload-roadbook'); }},
      { type: "separator" },
      { label: "Toggle Roadbook", accelerator: "CmdOrCtrl+B", click: function() { mainWindow.webContents.send('toggle-roadbook'); }},
      { type: "separator" },
      { label: "Zoom in", accelerator: "CmdOrCtrl+Plus", click: function() { mainWindow.webContents.send('zoom-in'); }},
      { label: "Zoom out", accelerator: "CmdOrCtrl+-", click: function() { mainWindow.webContents.send('zoom-out'); }},
      { type: "separator" },
      {
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click (item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.toggleDevTools()
        }
      },
    ]
    }

  ];

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // Enable @electron/remote for this window
  remoteMain.enable(mainWindow.webContents);

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools()
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
  printWindow = new BrowserWindow({
    width: 650,
    height: 700,
    minHeight: 700,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });
  remoteMain.enable(printWindow.webContents);
  printWindow.loadFile('print.html');
  data = arg;
  printWindow.on('closed', () => {
    printWindow = null
  })

});
ipcMain.on('ignite-lexicon', (event, arg) => {
  printWindow = new BrowserWindow({
    width: 820,
    height: 700,
    minHeight: 700,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });
  remoteMain.enable(printWindow.webContents);
  printWindow.loadFile('lexicon_key.html');
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
ipcMain.on('print-pdf', async (event, arg) => {
  var size = arg.opts.pageSize;
  var sizeName = arg.opts.pageSizeName;
  var filename = arg.filepath.replace('.tlp','_' + sizeName + '.pdf')
  try {
    const data = await printWindow.webContents.printToPDF(arg.opts);
    fs.writeFile(filename, data, async (error) => {
      if (error) {
        console.log('Error writing PDF file. Is ' + filename +' also open in another program?' + error);
        throw error;
      } else {
        printWindow.close();
        await dialog.showMessageBox(mainWindow, {
          message: "Your PDF has been exported to the same directory you saved your roadbook. Gas a la burra!",
          buttons: ['ok']
        });
      }
    });
  } catch (error) {
    console.log('Error converting PDF to HTML' + error + arg.opts);
    throw error;
  }
});

ipcMain.on('print-lexicon-pdf', async (event,arg) => {
	const path = require('path');
	var filename = path.join(path.dirname(arg.filepath),"lexicon-key.pdf")
	console.log('called main.js function ' + filename);
	try {
		const data = await printWindow.webContents.printToPDF(arg.opts);
		fs.writeFile(filename, data, async (error) => {
		  if (error) {
			console.log('Error writing PDF file. Is ' + filename +' also open in another program?' + error);
			throw error;
		  } else {
			  printWindow.close();
			  await dialog.showMessageBox(mainWindow, {
				message: "Your PDF has been exported to the same directory you saved your roadbook. Gas a la burra!",
				buttons: ['ok']
			  });
		  }
		});
	} catch (error) {
		console.log('Error converting PDF to HTML' + error + arg.opts);
		throw error;
	}
});

//listens for the browser window to ask for the documents folder
ipcMain.on('get-documents-path', (event, arg) => {
  event.sender.send('documents-path', app.getPath('documents'));
});
