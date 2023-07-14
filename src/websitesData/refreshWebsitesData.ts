import {IJsonWebsiteData} from "../../browserViews/js/bo/websiteData";
import {ZAlarm} from "../../classes/ZAlarm";
import {settings} from "../../main";
import {BrowserWindow, ipcMain} from "electron";
import {websitesData, websitesDataLastRefresh} from "../../classes/Settings";
import {JsonSerialize} from "../../classes/JsonSerialize";
import {WebsiteData} from "../../browserViews/js/websiteData";
import {setBadge} from "../../classes/windowManager";
import {io, remoteSocket} from "../../classes/chromeNative";
import {Dict} from "../../browserViews/js/bo/Dict";
import {doNotifyWebsite} from "./doNotifyWebsite";


function _getWebsitesData(socket: remoteSocket): Promise<Dict<IJsonWebsiteData>> {
	return new Promise((resolve, reject) => {
		socket.emit('getWebsitesData', function (response) {
			if (response.error === false) {
				resolve(response.result);
			} else {
				reject('Error : ' + response.error);
			}
		});
	});
}



export let zAlarm_refreshWebsites : ZAlarm|null = null;
export function refreshWebsitesInterval() : void {
	const checkDelay = settings.getNumber('check_delay') ?? 5;
	if (zAlarm_refreshWebsites) {
		zAlarm_refreshWebsites.cronOrDate = `*/${checkDelay} * * * *`;
	} else {
		zAlarm_refreshWebsites = ZAlarm.start(`*/${checkDelay} * * * *`, refreshWebsitesData);
	}
}



ipcMain.handle('refreshWebsitesData', function () {
	refreshWebsitesData()
		.catch(console.error)
	;
});
export async function refreshWebsitesData() : Promise<boolean> {
	const lastRefresh = settings.getDate(websitesDataLastRefresh);
	if (!!lastRefresh && Date.now() - lastRefresh.getTime() < 60 * 1000) {
		console.warn('Less than one minute, not refreshing');
		return false;
	}


	const currentRefresh = new Date();
	settings.set(websitesDataLastRefresh, currentRefresh);
	refreshWebsitesInterval();


	const sockets = await io.fetchSockets();

	let targetSocket : remoteSocket|null = null;
	for (let client of sockets) {
		if (client.data.sendingWebsitesDataSupport === true) {
			targetSocket = client;
			break;
		}
	}
	if (!targetSocket) return false;


	const currentData = settings.getObject<Dict<IJsonWebsiteData>>(websitesData) ?? {};
	const websiteData = await _getWebsitesData(targetSocket),
		data : Dict<JsonSerialize<IJsonWebsiteData>> = {},
		promises : Promise<void>[] = []
	;
	let count : number = 0;
	for (let [name, raw] of Object.entries(websiteData)) {
		if (!raw) continue;

		const newInstance = new WebsiteData();

		const currentNotificationState = currentData[name]?.notificationState;
		if (currentNotificationState) {
			raw.notificationState = currentNotificationState
		}

		newInstance.fromJSON(raw);
		data[name] = newInstance;

		promises.push(
			doNotifyWebsite(name, newInstance)
				.catch(console.error)
		);

		count += newInstance.count;
	}

	await Promise.allSettled(promises);

	setBadge(count);
	settings.set<IJsonWebsiteData>(websitesData, data);


	for (let browserWindow of BrowserWindow.getAllWindows()) {
		browserWindow.webContents.send('websiteDataUpdate', websiteData, currentRefresh);
	}

	return true;
}
