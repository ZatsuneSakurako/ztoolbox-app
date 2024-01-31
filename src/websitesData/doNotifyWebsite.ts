import {WebsiteData} from "../../browserViews/js/websiteData.js";
import {i18n} from "../i18next.js";
import {settings} from "../../main.js";

export interface IDoNotifyWebsiteResult {
	website: string
	message: string
	href?: string
}
export async function doNotifyWebsite(website: string, websiteData: WebsiteData): Promise<IDoNotifyWebsiteResult|void> {
	const i18ex = await i18n;

	let message : IDoNotifyWebsiteResult|void = undefined;
	if (!websiteData.logged) {
		const oldLoggedState = websiteData.notificationState.logged;
		if (oldLoggedState || oldLoggedState === undefined) {
			message = {
				website,
				message: i18ex('websitesData.website_not_logged', {'website': website}),
				href: websiteData.href
			};
		}
		websiteData.notificationState.logged = !!websiteData.logged;
	} else if (websiteData.notificationState.count === null || websiteData.count > websiteData.notificationState.count) {
		if (settings.getBoolean('notify_checkedData')) {
			message = {
				website,
				message: i18ex('websitesData.count_new_notif', {'count': websiteData.count}),
				href: websiteData.href
			};
		}
	} else if (settings.getBoolean('notify_all_viewed') && websiteData.count === 0 && websiteData.notificationState.count > 0) {
		message = {
			website,
			message: i18ex('websitesData.all_viewed'),
			href: websiteData.href
		};
	}

	websiteData.notificationState.count = websiteData.count;
	if (message && websiteData.href) {
		return message;
	}

	return;
}