export type IChromeNativeMessage<T = unknown & object> = IChromeCommand<T> | IChromeWsOpen | IChromeLog;

export interface IChromeCommand<T = unknown & object> {
	type: 'nativeMessage'
	data: { command: string } & T
}

export interface IChromeWsOpen {
	type: 'ws open'
}

export interface IChromeLog {
	type: 'log'
	data: unknown[] | unknown
}


export interface IChromeNativeReply<O = (unknown & object) | string, I = (unknown & object) | undefined> {
	error: string | false
	type: string
	data?: { command: string } & I
	result?: O
}