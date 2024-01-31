import {WebsiteApi} from "../WebsiteApi.js";
import {DeviantArt} from "./deviantArt.js";
import {FreshRss} from "./freshRss.js";

export const websiteApis = new Map<string, WebsiteApi>();

websiteApis.set('deviantArt', new DeviantArt());
websiteApis.set('freshRss', new FreshRss());
