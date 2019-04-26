const {app, BrowserWindow} = require('electron');

let mainWindow;
function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 400,
		height: 300,
		webPreferences: {
			nodeIntegration: true
		}
	});

	// and load the index.html of the app.
	mainWindow.loadFile('index.html');

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	mainWindow.on('close', function (e) {
		e.preventDefault();
		mainWindow.hide();
		e.returnValue = false;
	});

	// Emitted when the window is closed.
	/*mainWindow.on('closed', function (e) {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})*/
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createWindow()
});





const Events = require('events'),
	classUtils = require('class-utils')
;

/**
 *
 * @extends Map
 * @implements NodeJS.Events
 * @inheritDoc
 */
class Settings extends Map {
	/**
	 * @inheritDoc
	 */
	constructor(storagePath) {
		super();

		this.storagePath = storagePath;

		let settings = null;
		try {
			settings = JSON.parse(Settings._fs.readFileSync(storagePath, 'utf8'));
		} catch (e) {
			console.error(e)
		}

		if (settings !== null) {
			for (let settingsKey in settings) {
				if (settings.hasOwnProperty(settingsKey)) {
					super.set(settingsKey, settings[settingsKey]);
				}
			}
		} else {
			// Default settings
			super.set("quality", "best");
			super.set("clipboardWatch", false);
			this._save();
		}
	}

	static get _fs() {
		delete Settings._fs;
		// noinspection JSUnresolvedVariable
		return Settings._fs = require('fs');
	}

	/**
	 *
	 * @private
	 */
	_save() {
		try {
			Settings._fs.writeFileSync(this.storagePath, JSON.stringify(this.toJSON()), "utf8");
		} catch (e) {
			console.error(e)
		}
	}

	/**
	 * @inheritDoc
	 */
	set(key, value) {
		const oldValue = this.get(key);
		super.set(key, value);
		this.emit('change', oldValue, value);
		this._save();
	}

	/**
	 * @inheritDoc
	 */
	clear() {
		super.clear();
		this.emit('clear');
		this._save();
	}

	/**
	 *
	 * @return {JSON}
	 */
	toJSON() {
		const json = {};
		this.forEach((value, key) => {
			json[key] = value;
		});
		return json
	}
}
classUtils.inherit(Settings, Events, []);





const { spawn } = require('child_process'),
	{ Menu, Tray, ipcMain } = require('electron')
;

const {Clipboard} = require('./Clipboard'),
	urlRegexp = /https?:\/\/*/,
	clipboard = new Clipboard(5000, false)
;

const getSelectedMenu = () => {
	let checked = null;

	contextMenu.items.forEach(menuItem => {
		if (menuItem.checked === true) {
			checked = menuItem
		}
	});

	return checked.value || checked.label;
};

function openStreamlink() {
	const selected = getSelectedMenu().trim(),
		clipboardText = clipboard.text
	;

	let url = null;
	if (urlRegexp.test(clipboardText)) {
		try {
			url = new URL(clipboard.text);
		} catch (e) {
			console.error(e)
		}
	}

	if (url == null) {
		tray.displayBalloon({
			title: 'Erreur',
			content: 'Pas d\'url dans le presse-papier'
		})
	} else {
		// TODO Confirm notification
		spawn('streamlink', [url.toString(), selected], {
			detached: true,
			stdio: 'ignore',
			env: process.env
		})
			.on('error', function (e) {
				console.error(e);
				tray.displayBalloon({
					title: 'Erreur',
					content: 'Erreur lors du lancement de streamlink'
				})
			})
			.unref();
	}
}

function toggleWindow() {
	if (mainWindow == null) {
		createWindow();
		return;
	}

	if (mainWindow.isVisible()) {
		mainWindow.hide();
	} else {
		mainWindow.show();
	}
}

let tray = null;
let contextMenu = null;
app.on('ready', () => {
	const path = require('path'),
		settings = new Settings(path.resolve(app.getPath('userData'), './settings.json'))
	;


	tray = new Tray(path.resolve(__dirname, './icon_128.png'));
	tray.setToolTip('Ceci est mon application.');

	contextMenu = Menu.buildFromTemplate([
		{
			label: 'Ouvrir la fenêtre',
			type: 'normal',
			click() {
				toggleWindow()
			}
		},

		{
			label: 'Ouvrir streamlink', type: 'normal', click() {
				openStreamlink()
			}
		},

		{type: 'separator'},

		{
			label: 'Observer presse-papier',
			type: 'checkbox',
			checked: settings.get('clipboardWatch'),
			click() {
				settings.set('clipboardWatch', !settings.get('clipboardWatch'));
				this.checked = settings.get('clipboardWatch');
				clipboard.toggle(settings.get('clipboardWatch'));
			}
		},

		{type: 'separator'},

		{label: 'Pire', type: 'radio', value: "worst"},
		{label: 'Meilleure', type: 'radio', value: "best"},
		{label: 'Source', type: 'radio', value: "source"},

		{type: 'separator'},

		{label: 'Exit', type: 'normal', role: 'quit'}
	]);

	contextMenu.items.forEach(menuItem => {
		const value = menuItem.value || menuItem.label;
		if (menuItem.type === "radio" && settings.get("quality") === value) {
			menuItem.checked = true;
		}
	});

	const getSelected = () => {
		let checked = null;

		contextMenu.items.forEach(menuItem => {
			if (menuItem.checked === true) {
				checked = menuItem
			}
		});

		return checked.value || checked.label;
	};

	contextMenu.addListener("menu-will-close", function () {
		settings.set("quality", getSelected())
	});

	tray.setContextMenu(contextMenu);



	ipcMain.on('openStreamlink', e => {
		openStreamlink();
		e.returnValue = true
	});
	tray.addListener("click", openStreamlink);
	tray.addListener("double-click", toggleWindow);

	clipboard.toggle(settings.get('clipboardWatch'));
	clipboard.on('text', (clipboardText) => {
		if (urlRegexp.test(clipboardText)) {
			openStreamlink();
		}
	})
});
