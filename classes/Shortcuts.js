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
	 * @param {Shortcuts.fileItem} fileItem
	 * @return {boolean}
	 */
	static openItem(fileItem) {
		return shell.openItem(fileItem.path);
	}

	/**
	 *
	 * @see https://electronjs.org/docs/api/shell#shellreadshortcutlinkshortcutpath-windows
	 * @param {string} filepath
	 */
	static getLinkDetails(filepath) {
		return shell.readShortcutLink(filepath);
	}

	/**
	 *
	 * @param {string} filepath
	 * @return {string}
	 * @private
	 */
	static _resoveWinPath(filepath) {
		return path.normalize(filepath.replace(/%([^%]+)%/g, (_,n) => process.env[n]));
	}
	/**
	 *
	 * @param {Shortcuts.fileItem} item
	 * @param {"small"|"normal"|"large"} [size]
	 * @return {Promise<String>}
	 */
	static getFileIcon(item, size='normal') {
		return new Promise(resolve => {
			let itemPath = this._resoveWinPath(item.path);

			if (item.type === 'lnk') { // imagemagick
				let shortcutData = null;
				try {
					shortcutData = this.getLinkDetails(itemPath);
				} catch (e) {
					console.error(e);
					console.warn(itemPath);
				}

				if (shortcutData !== null) {
					if (typeof shortcutData.icon === 'string') {
						itemPath = this._resoveWinPath(shortcutData.icon);

						/*if (shortcutData.iconIndex > 0) {
							console.debug('iconIndex not supported');
						}*/
					} else {
						itemPath = this._resoveWinPath(shortcutData.target);
					}
				}
			}

			app.getFileIcon(itemPath, {
				size
			}, (err, /** @type {NativeImage} */ icon) => {

				if (!!err) {
					console.error(err);
					resolve(null);
					return;
				}

				resolve(icon.toDataURL());
			})
		})
	}
}





module.exports.Shortcuts = Shortcuts;
