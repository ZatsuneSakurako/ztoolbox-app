import {VersionState} from "../../../classes/bo/versionState";
import {WebsiteData} from "../websiteData";
import {Dict} from "./Dict";

export interface IData {
	main_input_type: string;
	menu: string;
	message: string;
	processArgv: string[]; // NodeJS.Process.argv
	versions: Dict<string>; // NodeJS.ProcessVersions;
	internetAddress: string | null;
	websitesData: {websiteName: string, websiteData: WebsiteData}[];
	wsClientNames: string[];
	versionState: VersionState | null;
}