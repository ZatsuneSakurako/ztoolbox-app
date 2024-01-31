import {ZClipboard} from "../classes/ZClipboard.js";

export const clipboard = new ZClipboard(5000, false);
clipboard.on('text', (clipboardText:string) => {
	//
});
