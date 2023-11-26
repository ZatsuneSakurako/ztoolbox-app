import net from "node:net";

export function getNetConnectionAddress(host:string, timeout: number=5000, port:number=80) {
	return new Promise<net.AddressInfo>((resolve, reject) => {
		const client = net.connect({
			host,
			port,
			timeout: 1000
		}, () => {
			clearTimeout(timer);
			client.end();

			const address = client.address();
			if ('address' in address) {
				resolve(address);
			} else {
				reject(new Error('NET_ADDRESS_OBJECT_EMPTY'));
			}
		});
		client.on('error', function (err) {
			clearTimeout(timer);
			reject(err);
		});
		const timer = setTimeout(() => {
			client.end();
			reject();
		}, timeout);
	})
}