import {WebsiteData} from "../../browserViews/js/websiteData.js";
import {settings} from "../init.js";

export interface IDoNotifyWebsiteResult {
	website: string
	message: string
	href?: string
}
export async function doNotifyWebsite(website: string, websiteData: WebsiteData): Promise<IDoNotifyWebsiteResult|void> {
	let message : IDoNotifyWebsiteResult|void = undefined;
	if (!websiteData.logged) {
		const oldLoggedState = websiteData.notificationState.logged;
		if (oldLoggedState || oldLoggedState === undefined) {
			message = {
				website,
				message: `No ${website} account logged`,
				href: websiteData.href
			};
		}
		websiteData.notificationState.logged = !!websiteData.logged;
	} else if (websiteData.notificationState.count === null || websiteData.count > websiteData.notificationState.count) {
		if (settings.getBoolean('notify_checkedData')) {
			message = {
				website,
				message: `${websiteData.count} new notification`,
				href: websiteData.href
			};
		}
	}

	websiteData.notificationState.count = websiteData.count;
	if (message && websiteData.href) {
		return message;
	}

	return;
}
