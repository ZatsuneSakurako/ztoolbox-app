const path = require('path'),
	{app, BrowserWindow, nativeImage} = require('electron'),

	appIconPath = path.resolve(__dirname, './icon.png'),
	appIconPath_x3 = path.resolve(__dirname, './icon@3x.png'),
	appIcon = nativeImage.createFromPath(appIconPath)
;

let mainWindow;
function createWindow() {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		width: 400,
		height: 300,
		icon: appIcon,
		webPreferences: {
			nodeIntegration: true
		}
	});

	// and load the index.html of the app.
	mainWindow.loadFile('index.html');

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	// if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createWindow()
});





const {EventEmitter} = require('events'),
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
		this.emit('change', key, oldValue, value);
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
// https://www.npmjs.com/package/class-utils
classUtils.inherit(Settings, EventEmitter, []);

const notifier = require('node-notifier');
/**
 *
 * @param {Object} options
 * @param {String} options.title
 * @param {String} options.message
 * @param {String} [options.icon]
 * @param {Boolean} [options.sound]
 * @return {Promise<*>}
 */
function notify(options) {
	return new Promise((resolve, reject) => {
		if (options === null || typeof options !== 'object') {
			reject('WrongArgument');
			return;
		}

		if (options.hasOwnProperty('icon') === false || typeof options.icon !== 'string') {
			options.icon = appIconPath_x3;
		}
		options.wait = true;
		notifier.notify(options, function (error, response) {
			if (!!error) {
				reject(error);
			} else if (!(typeof response === 'string' && response.indexOf('clicked'))) {
				resolve(response);
			}
		})
			.on('click', () => {
				resolve('click');
			})
			.on('timeout', () => {
				reject('timeout');
			})
	})
}





const { exec } = require('child_process'),
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

	return checked.id || checked.label;
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
		notify({
			title: 'Mon Appli - Erreur',
			message: 'Pas d\'url dans le presse-papier'
		})
			.catch(console.error)
		;
	} else {
		try {
			notify({
				title: "Mon Appli - Lien détecté",
				message: 'Cliquer pour ouvrir le lien avec streamlink'
			})
				.then(() => {
					exec(`streamlink ${url.toString()} ${selected}`, function (err, stdout, stderr) {
						console.dir(arguments)
					});
				})
		} catch (e) {
		}
	}
}

function toggleWindow() {
	if (mainWindow == null) {
		createWindow();
	}
}

let tray = null;
let contextMenu = null;
// This method will be called when Electron has finished initialization.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	const settings = new Settings(path.resolve(app.getPath('userData'), './settings.json'));



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
			id: 'clipboardWatch',
			label: 'Observer presse-papier',
			type: 'checkbox',
			checked: settings.get('clipboardWatch'),
			click() {
				settings.set('clipboardWatch', !settings.get('clipboardWatch'));
			}
		},

		{type: 'separator'},

		{id: 'worst', label: 'Pire', type: 'radio'},
		{id: 'best', label: 'Meilleure', type: 'radio'},

		{type: 'separator'},

		{label: 'Exit', type: 'normal', role: 'quit'}
	]);

	const getSelected = () => {
		let checked = null;

		contextMenu.items.forEach(menuItem => {
			if (menuItem.checked === true) {
				checked = menuItem
			}
		});

		return checked.id || checked.label;
	};

	contextMenu.addListener("menu-will-close", function () {
		setTimeout(() => {
			settings.set("quality", getSelected())
		})
	});



	tray = new Tray(appIcon);
	tray.setToolTip('Ceci est mon application.');
	tray.setContextMenu(contextMenu);



	ipcMain.on('openStreamlink', e => {
		openStreamlink();
		e.returnValue = true
	});
	tray.addListener("click", openStreamlink);
	tray.addListener("double-click", toggleWindow);

	clipboard.toggle(settings.get('clipboardWatch'));
	clipboard.on('text', clipboardText => {
		if (urlRegexp.test(clipboardText)) {
			openStreamlink();
		}
	});





	const refreshQualityChecked = () => {
		contextMenu.items.forEach(/** @type {Electron.MenuItem} */ menuItem => {
			const value = menuItem.id || menuItem.label;
			if (menuItem.type === "radio" && settings.get("quality") === value) {
				menuItem.checked = true;
			}
		});
	};
	settings.on('change', function (key) {
		switch (key) {
			case 'quality':
				refreshQualityChecked();
				break;
			case 'clipboardWatch':
				contextMenu.getMenuItemById('clipboardWatch').checked = settings.get('clipboardWatch');
				clipboard.toggle(settings.get('clipboardWatch'));
				break;
		}
	});
	refreshQualityChecked();
});
