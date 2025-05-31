import * as path from "path";
import * as electron from "electron";

const __dirname = import.meta.dirname;

export const zToolbox_protocol = 'ztoolbox';
export const appRootPath = path.normalize(__dirname + '/..');
export const resourcePath = !electron.app.isPackaged ? appRootPath : process.resourcesPath;
export const appIconPath = path.resolve(resourcePath, './images/icon.png');
export const appIconPath_x3 = path.resolve(resourcePath, './images/icon@3x.png');
export const appIcon = electron.nativeImage.createFromPath(appIconPath);
export const browserViewPath = path.resolve(resourcePath, './browserViews/index.html');
export const autoStartArgument = '--z-auto-start';
export const gitMainAddress = 'ZatsuneNoMokou/ztoolbox-app.git';
export const gitExtensionAddress = 'ZatsuneNoMokou/ztoolbox.git';
export const appExtensionPath = path.normalize(`${appRootPath}/ztoolbox`);
