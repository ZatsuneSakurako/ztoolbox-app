// @ts-ignore
import * as classUtils from "class-utils";
import {EventEmitter} from "events";
import * as fs from "fs";


interface Settings {
	get(key:string):any;
	has(key:string):boolean;
	set(key:string, value:any):this;
	delete(key:string):boolean;
	clear():void;
	toJSON():string;
	emit(event: string | symbol, ...args: any[]): boolean;
	// @ts-ignore
	forEach(callbackfn: (value:any, key:string, map:Map<string,any>) => void, thisArgs?:any)

	emit():void;
	on(event: string | symbol, listener: (...args: any[]) => void): this;
	once(event: string | symbol, listener: (...args: any[]) => void): this;
	off(event: string | symbol, listener: (...args: any[]) => void): this;
}

class Settings extends Map<string, any> implements Settings {
	storagePath:string;

	/**
	 * @inheritDoc
	 */
	constructor(storagePath:string) {
		super();

		this.storagePath = storagePath;

		let settings = null;
		try {
			settings = JSON.parse(Settings._fs.readFileSync(storagePath, 'utf8'));
		} catch (e) {
			console.error(e)
		}

		if (settings !== null) {
			for (let settingsKey in settings) {
				if (settings.hasOwnProperty(settingsKey)) {
					super.set(settingsKey, settings[settingsKey]);
				}
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

	static get _fs() {
		return fs;
	}

	/**
	 *
	 * @private
	 */
	_save() {
		try {
			Settings._fs.writeFileSync(this.storagePath, JSON.stringify(this.toJSON()), "utf8");
		} catch (e) {
			console.error(e)
		}
	}

	/**
	 * @inheritDoc
	 */
	set(key:string, value:any):this {
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
		const json = {} as { [key: string]: any };

		this.forEach((value:any, key:string) => {
			json[key] = value;
		});

		return json
	}
}

// https://www.npmjs.com/package/class-utils
classUtils.inherit(Settings, EventEmitter, []);



export {
	Settings
}