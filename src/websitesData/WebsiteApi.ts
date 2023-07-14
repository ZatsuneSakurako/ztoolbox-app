import {WebsiteData} from "../../browserViews/js/websiteData";

export interface WebsiteApi {
	dataURL: string
	defaultFavicon: string
	getViewURL: (state:WebsiteData) => string
	getLoginURL: string
	getData: (websiteData:WebsiteData, rawHtml:string) => null|void
}
