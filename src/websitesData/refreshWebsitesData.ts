import {IJsonWebsiteData} from "../../browserViews/js/bo/websiteData.js";
import {ZAlarm} from "../../classes/ZAlarm.js";
import {settings} from "../../main.js";
import {app, BrowserWindow, ipcMain, session} from "electron";
import {i18n} from "../i18next.js";
import electron from "electron";
import {websitesData, websitesDataLastRefresh} from "../../classes/Settings.js";
import {JsonSerialize} from "../../classes/JsonSerialize.js";
import {WebsiteData} from "../../browserViews/js/websiteData.js";
import {setBadge} from "../../classes/windowManager.js";
import {Dict} from "../../browserViews/js/bo/Dict.js";
import {doNotifyWebsite, IDoNotifyWebsiteResult} from "./doNotifyWebsite.js";
import {websiteApis} from "./platforms/index.js";
import {appIcon} from "../../classes/constants.js";
import {sendNotification} from "../../classes/notify.js";



export let zAlarm_refreshWebsites : ZAlarm|null = null;
export function refreshWebsitesInterval() : void {
	const checkDelay = settings.getNumber('check_delay') ?? 5;
	if (zAlarm_refreshWebsites) {
		zAlarm_refreshWebsites.cronOrDate = `*/${checkDelay} * * * *`;
	} else {
		zAlarm_refreshWebsites = ZAlarm.start(`*/${checkDelay} * * * *`, refreshWebsitesData);
	}
}



async function openLoginUrl(website:string) {
	const api = websiteApis.get(website);
	if (!api) {
		return false;
	}

	const loginWindow = new BrowserWindow({
		height: 800,
		width: 600,
		icon: appIcon,
		show: true,
		darkTheme: true,
		webPreferences: {
			nodeIntegration: false,
			session: session.fromPartition('persist:websites-data', {
				cache: true
			})
		}
	});

	const url = api.getLoginURL;
	await loginWindow.loadURL(url);
	return true;
}
ipcMain.handle('openLoginUrl', function (event, website) {
	return openLoginUrl(website);
});



ipcMain.handle('refreshWebsitesData', function () {
	refreshWebsitesData()
		.catch(console.error)
	;
});
app.whenReady()
	.then(() => {
		refreshWebsitesInterval();
	})
;
export async function refreshWebsitesData() {
	if (!settings.getBoolean('check_enabled')) {
		return;
	}

	const lastRefresh = settings.getDate(websitesDataLastRefresh);
	if (!!lastRefresh && Date.now() - lastRefresh.getTime() < 60 * 1000) {
		console.warn('Less than one minute, not refreshing');
		return false;
	}

	const currentRefresh = new Date();
	settings.set(websitesDataLastRefresh, currentRefresh);
	refreshWebsitesInterval();

	const currentData = settings.getObject<Dict<IJsonWebsiteData>>(websitesData) ?? {},
		websiteData : Dict<JsonSerialize<IJsonWebsiteData>> = {},
		promises : Promise<IDoNotifyWebsiteResult|void>[] = []
	;
	let count : number = 0;
	const websitesDataSession = session.fromPartition('persist:websites-data');
	for (let [website, websiteApi] of websiteApis) {
		const api = websiteApi,
			cookies = await websitesDataSession.cookies.get({url: api.dataURL})
		;

		if (!cookies.length) {
			continue;
		}


		let dataUrl : string|null = null;
		try {
			dataUrl = api.dataURL
		} catch (e) {
			console.error(e);
		}
		if (!dataUrl) {
			continue;
		}


		let rawHtml : string|null = null;
		try {
			const response = await websitesDataSession.fetch(dataUrl);
			rawHtml = await response.text();
		} catch (e) {
			console.error(e);
		}

		if (rawHtml === null) {
			console.warn(`NO_DATA ${website}`);
			continue;
		}

		const newInstance = new WebsiteData(),
			currentWebsiteData = currentData[website]
		;
		if (currentWebsiteData) {
			newInstance.fromJSON(currentWebsiteData);
		}

		const processResult = api.getData(newInstance, rawHtml);
		websiteData[website] = newInstance;
		if (processResult === null) {
			console.warn(`UNEXPECTED_RESULT ${website}`);
		}

		promises.push(
			doNotifyWebsite(website, newInstance)
				.catch(console.error)
		);

		count += newInstance.count;
	}

	const result = (await Promise.allSettled(promises)),
		notificationMessage : IDoNotifyWebsiteResult[] = []
	;

	for (let item of result) {
		if (item.status === 'fulfilled' && !!item.value) {
			notificationMessage.push(item.value);
		}
	}

	if (notificationMessage.length) {
		const i18ex = await i18n;
		sendNotification({
			'title': i18ex('websitesData.website_notif', {
				'websites': notificationMessage
					.map(value => value.website)
					.join(', ')
			}),
			'message': notificationMessage
				.map(value => {
					return notificationMessage.length > 1 ? `${value.website} : ${value.message}` : value.message
				})
				.join('\n')
		})
			.then(notificationResponse => {
				if (notificationResponse?.response === 'click') {
					for (let item of notificationMessage) {
						if (item.href) {
							electron.shell.openExternal(item.href);
						}
					}
				}
			})
			.catch(console.error)
		;
	}

	setBadge(count);
	settings.set<IJsonWebsiteData>(websitesData, websiteData);

	for (let browserWindow of BrowserWindow.getAllWindows()) {
		browserWindow.webContents.send('websiteDataUpdate', websiteData, currentRefresh);
	}

	return true;
}
