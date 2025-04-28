export function errorToString(error: any | Error | string): string {
	if (error && typeof error === 'object' && error.stack !== undefined) {
		return error.stack;
	} else {
		if (error && typeof error === 'object') {
			try {
				error = JSON.stringify(error);
			} catch (e) {}
		}
		return ((new Error(error)).stack ?? '');
	}
}
