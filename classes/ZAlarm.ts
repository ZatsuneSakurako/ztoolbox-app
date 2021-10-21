import cronParser from 'cron-parser';

export type Callback = (date:Date) => void;

export class ZAlarm {
	private repeat: boolean;
	private timer: NodeJS.Timeout | null = null;

	private constructor(cronOrDate: Date, callback:Callback)
	private constructor(cronOrDate: Date | string, callback:Callback, repeat: boolean)
	private constructor(private cronOrDate: Date | string, private callback:Callback, repeat?: boolean) {
		if (cronOrDate instanceof Date) {
			this.repeat = false;
		} else {
			this.repeat = repeat ?? true;

			// Make sure to have a valid cron string
			cronParser.parseExpression(cronOrDate);
		}
	}

	static sleep(ms: number): Promise<void> {
		return new Promise(resolve => {
			setTimeout(resolve, ms);
		});
	}

	static start(cronOrDate:Date, callback:Callback): ZAlarm
	static start(cronOrDate:string, callback:Callback, repeat?:boolean): ZAlarm
	static start(cronOrDate:Date|string, callback:Callback, repeat?:boolean): ZAlarm {
		const newInstance = cronOrDate instanceof Date ? new ZAlarm(cronOrDate, callback) : new ZAlarm(cronOrDate, callback, repeat ?? true);
		newInstance.start()
			.catch(console.error)
		;
		return newInstance;
	}

	get nextDate():Date {
		if (this.cronOrDate instanceof Date) {
			return new Date(this.cronOrDate.getTime());
		}

		const cron = cronParser.parseExpression(this.cronOrDate);
		return cron.next().toDate();
	}

	async start() {
		if (this.timer !== null) {
			throw new Error('ALREADY_STARTED');
		}

		const date = this.nextDate;
		while ((date.getTime() - Date.now()) > 15 * 60 * 1000) {
			await ZAlarm.sleep(10 * 60 * 1000);
		}

		this.timer = global.setTimeout(() => {
			this.triggerCallback(date);
		}, date.getTime() - Date.now())
	}

	private async triggerCallback(date: Date) {
		this.callback(date);

		if (this.repeat) {
			this.timer = null;
			this.start()
				.catch()
			;
		}
	}

	clear() {
		if (this.timer) {
			global.clearTimeout(this.timer);
			this.timer = null;
		}
	}
}
