import JSON5 from 'json5';
import {WebsiteApi} from "../WebsiteApi.js";
import {Dict} from "../../../browserViews/js/bo/Dict.js";
import {WebsiteData} from "../../../browserViews/js/websiteData.js";

export class DeviantArt implements WebsiteApi {
	// Old data url dataURL:"http://www.deviantart.com/notifications/watch",
	dataURL= 'https://www.deviantart.com/watch/deviations'
	defaultFavicon= 'https://www.deviantart.com/favicon.ico'
	getViewURL(websiteState:WebsiteData) {
		if (websiteState.count > 0) {
			return this.dataURL;
		} else if (websiteState.logged !== null && websiteState.logged && websiteState.loginId !== "") {
			return `https://www.deviantart.com/${websiteState.loginId}`;
		} else if (websiteState.logged !== null && websiteState.logged === false) {
			return this.getLoginURL; // dA will redirect it to https://www.deviantart.com/users/login?ref=*
		} else {
			return "https://www.deviantart.com/";
		}
	}

	/**
	 * dA will redirect it to https://www.deviantart.com/users/login?ref=*
	 */
	getLoginURL= "https://www.deviantart.com/watch/deviations"

	getData(websiteData:WebsiteData, rawHtml:string): null|void {
		const reg = /window.__INITIAL_STATE__\s*=\s*JSON.parse\(["'](.*)["']\)/ig;

		const rawInitialData = rawHtml.match(reg);

		if (!rawInitialData || rawInitialData.length <= 0) {
			return null;
		}

		let initialData : any|null = reg.exec(rawInitialData[0]);
		if (!initialData || initialData.length !== 2) {
			return null;
		}

		try {
			/*
			 * Double JSON.parse
			 * 1st to unescape \" ....
			 * 2nd to get the object
			 */
			initialData = JSON5.parse(JSON5.parse(`"${initialData[1]}"`));
		} catch (e) {
			console.error(e);
		}
		console.debug('initialData', initialData);
		if (!initialData) {
			return null;
		}

		if (!initialData.hasOwnProperty('@@publicSession')) {
			return null;
		}

		const data = initialData['@@publicSession'];
		if (!data.hasOwnProperty('isLoggedIn') || !data.hasOwnProperty('user') || !data.hasOwnProperty('counts')) {
			console.error('Missing data in @@publicSession');
			return null;
		}

		let count = 0;

		websiteData.count = 0;
		websiteData.folders.clear();
		websiteData.logged = data.isLoggedIn;
		websiteData.loginId = data.user.username;
		websiteData.websiteIcon = this.defaultFavicon;

		/**
		 * @type {number|null}
		 */
		let deviationCount = null;
		if ('@@entities' in initialData && 'deviation' in initialData['@@entities']) {
			deviationCount = 0;

			// noinspection JSUnusedLocalSymbols
			for (const [id, data] of Object.entries(<Dict<any>>initialData['@@entities'].deviation)) {
				if (data.type === 'tier') continue;
				deviationCount += 1;
			}
		}

		if (!initialData.hasOwnProperty('@@streams')) {
			for (let folderName in data.counts) {
				if (data.counts.hasOwnProperty(folderName)) {
					let folderCount : number = data.counts[folderName];
					if (Number.isNaN(folderCount)) {
						continue;
					}

					if (['points', 'cart'].includes(folderName)) {
						continue;
					}

					if (deviationCount !== null && folderName === 'watch') {
						folderCount = deviationCount;
					}

					count += folderCount;
					websiteData.folders.set(folderName, {
						'folderCount': folderCount,
						'folderName': folderName
					});
				}
			}
		} else {
			console.debug('@@streams', initialData['@@streams']);
			const streams : Dict<any> = initialData['@@streams'];
			for (let [name, item] of Object.entries(streams)) {
				if (['NETWORKBAR_RECOMMENDED_GROUPS', 'NETWORKBAR_WATCHED_GROUPS'].includes(name.toUpperCase())) continue;

				const folderName = item?.streamParams?.notificationType ?? item?.streamParams?.requestEndpoint;
				let folderCount = item.items.length;

				if (deviationCount !== null && folderName === 'dyw/deviations') {
					folderCount = deviationCount;
				}

				console.info(folderName, folderCount);

				count += folderCount;
				websiteData.folders.set(folderName, {
					'folderCount': folderCount,
					'folderName': folderName
				});
			}
		}

		websiteData.count = count;
		websiteData.href = this.getViewURL(websiteData);
	}
}
