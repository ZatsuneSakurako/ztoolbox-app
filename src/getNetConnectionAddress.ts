import * as os from "node:os";

export function getNetworkIps() {
	return new Map(Object.entries(os.networkInterfaces())
		.map(([key, networkInterface]) => {
			const networkInterfaces = networkInterface ?? []

			const ipV4 = networkInterfaces
					.filter(networkInterface => networkInterface.family === 'IPv4')
					.map(networkInterface => networkInterface.address),
				ipV6 = networkInterfaces
					.filter(networkInterface => networkInterface.family === 'IPv6')
					.map(networkInterface => networkInterface.address)

			return [
				key,
				{ ipV4, ipV6 },
			];
		}));
}
