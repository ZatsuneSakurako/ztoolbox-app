const {EventEmitter} = require('events'),
	classUtils = require('class-utils')
;



/**
 *
 * @extends Map
 * @implements NodeJS.Events
 * @inheritDoc
 */
class Settings extends Map {
	/**
	 * @inheritDoc
	 */
	constructor(storagePath) {
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
	}

	static get _fs() {
		delete Settings._fs;
		// noinspection JSUnresolvedVariable
		return Settings._fs = require('fs');
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
	set(key, value) {
		const oldValue = this.get(key);
		super.set(key, value);
		this.emit('change', key, oldValue, value);
		this._save();
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
	toJSON() {
		const json = {};
		this.forEach((value, key) => {
			json[key] = value;
		});
		return json
	}
}

// https://www.npmjs.com/package/class-utils
classUtils.inherit(Settings, EventEmitter, []);



module.exports.Settings = Settings;