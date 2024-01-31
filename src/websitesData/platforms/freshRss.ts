import {WebsiteApi} from "../WebsiteApi.js";
import {WebsiteData} from "../../../browserViews/js/websiteData.js";
import {settings} from "../../init.js";

export class FreshRss implements WebsiteApi {
	get #freshRssBaseUrl() {
		return settings.getString('freshRss_baseUrl');
	}

	get dataURL() {
		if (this.#freshRssBaseUrl === undefined) {
			throw new Error('NO_FRESH_RSS_BASE_URL');
		}
		return `${this.#freshRssBaseUrl}?a=normal&state=3`;
	}
	defaultFavicon='https://icons.duckduckgo.com/ip2/www.freshrss.org.ico'
	getViewURL() {
		if (this.#freshRssBaseUrl === undefined) {
			throw new Error('NO_FRESH_RSS_BASE_URL');
		}
		return this.#freshRssBaseUrl;
	}
	get getLoginURL() {
		return this.dataURL;
	}

	getData(websiteData:WebsiteData, rawHtml:string): null|void {
		const freshRssBaseUrl = this.#freshRssBaseUrl;
		if (!freshRssBaseUrl) return null;


		const jsonVars = /<script id="jsonVars" type="application\/json">[\s\n]*(.*?)[\s\n]*<\/script>/gmi,
			titleReg = /<title>\((\d+)\).*?<\/title>/gmi,
			usernameReg = /<a class="signout" .*?>.*?\((.*?)\)<\/a>/gmi
		;

		const dataJsonVars = jsonVars.exec(rawHtml),
			dataNbNotifications = titleReg.exec(rawHtml),
			dataUsername = usernameReg.exec(rawHtml)
		;

		websiteData.count = dataNbNotifications ? parseInt(dataNbNotifications[1]) : 0;
		websiteData.folders.clear();
		websiteData.logged = !!dataJsonVars;
		websiteData.loginId = !!dataUsername ? dataUsername[1] : '';
		websiteData.websiteIcon = this.defaultFavicon;
		websiteData.href = this.getViewURL();
	}
}
