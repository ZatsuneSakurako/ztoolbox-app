import Dict = NodeJS.Dict;

interface IButtonConfig {
	type: 'button',
	group?: string
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
	type: 'integer'
	minValue?: number
	maxValue?: number
	stepValue?: boolean
	rangeInput?: boolean
}

interface IBooleanConfig extends IConfigBase<boolean> {
	type: 'bool'
}

interface IJsonConfig extends IConfigBase<Dict<string|boolean|number|null>> {
	type: 'json'
}

type SettingConfig = IButtonConfig|IStringConfig|IColorConfig|IMenuListConfig|IIntegerConfig|IBooleanConfig|IJsonConfig;
export type SettingsConfig = Dict<SettingConfig>;



export type PrimitivesValues = string | number | boolean | null;
export type RandomJsonData = PrimitivesValues | Dict<PrimitivesValues> | PrimitivesValues[];
