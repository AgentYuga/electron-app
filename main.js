const { app, BrowserWindow, dialog, screen } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width * 1,
    height: height * 1,
    frame: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      spellcheck: false, 
      enableRemoteModule: false,
      additionalArguments: ['--enable-features=WebRTCPipeWireCapturer'],
      autoplayPolicy: 'no-user-gesture-required'
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    fullscreenable: true,
    fullscreen: true,
    focusable: true,
    disableAutoHideCursor: true,
    movable: false,
    alwaysOnTop: true,
  });
  // mainWindow.loadFile('index.html');
  mainWindow.loadURL('https://staging-website.prompthire.in/instruction');

  // Disable right-click context menu
  mainWindow.webContents.on('context-menu', (e) => {
    e.preventDefault();
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Confirm before quitting
  mainWindow.on('close', (e) => {
    e.preventDefault();

    dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'Are you sure you want to quit?',
      icon: path.join(__dirname, 'assets', 'icon.png'),
    }).then((result) => {
      if (result.response === 0) {
        mainWindow.destroy();
        app.quit();
      }
    });
  });

  // Modify the permission handler to be more verbose about audio
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents.getURL();
    if (permission === 'media' || 
        permission === 'microphone' || 
        permission === 'audio') {
      console.log(`Granting permission for: ${permission}`);
      callback(true);
    } else {
      callback(false);
    }
  });

  // Modify the did-finish-load handler to be more robust
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      async function setupMediaDevices() {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });
          
          console.log('Media permissions granted:', stream.getTracks().map(track => track.kind));
          
          // Keep the stream active
          window._mediaStream = stream;
          
          return true;
        } catch (err) {
          console.error('Media permission error:', err);
          return false;
        }
      }
      
      setupMediaDevices().then(success => {
        console.log('Media setup complete:', success);
      });
    `);
  });

  // Add this to handle permission requests
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    if (permission === 'media' || 
        permission === 'microphone' || 
        permission === 'audio') {
      return true;
    }
    return false;
  });

  // // Modify CSP headers to be more specific for your domain
  // mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       'Content-Security-Policy': [
  //         "default-src 'self' https://staging-website.prompthire.in 'unsafe-inline' 'unsafe-eval' data: blob:; " +
  //         "media-src 'self' blob: mediastream: https://staging-website.prompthire.in; " +
  //         "img-src 'self' data: blob: https://staging-website.prompthire.in; " +
  //         "connect-src 'self' https://staging-website.prompthire.in wss://staging-website.prompthire.in; " +
  //         "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://staging-website.prompthire.in;"
  //       ]
  //     }
  //   });
  // });
}

function checkEnvironmentRequirements() {
  // Check if user has multiple monitors
  const screens = screen.getAllDisplays();
  if (screens.length > 1) {
    console.log('Multiple monitors detected');
    return false;
  }
  return true;
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {
  const requirementsMet = checkEnvironmentRequirements();
  if (!requirementsMet) {
    console.log('Environment requirements not met');
    
    // TODO: Add a more user-friendly error message
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      message: 'Multiple monitors are not supported',
      icon: path.join(__dirname, 'assets', 'icon.png'),
    });
    return;
  }
  createWindow();
  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, 'assets', 'icon.png'));
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
