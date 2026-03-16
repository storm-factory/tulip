const { contextBridge, ipcRenderer } = require("electron");
const fs = require('fs');
const { dialog } = require('@electron/remote');
const { randomUUID } = require('crypto');
const Sentry = require("@sentry/electron/renderer");

const isDev = process.env.APP_IS_DEV;

console.log(isDev ? 'Renderer running in development' : 'Renderer running in production');
if (!isDev) {
    Sentry.init({
        dsn: "https://d5e95e1373931cff30184a1e7d504619@o4508879179284480.ingest.de.sentry.io/4508880154918992",
        integrations: [],
        tracesSampleRate: 1.0,
    });
    Sentry.setUser({ ip_address: '0.0.0.0' });
}

contextBridge.exposeInMainWorld("globalNode", {
    dialog: () => {
        return dialog;
    },
    confirmAction: (options) => ipcRenderer.invoke('dialog:showMessageBox', options),
    uint8ArrayToBase64: (uint8Array) => Buffer.from(uint8Array).toString('base64'),
    printToPdf: (data) => {
        return ipcRenderer.invoke('print-pdf', data);
    },
    fs: {
        ...fs,
        readdirSync: (dir) => {
            return fs.readdirSync(dir);
        },
        readFile: fs.readFile.bind(fs)
    },
    ipcRenderer: {
        ...ipcRenderer,
        on: ipcRenderer.on.bind(ipcRenderer),
        send: ipcRenderer.send.bind(ipcRenderer),
        removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
    },
    getAppPath: () => ipcRenderer.sendSync("get-app-path"),
    getVersion: () => ipcRenderer.sendSync('get-app-version'),
    randomUUID: () => {
        return randomUUID();
    },
    sendChangelogResult: (result) => ipcRenderer.send('changelog-result', result),
    setCoords: (data) => ipcRenderer.send('streetview:set-coords', data),
});

contextBridge.exposeInMainWorld("Sentry", {
    captureException: (error) => Sentry.captureException(error),
});
