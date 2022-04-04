export const ddgIpAnswerReg = /^Your IP address is ([^ ]+) in/i;
export default async function (noHtml:boolean): Promise<string> {
	const params = new URLSearchParams({
		q: 'what is my ip',
		format: 'json',
		pretty: '0',
		skip_disambig: '1'
	});

	if (noHtml) {
		params.append('nohtml', '1');
	}

	const response = await fetch(`https://api.duckduckgo.com/?${params.toString()}`),
		{ Answer:answer } = await response.json()
	;

	if (typeof answer !== 'string' || answer.length === 0) {
		throw new Error('UNEXPECTED_ANSWER')
	}

	const parse = ddgIpAnswerReg.exec(answer);
	if (parse) {
		return parse[1];
	}
	return answer;
}
