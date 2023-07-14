import {IJsonWebsiteData} from "../../browserViews/js/bo/websiteData";
import {ZAlarm} from "../../classes/ZAlarm";
import {settings} from "../../main";
import {BrowserWindow, ipcMain, session} from "electron";
import {websitesData, websitesDataLastRefresh} from "../../classes/Settings";
import {JsonSerialize} from "../../classes/JsonSerialize";
import {WebsiteData} from "../../browserViews/js/websiteData";
import {setBadge} from "../../classes/windowManager";
import {Dict} from "../../browserViews/js/bo/Dict";
import {doNotifyWebsite} from "./doNotifyWebsite";
import {websiteApis} from "./platforms";
import {appIcon} from "../../classes/constants";



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
refreshWebsitesInterval();
export async function refreshWebsitesData() {
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
		promises : Promise<void>[] = []
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

		let rawHtml : string|null = null;
		try {
			const response = await websitesDataSession.fetch(api.dataURL);
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

	await Promise.allSettled(promises);

	setBadge(count);
	settings.set<IJsonWebsiteData>(websitesData, websiteData);

	for (let browserWindow of BrowserWindow.getAllWindows()) {
		browserWindow.webContents.send('websiteDataUpdate', websiteData, currentRefresh);
	}

	return true;
}
