import {VersionState} from "../../../classes/bo/versionState";
import {WebsiteData} from "../websiteData";

export interface IData {
	main_input_type: string;
	menu: string;
	message: string;
	versions: NodeJS.ProcessVersions;
	internetAddress: string | null;
	websitesData: {websiteName: string, websiteData: WebsiteData}[];
	wsClientNames: string[];
	versionState: VersionState | null;
}