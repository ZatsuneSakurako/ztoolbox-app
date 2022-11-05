export abstract class JsonSerialize<T> {
	constructor(data:T) {
		this.fromJSON(data);
	}

	abstract fromJSON(data:T):void
	abstract toJSON():T
}