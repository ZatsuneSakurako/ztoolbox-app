import path from "path";
import * as electron from "electron";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const zToolbox_protocol = 'ztoolbox';
export const resourcePath = !electron.app.isPackaged ? path.normalize(__dirname + '/..') : process.resourcesPath;
export const appIconPath = path.resolve(resourcePath, './images/icon.png');
export const appIconPath_x3 = path.resolve(resourcePath, './images/icon@3x.png');
export const appIcon = electron.nativeImage.createFromPath(appIconPath);
export const browserViewPath = path.resolve(resourcePath, './browserViews/index.html');
export const autoStartArgument = '--z-auto-start';