import {Tray} from "electron";

let tray: Tray | null = null;
export function newTray(...args:ConstructorParameters<typeof Tray>) {
	return tray = new Tray(...args);
}
export function getTray() {
	return tray;
}
