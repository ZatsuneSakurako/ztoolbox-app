const path = require('path'),
	{app, BrowserWindow, nativeImage} = require('electron'),

	resourcePath = (process.env.NODE_ENV === 'development')? __dirname : process.resourcesPath,

	appIconPath = path.resolve(resourcePath, './images/icon.png'),
	appIconPath_x3 = path.resolve(resourcePath, './images/icon@3x.png'),
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
	mainWindow.loadFile(path.resolve(resourcePath, './index.html'))
		.catch(console.error)
	;

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





const { Menu, Tray, ipcMain } = require('electron');

const {Clipboard} = require('./classes/Clipboard'),
	{notify} = require('./classes/notify')(appIconPath_x3),
	{Settings} = require('./classes/Settings'),
	{Streamlink} = require('./classes/Streamlink'),
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

async function openStreamlink(useConfirmNotification=true) {
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
			title: 'Erreur',
			message: 'Pas d\'url dans le presse-papier'
		})
			.catch(console.error)
		;
	} else {
		const availableQualities = await Streamlink.getQualities(url)
			.catch(console.error)
		;

		if (availableQualities.length === 0) {
			notify({
				title: 'Information',
				message: 'Vérifiez l\'url (flux en ligne, qualités, ...)'
			})
				.catch(console.error)
			;
			return;
		}

		if (useConfirmNotification !== false) {
			try {
				notify({
					title: 'Lien détecté',
					message: 'Cliquer pour ouvrir le lien avec streamlink'
				})
					.then(() => {
						Streamlink.open(url, selected)
							.catch(console.error)
						;
					})
			} catch (e) {}
		} else {
			Streamlink.open(url, selected)
				.catch(console.error)
			;
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
				openStreamlink(false)
					.catch(console.error)
				;
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
		openStreamlink(false)
			.catch(console.error)
		;
		e.returnValue = true
	});
	tray.addListener("click", () => {
		if (clipboard.isEnabled === true) {
			toggleWindow()
		} else {
			openStreamlink(false)
				.catch(console.error)
			;
		}
	});
	tray.addListener("double-click", toggleWindow);

	clipboard.toggle(settings.get('clipboardWatch'));
	clipboard.on('text', clipboardText => {
		if (urlRegexp.test(clipboardText)) {
			openStreamlink(true)
				.catch(console.error)
			;
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
