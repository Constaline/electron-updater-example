// This is free and unencumbered software released into the public domain.
// See LICENSE for details

const {app, BrowserWindow, Menu, protocol, ipcMain} = require('electron');
const log = require('electron-log');
const {autoUpdater} = require("electron-updater");

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('App starting...');

//-------------------------------------------------------------------
// Define the menu
//
// THIS SECTION IS NOT REQUIRED
//-------------------------------------------------------------------
let template = []
if (process.platform === 'darwin') {
  // OS X
  const name = app.getName();
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'About ' + name,
        role: 'about'
      },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click() { app.quit(); }
      },
    ]
  })
}


//-------------------------------------------------------------------
// Open a window that displays the version
//
// THIS SECTION IS NOT REQUIRED
//
// This isn't required for auto-updates to work, but it's easier
// for the app to show a window than to have to click "About" to see
// that updates are working.
//-------------------------------------------------------------------
let win;

function sendStatusToWindow(text) {
  log.info(text);
  win.webContents.send('message', text);
}
function createDefaultWindow() {
  win = new BrowserWindow({
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true
    },
  });
  win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });
  win.loadURL(`file://${__dirname}/version.html#v${app.getVersion()}`);
  return win;
}

/**
 * autoUpdater
 */
// 禁用自动下载，自动下载会与 autoUpdater.downloadUpdate 冲突
autoUpdater.autoDownload = false;
// 禁用自动安装，自动安装会与 autoUpdater.quitAndInstall 冲突
autoUpdater.autoInstallOnAppQuit = false;
// 检查更新事件
autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
// 有更新事件
autoUpdater.on('update-available', (info) => {
  console.log('===============update-available', info);
  sendStatusToWindow('Update available.' + JSON.stringify(info));
  autoUpdater.downloadUpdate()
})
// 没有更新事件
autoUpdater.on('update-not-available', (info) => {
  console.log('===============update-not-available', info);
  sendStatusToWindow('Update not available.');
})
// 更新出错事件
autoUpdater.on('error', (err) => {
  console.log('===============err-in-updater', err);
  sendStatusToWindow('Error in auto-updater. ' + err);
})
// 更新进度事件
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
// 更新下载完成事件
autoUpdater.on('update-downloaded', (info) => {
  console.log('===============update-downloaded', info);
  sendStatusToWindow('Update downloaded' + JSON.stringify(info));
  setTimeout(() => {
    autoUpdater.quitAndInstall();
  }, 2000); 
});


app.on('ready', function() {
  // Create the Menu
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  createDefaultWindow();

  // 触发检查更新
  autoUpdater.checkForUpdates()
});

app.on('window-all-closed', () => {
  app.quit();
});
