export type browsers = "chrome" | "chromium" | "firefox";
export type osList = "darwin" | "win32" | "linux";
export type install_types = 'user' | 'global';
export const browsers : readonly browsers[] = Object.freeze(['chrome', 'chromium', 'firefox']);

export type BrowsersOutput<T> = {
	[key in browsers]: T
}

export type getInstallStatesResult = BrowsersOutput<{ manifestPath: string, path?: string }|false>;
export type installResult = BrowsersOutput<boolean>;