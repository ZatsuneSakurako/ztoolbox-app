import Dict = NodeJS.Dict;

interface IButtonConfig {
	type: 'button',
	group?: string
}

interface IConfigBase<T extends SettingValues> {
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

export type IPathConfigFilter = {
	name: string
	extensions: string[]
};
interface IPathConfig extends IConfigBase<string> {
	type: 'path',
	opts: {
		asText?: boolean
		asFile?: IPathConfigFilter[]|boolean // file filter for file input, true for path input
	}
}
interface IPathsConfig extends IConfigBase<string[]> {
	type: 'paths',
	opts: {
		asFile?: IPathConfigFilter[]|boolean // file filter for file input, true for path input
	}
}

export type SettingConfig =
	IButtonConfig |
	IStringConfig |
	IColorConfig |
	IMenuListConfig |
	IIntegerConfig |
	IBooleanConfig |
	IJsonConfig |
	IPathConfig |
	IPathsConfig
;
export type SettingValues = string|string[]|number|boolean|Dict<string|boolean|number|null>
export type SettingsConfig = Dict<SettingConfig>;



export type PrimitivesValues = string | number | boolean | null;
export type RandomJsonData = PrimitivesValues | Dict<RandomJsonData|PrimitivesValues> | PrimitivesValues[];
