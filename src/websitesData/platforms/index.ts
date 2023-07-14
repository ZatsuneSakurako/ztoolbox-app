import {WebsiteApi} from "../WebsiteApi";
import {DeviantArt} from "./deviantArt";
import {FreshRss} from "./freshRss";

export const websiteApis = new Map<string, WebsiteApi>();

websiteApis.set('deviantArt', new DeviantArt());
websiteApis.set('freshRss', new FreshRss());
