import path from "path";
import * as electron from "electron";

export const zToolbox_protocol = 'ztoolbox';
export const resourcePath = !electron.app.isPackaged ? path.normalize(__dirname + '/..') : process.resourcesPath;
export const appIconPath = path.resolve(exports.resourcePath, './images/icon.png');
export const appIconPath_x3 = path.resolve(exports.resourcePath, './images/icon@3x.png');
export const appIcon = electron.nativeImage.createFromPath(exports.appIconPath);
export const browserViewPath = path.resolve(exports.resourcePath, './browserViews/index.html');
export const autoStartArgument = '--z-auto-start';