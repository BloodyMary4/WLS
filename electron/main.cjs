// WLS Desktop — Electron main process
// Загружает собранный фронтенд (dist/) в оконном режиме.
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");

const isDev = !!process.env.WLS_DEV;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: "WLS — Warhammer Life Simulator",
    backgroundColor: "#0b0b0f",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:3000/");
  } else {
    win.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  // Внешние ссылки открывать в системном браузере, а не внутри приложения
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
