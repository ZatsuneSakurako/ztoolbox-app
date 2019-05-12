const {GlobSync} = require('glob'),
	removeAccents = require('remove-accents'),
	path = require('path')
;





class Shortcuts {
	/**
	 *
	 * @type {{path: string, search: string}[]}
	 */
	files = [];

	/**
	 *
	 * @private
	 */
	cache;



	/**
	 *
	 * @return {{path: string, search: string}[]}
	 */
	getAll() {
		let files = [];

		[
			path.resolve(process.env.APPDATA, './Microsoft/Windows/Start Menu/Programs'),
			path.resolve(process.env.ProgramData, './Microsoft/Windows/Start Menu/Programs')
		].forEach(currentBasePath => {
			const globSync = new GlobSync('/**/*.lnk', {
				root: currentBasePath,
				nodir: true,
				cache: this._cache
			});

			files = files.concat(globSync.found.map(value => {
				return {
					'path': value,
					'search': removeAccents(path.relative(currentBasePath, value).toLowerCase()),
					'filename': path.basename(value)
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
}



module.exports.Shortcuts = Shortcuts;
