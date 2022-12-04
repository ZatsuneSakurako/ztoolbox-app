import {ZClipboard} from "../classes/ZClipboard";

export const clipboard = new ZClipboard(5000, false);
clipboard.on('text', (clipboardText:string) => {
	//
});
