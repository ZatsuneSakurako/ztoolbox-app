const {GlobSync} = require('glob'),
	{app, shell} = require('electron'),
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
	 * @property {String} fileIcon
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
					'type': path.extname(value).replace(/^\./, ''),
					'fileIcon': ''
				};
			}));

			this._cache = globSync.cache;
		});



		this.files = files
			.filter(value =>
				value.search.includes('uninstall') === false
				&& value.search.includes('desinstaller') === false
				&& value.search.includes('deprecated') === false
			)
			.sort(function (a, b) {
				return a.filename.localeCompare(b.filename);
			})
		;

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

	/**
	 *
	 * @param {Shortcuts.fileItem} item
	 * @param {string} [size]
	 * @return {boolean}
	 */
	static getFileIconPng(item, size='normal') {
		return new Promise((resolve, reject) => {
			app.getFileIcon(item.path, {
				size
			}, (err, /** @type {NativeImage} */ icon) => {

				if (!!err) {
					console.error(err);
					resolve(false)
					return;
				}

				item.fileIcon = icon.toDataURL();
				resolve(true);
			})
		})
	}
}





module.exports.Shortcuts = Shortcuts;
