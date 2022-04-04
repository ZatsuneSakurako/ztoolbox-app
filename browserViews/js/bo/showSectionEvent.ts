export type ShowSectionEvent = CustomEvent<{
	oldSection?: string,
	newSection: string,
	app: unknown
}>
