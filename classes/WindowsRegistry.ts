import Winreg from "winreg";

export type registryValueTypes =
	typeof Winreg.REG_SZ
	| typeof Winreg.REG_MULTI_SZ
	| typeof Winreg.REG_EXPAND_SZ
	| typeof Winreg.REG_DWORD
	| typeof Winreg.REG_QWORD
	| typeof Winreg.REG_BINARY
	| typeof Winreg.REG_NONE;

export class WindowsRegistry {
	#registry: Winreg.Registry

	constructor(registry: Winreg.Registry) {
		this.#registry = registry;
	}

	get registry(): Winreg.Registry {
		return this.#registry;
	}

	get host(): string {
		return this.#registry.host;
	}

	get hive(): string {
		return this.#registry.hive;
	}

	get key(): string {
		return this.#registry.key;
	}

	get path(): string {
		return this.#registry.path;
	}

	get arch(): string {
		return this.#registry.arch;
	}

	get parent(): WindowsRegistry {
		return new WindowsRegistry(this.#registry.parent);
	}

	async exist(): Promise<boolean> {
		let parentKeys:string[];
		try {
			const result = await this.parent.keys();
			parentKeys = result.map(item => item.path);
		} catch (e) {
			return false;
		}
		return parentKeys.includes(this.path);
	}
	keyExists(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.#registry.keyExists((err, exists) => {
				if (!!err) {
					reject(err);
					return;
				}
				resolve(exists);
			})
		});
	}
	valueExists(name: string): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			this.#registry.valueExists(name, (err, exists) => {
				if (!!err) {
					reject(err);
					return;
				}
				resolve(exists);
			})
		});
	}
	get(name: string): Promise<Winreg.RegistryItem> {
		return new Promise<Winreg.RegistryItem>((resolve, reject) => {
			this.#registry.get(name, (err, result) => {
				if (!!err) {
					reject(err);
					return;
				}
				resolve(result);
			})
		});
	}
	set(name: string, type: registryValueTypes, value: string): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			this.#registry.set(name, type, value, (err) => {
				console.error(err);
				resolve(!err);
			})
		});
	}

	remove(name: string): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			this.#registry.remove(name, (err) => {
				console.error(err);
				resolve(!err);
			})
		});
	}
	destroy(): Promise<boolean> {
		return new Promise<boolean>(resolve => {
			this.#registry.destroy((err) => {
				console.error(err);
				resolve(!err);
			})
		});
	}

	keys(): Promise<Winreg.Registry[]> {
		return new Promise<Winreg.Registry[]>((resolve, reject) => {
			this.#registry.keys((err, result) => {
				if (!!err) {
					reject(err);
					return;
				}
				resolve(result);
			})
		});
	}

	values(): Promise<Winreg.RegistryItem[]> {
		return new Promise<Winreg.RegistryItem[]>((resolve, reject) => {
			this.#registry.values((err, result) => {
				if (!!err) {
					reject(err);
					return;
				}
				resolve(result);
			})
		});
	}

	clear(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.#registry.clear((err) => {
				if (!!err) {
					reject(err)
					return;
				}
				resolve();
			})
		});
	}

	create(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this.#registry.create((err) => {
				if (!!err) {
					reject(err)
					return;
				}
				resolve();
			})
		});
	}
}