const asar = require("asar");
const zipper  = require("zip-local");
const electron = require('electron');
// Module to control application life.
const app = electron.app;

const installPath = app.getAppPath();

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;

const path = require('path');
const url = require('url');
const fs = require('fs');
const del = require('del');

//slax.wrapFsWithAsar(require('fs'));

var extractSlaxFile = function(slaxFileName,slaxAppDir) {
    function ensureAppDir() {
        if (fs.existsSync(slaxAppDir)) {
            del.sync([slaxAppDir + '/**/*'], {
                force: true
            });       
            fs.rmdirSync(slaxAppDir);
        }
        fs.mkdirSync(slaxAppDir);
    }

    try {
        ensureAppDir();
        zipper.sync.unzip(slaxFileName).save(slaxAppDir);
    } catch (e) {
        console.log("The slax file is not a zipped file? extract as a asar file");
        ensureAppDir();
        asar.extractAll(slaxFileName,slaxAppDir);
    }
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let exeFileName,
    slarAppFileName,
    slarAppFileExt,
    slarAppName,
    slarAppDir,
    mainWindow;

slarAppFileName = process.argv[1];
if (slarAppFileName) {
    if (slarAppFileName.indexOf("main.js")> -1) {
        slarAppFileName = process.argv[2];
    }
}
//console.log("slarAppFileName:" + slarAppFileName);
if (!slarAppFileName) {
    dialog.showErrorBox("Error","Please specify a skylark application!");
    app.quit();
    return ;
}


exeFileName = process.argv[0];
//console.log("exeFileName:" + exeFileName);


slarAppFileExt = path.extname(slarAppFileName);
//console.log("slarAppFileExt:" + slarAppFileExt);
if (slarAppFileExt !== ".slax") {
    dialog.showErrorBox("Error","The skylark application file extension should be .slax!");
    app.quit();
    return ;
}

slarAppName = path.parse(slarAppFileName).name;
//console.log("slarAppName:" + slarAppName);

slarAppDir = path.resolve(path.dirname(exeFileName)+"/.cache/apps/" + slarAppName);
//console.log("slarAppDir:" + slarAppDir);

extractSlaxFile(path.resolve(slarAppFileName),slarAppDir);

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1080,
        height: 920,
        webPreferences: {
            plugins: true,
            nodeIntegration: false
        }
    })

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
        pathname: slarAppDir + '/index.html',
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
