const {clipboard} = require('electron'),
	{EventEmitter} = require('events')
;

class Clipboard extends EventEmitter {
	/**
	 * @type {Number}
	 */
	watchDelay = 1000;

	/**
	 * @type String
	 */
	lastText;

	/**
	 *
	 * @type {Electron.NativeImage}
	 */
	lastImage;

	/**
	 *
	 * @type {Number}
	 * @private
	 */
	_interval = null;

	constructor(watchDelay, autoStart=true) {
		super();

		if (typeof watchDelay === 'number' && !isNaN(watchDelay)) {
			this.watchDelay = watchDelay;
		}

		this.lastText = Clipboard.getText();
		this.lastImage = Clipboard.getImage();

		if (autoStart === true) {
			this.start();
		}
	}

	/**
	 *
	 * @private
	 */
	_intervalCallback() {
		const text = Clipboard.getText(),
			image = Clipboard.getImage()
		;

		if (!image.isEmpty() && this.lastImage.toDataURL() !== image.toDataURL()) {
			this.lastImage = image;
			this.emit('image', image);
		}

		if (text && this.lastText !== text) {
			this.lastText = text;
			this.emit('text', text);
		}
	}



	// noinspection JSMethodCanBeStatic
	/**
	 *
	 * @return {String}
	 */
	get text() {
		return Clipboard.getText();
	}

	// noinspection JSMethodCanBeStatic
	/**
	 *
	 * @param {String} value
	 */
	set text(value) {
		Clipboard.setText(value);
	}



	// noinspection JSMethodCanBeStatic
	/**
	 *
	 * @return {Electron.NativeImage}
	 */
	get image() {
		return Clipboard.getImage();
	}

	// noinspection JSMethodCanBeStatic
	/**
	 *
	 * @param {Electron.NativeImage} value
	 */
	set image(value) {
		Clipboard.setImage(value);
	}





	/**
	 *
	 * @param {String} value
	 * @param {String} [type]
	 * @return {this}
	 */
	static setText(value, type) {
		clipboard.writeText(value);
		return this;
	}

	/**
	 *
	 * @param {String} [type]
	 * @return {String}
	 */
	static getText(type) {
		return clipboard.readText(type);
	}



	/**
	 *
	 * @param {Electron.NativeImage} value
	 * @param {String} [type]
	 * @return {this}
	 */
	static setImage(value, type) {
		clipboard.writeImage(value);
		return this;
	}

	/**
	 *
	 * @param [type]
	 * @return {Electron.NativeImage}
	 */
	static getImage(type) {
		return clipboard.readImage(type);
	}



	/**
	 *
	 * @return {this}
	 */
	start() {
		if (this._interval !== null) {
			this.stop();
		}

		this._interval = setInterval(() => {
			this._intervalCallback()
		}, this.watchDelay);

		return this;
	}

	/**
	 *
	 * @return {boolean}
	 */
	get isEnabled() {
		return this._interval !== null;
	}

	/**
	 *
	 * @param {Boolean} newState
	 * @return {this}
	 */
	toggle(newState) {
		if (newState === true) {
			this.start()
		} else if (newState === false) {
			this.stop()
		}

		return this;
	}

	/**
	 *
	 * @return {this}
	 */
	stop() {
		if (this._interval !== null) {
			clearInterval(this._interval);
			this._interval = null;
		}

		return this;
	}
}

module.exports.Clipboard = Clipboard;
