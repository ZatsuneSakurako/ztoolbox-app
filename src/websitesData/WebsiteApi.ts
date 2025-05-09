import {WebsiteData} from "../../browserViews/js/websiteData.js";

export interface WebsiteApi {
	dataURL: string
	defaultFavicon: string
	getViewURL: (state:WebsiteData) => string
	getLoginURL: string
	getData: (websiteData:WebsiteData, rawHtml:string) => null|void
}
