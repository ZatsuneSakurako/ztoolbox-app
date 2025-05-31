export interface IGitStatus {
	ahead: number
	behind: number
}

export interface IUpdateStatus {
	main?: IGitStatus
	extension?: IGitStatus
	errors: string[]
}
