// @ts-ignore
import * as classUtils from "class-utils";
import {EventEmitter} from "events";
import * as fs from "fs";
import {PrimitivesValues, RandomJsonData} from "./bo/settings";
require = require("esm")(module/*, options*/);
import settings from "../browserViews/js/settings/settings";


interface Settings extends EventEmitter {
	get(key:string):RandomJsonData|undefined;

	getString(key:string):string|undefined;
	getNumber(key:string):number|undefined;
	getBoolean(key:string):boolean|undefined;
	getDate(key:string):Date|undefined;

	has(key:string):boolean;
	set(key:string, value:RandomJsonData):this;
	delete(key:string):boolean;
	clear():void;
	toJSON():string;
	// @ts-ignore
	forEach(callbackfn: (value:PrimitivesValues, key:string, map:Map<string, PrimitivesValues>) => void, thisArgs?:any)
}

class Settings extends Map<string, RandomJsonData> implements Settings {
	storagePath:string;

	/**
	 * @inheritDoc
	 */
	constructor(storagePath:string) {
		super();

		this.storagePath = storagePath;

		let settings:RandomJsonData|null = null;
		try {
			settings = JSON.parse(fs.readFileSync(storagePath, 'utf8'));
		} catch (e) {
			console.error(e)
		}

		if (!Array.isArray(settings) && !!settings) {
			for (let [settingsKey, value] of Object.entries(settings)) {
				if (value === undefined) continue;

				super.set(settingsKey, value);
			}
		} else {
			// Default settings
			super.set("quality", "best");
			super.set("clipboardWatch", false);
			this._save();
		}

		if (this.has('shortcutsWindow')) {
			this.delete('shortcutsWindow');
		}
	}

	private _save() {
		try {
			fs.writeFileSync(this.storagePath, JSON.stringify(this.toJSON()), "utf8");
		} catch (e) {
			console.error(e)
		}
	}

	getDefaultValue(key: string): RandomJsonData | undefined {
		const settingConf = settings[key];
		if (!settingConf || settingConf?.type === 'button') return;
		return settingConf.value;
	}

	getString(key: string, useDefault: boolean = true): string | undefined {
		let value = this.get(key);
		if (value === undefined && useDefault) {
			value = this.getDefaultValue(key);
		}
		if (value === undefined) return;

		if (typeof value !== 'string') {
			throw new Error('TYPE_ERROR')
		}

		return value;
	}

	getNumber(key: string, useDefault: boolean = true): number | undefined {
		let value = this.get(key);
		if (value === undefined && useDefault) {
			value = this.getDefaultValue(key);
		}
		if (value === undefined) return;

		if (typeof value !== 'number') {
			throw new Error('TYPE_ERROR')
		}

		return value;
	}

	getBoolean(key: string, useDefault: boolean = true): boolean | undefined {
		let value = this.get(key);
		if (value === undefined && useDefault) {
			value = this.getDefaultValue(key);
		}
		if (value === undefined) return;

		if (typeof value !== 'boolean') {
			throw new Error('TYPE_ERROR')
		}

		return value;
	}

	getDate(key: string, useDefault: boolean = true): Date | undefined {
		let value = this.get(key);
		if (value === undefined && useDefault) {
			value = this.getDefaultValue(key);
		}
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
		const oldValue = this.get(key);
		super.set(key, value);
		this.emit('change', key, oldValue, value);
		this._save();

		return this;
	}

	delete(key:string):boolean {
		const oldValue = this.get(key),
			result = super.delete(key)
		;

		this.emit('change', key, oldValue, undefined);
		this._save();

		return result;
	}

	/**
	 * @inheritDoc
	 */
	clear() {
		super.clear();
		this.emit('clear');
		this._save();
	}

	/**
	 *
	 * @return {JSON}
	 */
	toJSON():Object {
		const json:RandomJsonData = {};

		this.forEach((value:PrimitivesValues, key:string) => {
			json[key] = value;
		});

		return json;
	}
}

// https://www.npmjs.com/package/class-utils
classUtils.inherit(Settings, EventEmitter, []);



export {
	Settings
}