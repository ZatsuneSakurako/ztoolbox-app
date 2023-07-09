import {IJsonWebsiteData} from "../browserViews/js/bo/websiteData";
import {ZAlarm} from "./ZAlarm";
import {settings} from "../main";
import electron, {BrowserWindow, ipcMain} from "electron";
import {websitesData, websitesDataLastRefresh} from "./Settings";
import {JsonSerialize} from "./JsonSerialize";
import {WebsiteData} from "../browserViews/js/websiteData";
import {setBadge} from "./windowManager";
import {io, remoteSocket, sendNotification} from "./chromeNative";
import {Dict} from "../browserViews/js/bo/Dict";
import {i18n} from "../src/i18next";

async function doNotifyWebsite(website:string, websiteData:WebsiteData) {
	const i18ex = await i18n;

	const labelArray : string[] = [];
	if (websiteData.logged && websiteData.hasOwnProperty('folders')) {
		for (let [name, folderData] of websiteData.folders) {
			let count = folderData.folderCount;
			if (!isNaN(count) && count > 0) {
				let suffix = '';
				if (websiteData.notificationState.count !== null && websiteData.count > websiteData.notificationState.count) {
					suffix = ` (+${websiteData.count - websiteData.notificationState.count})`;
				}
				labelArray.push(`${name}: ${count}${suffix}`);
			}
		}
	}

	if (!websiteData.logged) {
		const oldLoggedState = websiteData.notificationState.logged;
		if (oldLoggedState || oldLoggedState === undefined) {
			sendNotification({
				'title': i18ex('websitesData.website_notif', {'website': website}),
				'message': i18ex('websitesData.website_not_logged', {'website': website})
			})
				.then(notificationResponse => {
					if (notificationResponse?.response === 'click' && websiteData.href) {
						electron.shell.openExternal(websiteData.href);
					}
				})
				.catch(console.error)
			;
		}
		websiteData.notificationState.logged = !!websiteData.logged;
	} else if (websiteData.notificationState.count === null || websiteData.count > websiteData.notificationState.count) {
		if (settings.getBoolean('notify_checkedData')) {
			sendNotification({
				"title": i18ex('websitesData.website_notif', {'website': website}),
				"message": i18ex('websitesData.count_new_notif', {'count': websiteData.count}) + "\n" + labelArray.join("\n"),
			})
				.then(notificationResponse => {
					if (notificationResponse?.response === 'click' && websiteData.href) {
						electron.shell.openExternal(websiteData.href);
					}
				})
				.catch(console.error)
			;
		}
	} else if (settings.getBoolean('notify_all_viewed') && websiteData.count === 0 && websiteData.notificationState.count > 0) {
		sendNotification({
			"title": i18ex('websitesData.website_notif', {'website': website}),
			"message": i18ex('websitesData.all_viewed')
		})
			.then(notificationResponse => {
				if (notificationResponse?.response === 'click' && websiteData.href) {
					electron.shell.openExternal(websiteData.href);
				}
			})
			.catch(console.warn)
		;
	}

	websiteData.notificationState.count = websiteData.count;
}



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
