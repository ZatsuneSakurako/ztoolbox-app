import {VersionState} from "../../../classes/bo/versionState";

export interface IData {
	main_input_type: string;
	menu: string;
	message: string;
	versions: NodeJS.ProcessVersions;
	internetAddress: string | null;
	versionState: VersionState | null;
}