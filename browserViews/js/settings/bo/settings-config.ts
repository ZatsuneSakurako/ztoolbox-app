import Dict = NodeJS.Dict;

interface IControlConfig {
	type: 'control'
}

interface IConfigBase<T> {
	value: T,
	group?: string
}

interface IStringConfig extends IConfigBase<string> {
	type: 'string'
}

interface IMenuListConfig extends IConfigBase<string> {
	type: 'menulist'
	options: {value: string, label: string}[]
}

interface IColorConfig extends IConfigBase<string> {
	type: 'color'
}

interface IIntegerConfig extends IConfigBase<number> {
	type: 'interger'
	minValue?: number
	maxValue?: number
	rangeInput: boolean
	rangeOutputUnit: string
}

interface IBooleanConfig extends IConfigBase<boolean> {
	type: 'bool'
}

interface IJsonConfig extends IConfigBase<Dict<string|boolean|number|null>> {
	type: 'json'
}

type SettingConfig = IControlConfig|IStringConfig|IColorConfig|IMenuListConfig|IIntegerConfig|IBooleanConfig|IJsonConfig;
export type SettingsConfig = Dict<SettingConfig>;
