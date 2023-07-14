import {IFolderItem, IJsonWebsiteData, INotificationState} from "./bo/websiteData.js";
import {JsonSerialize} from "../../classes/JsonSerialize.js";

export * from "./bo/websiteData.js";
export class WebsiteData implements JsonSerialize<IJsonWebsiteData> {
	public count: number;
	public websiteIcon: string;
	public logged?: boolean;
	public loginId?: string;
	public href?: string;
	public notificationState: INotificationState;
	public folders: Map<string, IFolderItem>;
	constructor() {
		this.notificationState = {
			count: 0,
			logged: false
		};
		this.count = 0;
		this.folders = new Map();
		this.websiteIcon = '';
		this.logged = undefined;
		this.loginId = undefined;
		this.href = undefined;
	}

	fromJSON(data: IJsonWebsiteData) {
		if ('notificationState' in data) {
			this.notificationState = {
				count: data.notificationState.count !== undefined ? data.notificationState.count : 0,
				logged: data.notificationState.logged !== undefined ? data.notificationState.logged : false
			};
		} else {
			this.notificationState = {
				count: 0,
				logged: false
			};
		}

		this.count = data.count !== undefined ? data.count : 0;
		// noinspection SuspiciousTypeOfGuard
		if (typeof this.count === 'string') {
			const count = parseInt(this.count);
			if (!isNaN(count)) {
				this.count = count;
			}
		}

		this.count = data.count !== undefined ? data.count : 0;
		this.folders = new Map(data.folders ?? []);
		this.websiteIcon = data.websiteIcon ?? '';
		this.logged = data.logged !== undefined ? data.logged : false;
		this.loginId = data.loginId ?? '';
		this.href = data.href ?? '';
	}

	toJSON(): IJsonWebsiteData {
		return {
			notificationState: JSON.parse(JSON.stringify(this.notificationState)),
			count: this.count,
			folders: [...this.folders.entries()],
			websiteIcon: this.websiteIcon,
			logged: this.logged,
			loginId: this.loginId,
			href: this.href,
		}
	}
}