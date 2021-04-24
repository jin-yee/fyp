const { app, BrowserWindow, ipcMain, webContents } = require('electron');
const path = require('path');
const os = require('os')
const { pfd, epfdCalculator } = require('../js/utils/epfdCalculator')
const { Worker, isMainThread, workerData, parentPort } = require('worker_threads')

//set env
process.env.NODE_ENV = 'development'
const isDev = process.env.NODE_ENV === 'development' ? true : false

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    }
  });

  //make it fullscreen
  mainWindow.fullScreen = mainWindow.isFullScreen ? true : false;

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // Open the DevTools.
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Register ipc event here
  ipcMain.on('epfd-send', (event, arg) => {
    const newArg = Object.assign({ appPath: app.getAppPath() }, arg)
    return new Promise((resolve, reject) => {
      const worker = new Worker('./src/process/subprocess.js', {
        workerData : newArg
      });
      worker.on('message', (value) => {
        mainWindow.webContents.send('epfd-reply', {message :'done'})
        resolve()
      })
      worker.on('error', reject)
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`))
      })
    })
  })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.