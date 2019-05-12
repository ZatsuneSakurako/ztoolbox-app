const {GlobSync} = require('glob'),
	{shell} = require('electron'),
	removeAccents = require('remove-accents'),
	path = require('path')
;





class Shortcuts {
	/**
	 *
	 * @typedef {Object} Shortcuts.fileItem
	 * @property {string} filename
	 * @property {string} path
	 * @property {string} search
	 * @property {"lnk" | "url" | "other"} type
	 */
	/**
	 *
	 * @type {fileItem[]}
	 */
	files = [];

	/**
	 *
	 * @private
	 */
	cache;



	/**
	 *
	 * @return {fileItem[]}
	 */
	getAll() {
		let files = [];

		[
			path.resolve(process.env.APPDATA, './Microsoft/Windows/Start Menu/Programs'),
			path.resolve(process.env.ProgramData, './Microsoft/Windows/Start Menu/Programs')
		].forEach(currentBasePath => {
			const globSync = new GlobSync('/**/*.@(lnk|url)', {
				root: currentBasePath,
				nodir: true,
				cache: this._cache
			});

			files = files.concat(globSync.found.map(value => {
				return {
					'path': value,
					'search': removeAccents(path.relative(currentBasePath, value).toLowerCase()),
					'filename': path.basename(value),
					'type': path.extname(value).replace(/^\./, '')
				};
			}));

			this._cache = globSync.cache;
		});



		this.files = files.filter(value =>
			value.search.includes('uninstall') === false
			&& value.search.includes('desinstaller') === false
			&& value.search.includes('deprecated') === false
		);

		return this.files;
	}

	/**
	 *
	 * @param {fileItem} fileItem
	 * @return {boolean}
	 */
	static openItem(fileItem) {
		return shell.openItem(fileItem.path);
	}

	/**
	 *
	 * @see https://electronjs.org/docs/api/shell#shellreadshortcutlinkshortcutpath-windows
	 * @param {fileItem} fileItem
	 */
	static getLinkDetails(fileItem) {
		return shell.readShortcutLink(fileItem.path);
	}
}





module.exports.Shortcuts = Shortcuts;
