import {EventEmitter} from "events";
import {clipboard, NativeImage} from "electron";

type Timeout = NodeJS.Timeout;

export class ZClipboard extends EventEmitter {
	/**
	 * @type {Number}
	 */
	watchDelay = 1000;

	lastText:string;

	lastImage:NativeImage;

	_interval:Timeout|null = null;

	constructor(watchDelay:number, autoStart=true) {
		super();

		if (typeof watchDelay === 'number' && !isNaN(watchDelay)) {
			this.watchDelay = watchDelay;
		}

		this.lastText = ZClipboard.getText();
		this.lastImage = ZClipboard.getImage();

		if (autoStart === true) {
			this.start();
		}
	}

	/**
	 *
	 * @private
	 */
	_intervalCallback() {
		const text = ZClipboard.getText(),
			image = ZClipboard.getImage()
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
	get text():string {
		return ZClipboard.getText();
	}

	// noinspection JSMethodCanBeStatic
	set text(value:string) {
		ZClipboard.setText(value);
	}



	// noinspection JSMethodCanBeStatic
	get image():NativeImage {
		return ZClipboard.getImage();
	}

	// noinspection JSMethodCanBeStatic
	set image(value:NativeImage) {
		ZClipboard.setImage(value);
	}





	// @ts-ignore
	static setText(value:string, type?:'selection' | 'clipboard'):this {
		clipboard.writeText(value, type);
		return this;
	}

	static getText(type?:'selection' | 'clipboard'):string {
		return clipboard.readText(type);
	}



	// @ts-ignore
	static setImage(value:NativeImage, type?:'selection' | 'clipboard'):this {
		clipboard.writeImage(value, type);
		return this;
	}

	static getImage(type?:'selection' | 'clipboard'):NativeImage {
		return clipboard.readImage(type);
	}



	start():this {
		if (this._interval !== null) {
			this.stop();
		}

		this._interval = setInterval(() => {
			this._intervalCallback()
		}, this.watchDelay);

		return this;
	}

	get isEnabled():boolean {
		return this._interval !== null;
	}

	toggle(newState:boolean):this {
		if (newState === true) {
			this.start()
		} else if (newState === false) {
			this.stop()
		}

		return this;
	}

	stop():this {
		if (this._interval !== null) {
			clearInterval(this._interval);
			this._interval = null;
		}

		return this;
	}
}
