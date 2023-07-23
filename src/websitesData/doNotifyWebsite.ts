import {WebsiteData} from "../../browserViews/js/websiteData";
import {i18n} from "../i18next";
import {sendNotification} from "../../classes/notify";
import electron from "electron";
import {settings} from "../../main";

export async function doNotifyWebsite(website: string, websiteData: WebsiteData) {
	const i18ex = await i18n;

	const labelArray: string[] = [];
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