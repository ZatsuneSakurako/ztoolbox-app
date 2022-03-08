// @ts-ignore
import * as classUtils from "class-utils";
import {EventEmitter} from "events";
import * as fs from "fs";
import path from "path";
import debounce from "lodash.debounce";

import {PrimitivesValues, RandomJsonData, SettingConfig, SettingsConfig, SettingValues} from "./bo/settings";
import {resourcePath} from "./constants";
import {app} from "electron";
import Dict = NodeJS.Dict;
require = require("esm")(module/*, options*/);
const settings : SettingsConfig = require(path.normalize(resourcePath + "/browserViews/js/settings/settings")).default;



interface ISettings extends EventEmitter, Map<string, RandomJsonData> {
	get(key:string):RandomJsonData|undefined;

	getString(key:string):string|undefined;
	getNumber(key:string):number|undefined;
	getBoolean(key:string):boolean|undefined;
	getDate(key:string):Date|undefined;

	has(key:string):boolean;
	set(key:string, value:RandomJsonData):this;
	delete(key:string):boolean;
	clear():void;
	toJSON():RandomJsonData;
	// @ts-ignore
	forEach(callbackFn: (value:RandomJsonData, key:string, map:Map<string, RandomJsonData>) => void, thisArgs?:any)
}

export const defaultStorageFilename = '/settings.json';
export const keysStoredInApp = Object.freeze(['storagePath']);
export class Settings extends EventEmitter implements ISettings {
	readonly #defaultStorageDir: string;
	storagePath:string;
	#cache:Map<string,RandomJsonData>|undefined;
	readonly #debouncedSaved:(storagePath:string, data:RandomJsonData) => void;

	/**
	 * @inheritDoc
	 */
	constructor() {
		super();

		this.#defaultStorageDir = path.normalize(app.getPath('userData'));

		const _storagePath = Settings.#loadFile(this.#defaultStoragePath)?.get('storagePath');
		this.storagePath = path.normalize((typeof _storagePath === 'string' && _storagePath.length > 0 ? (_storagePath + defaultStorageFilename ): this.#defaultStoragePath));

		this.#load();
		this.#debouncedSaved = debounce((storagePath:string, data:RandomJsonData) => {
			const clonedData = JSON.parse(JSON.stringify(data));

			if (this.storagePath !== this.#defaultStoragePath) {
				const settings = Settings.#loadFile(this.#defaultStoragePath),
					dataInApp:RandomJsonData = {}
				;

				if (settings) {
					let dataFound:boolean = false;
					for (let key of keysStoredInApp) {
						const value:RandomJsonData|undefined = settings?.get(key);
						if (!!value) {
							dataInApp[key] = value;
							delete clonedData[key];
							dataFound = true;
						}
					}
				}

				Settings.#saveFile(this.#defaultStoragePath, dataInApp);
			}

			const result = Settings.#saveFile(storagePath, clonedData);
			if (result) {
				this.#cache = undefined;
			}
		}, 100, {
			maxWait: 500
		});
	}



	get #defaultStoragePath(): string {
		return path.normalize(`${this.#defaultStorageDir}${defaultStorageFilename}`);
	}



	static #loadFile(filePath:string):Map<string, RandomJsonData>|null {
		let data:RandomJsonData = null;
		try {
			data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		} catch (e) {
			console.error(e)
		}

		if (!data || typeof data !== 'object' || Array.isArray(data)) {
			return null;
		}

		let output = new Map<string, RandomJsonData>();

		delete data.shortcutsWindow;
		for (let [settingsKey, value] of Object.entries(data)) {
			if (value !== undefined) {
				output.set(settingsKey, value);
			}
		}

		return output;
	}

	/**
	 *
	 * @param storagePath
	 * @param data
	 * @return Saved with no error
	 */
	static #saveFile(storagePath:string, data:RandomJsonData):boolean {
		try {
			fs.writeFileSync(storagePath, JSON.stringify(data), "utf8");
			return true;
		} catch (e) {
			console.error(e)
			return false;
		}
	}

	#load():Map<string, RandomJsonData> {
		if (this.#cache !== undefined) {
			return this.#cache;
		}

		const output = Settings.#loadFile(this.storagePath ?? this.#defaultStoragePath)
			??
			new Map<string, RandomJsonData>()
		;

		if (this.storagePath !== this.#defaultStoragePath) {
			// Settings to store in the app data, if another storage path specified
			const data = Settings.#loadFile(this.#defaultStoragePath);
			for (let [key, value] of data ?? new Map()) {
				if (output.has(key)) continue; // avoid overriding data in output map
				output.set(key, value);
			}
		}

		this.#cache = output;
		setTimeout(() => {
			this.#cache = undefined;
		});
		return output;
	}

	#save() {
		this.#debouncedSaved(this.storagePath, this.toJSON());
	}

	get(key: string, useDefault: boolean = false): RandomJsonData | undefined {
		const value = this.#load().get(key);
		if (value === undefined && useDefault) {
			return this.getDefaultValue(key);
		}
		return value;
	}

	has(key: string): boolean {
		const cache = this.#load();
		return cache.has(key);
	}

	getDefaultValues(): SettingsConfig {
		const output : Dict<SettingValues> = {};

		for (const [name, settingConf] of Object.entries(settings)) {
			if (!settingConf || settingConf.type === 'button') continue;
			output[name] = settingConf.value;
		}

		return JSON.parse(JSON.stringify(output));
	}

	getSettingConfig(key:string):SettingConfig|undefined {
		return settings[key];
	}

	getDefaultValue(key: string): RandomJsonData | undefined {
		const settingConf = this.getSettingConfig(key);
		if (!settingConf || settingConf?.type === 'button') return;
		return settingConf.value;
	}

	getArray(key: string, useDefault: boolean = true): PrimitivesValues[] | undefined {
		let value = this.get(key, useDefault);
		if (value === undefined) return;

		if (!Array.isArray(value)) {
			throw new Error('TYPE_ERROR');
		}

		return value;
	}

	getString(key: string, useDefault: boolean = true): string | undefined {
		let value = this.get(key, useDefault);
		if (value === undefined) return;

		if (typeof value !== 'string') {
			throw new Error('TYPE_ERROR');
		}

		return value;
	}

	getNumber(key: string, useDefault: boolean = true): number | undefined {
		let value = this.get(key, useDefault);
		if (value === undefined) return;

		if (typeof value !== 'number') {
			throw new Error('TYPE_ERROR')
		}

		return value;
	}

	getBoolean(key: string, useDefault: boolean = true): boolean | undefined {
		let value = this.get(key, useDefault);
		if (value === undefined) return;

		if (typeof value !== 'boolean') {
			throw new Error('TYPE_ERROR')
		}

		return value;
	}

	getDate(key: string, useDefault: boolean = true): Date | undefined {
		let value = this.get(key, useDefault);
		if (value === undefined) return;

		if (typeof value !== 'string') {
			throw new Error('TYPE_ERROR')
		}

		return new Date(value);
	}

	/**
	 * @inheritDoc
	 */
	set(key:string, value:PrimitivesValues):this {
		const cache = this.#load();
		const oldValue = cache.get(key);
		cache.set(key, value);
		this.emit('change', key, oldValue, value);
		this.#save();

		return this;
	}

	delete(key:string):boolean {
		const cache = this.#load(),
			oldValue = cache.get(key),
			result = cache.delete(key)
		;

		this.emit('change', key, oldValue, undefined);
		this.#save();

		return result;
	}

	/**
	 * @inheritDoc
	 */
	clear() {
		const cache = this.#load();
		cache.clear();
		this.emit('clear');
		this.#save();
	}

	forEach(callbackFn: (value:RandomJsonData, key: string, map: Map<string, RandomJsonData>) => void, thisArg?: any) {
		const cache = this.#load();
		cache.forEach(callbackFn, thisArg);
	}

	toJSON():RandomJsonData {
		const json:RandomJsonData = {};

		this.forEach((value:PrimitivesValues, key:string) => {
			json[key] = value;
		});

		return json;
	}


	get [Symbol.toStringTag](): string {
		return 'Settings';
	}
	get size(): number {
		const cache = this.#load();
		return cache.size;
	}
	[Symbol.iterator](): IterableIterator<[string,RandomJsonData]> {
		const cache = this.#load();
		return cache[Symbol.iterator]();
	}
	entries(): IterableIterator<[string,RandomJsonData]> {
		const cache = this.#load();
		return cache.entries();
	}
	keys(): IterableIterator<string> {
		const cache = this.#load();
		return cache.keys();
	}
	values(): IterableIterator<RandomJsonData> {
		const cache = this.#load();
		return cache.values();
	}
}
