export function updateClassesFor(target: HTMLInputElement) {
	const nodes: HTMLLabelElement[] = [...document.querySelectorAll<HTMLLabelElement>(`label[for="${target.id}"]`)];
	if (target.type === 'radio') {
		const radios = document.querySelectorAll(`input[type="radio"][name="${target.name}"]:not([id="${target.id}"])`);
		for (let radio of radios) {
			nodes.push(...document.querySelectorAll<HTMLLabelElement>(`label[for="${radio.id}"]`));
		}
	}

	for (let node of nodes) {
		node.classList.toggle('checked', (<HTMLInputElement|null> node.control)?.checked);
	}
}

export function reloadClassesFor(container:Document|Element = document) {
	for (let node of container.querySelectorAll<HTMLInputElement>('input[type="checkbox"][id],input[type="radio"][id]')) {
		updateClassesFor(<HTMLInputElement> node);
	}
}

document.addEventListener('change', function (e) {
	const target = (<Element> e.target).closest<HTMLInputElement>('input[type="checkbox"][id],input[type="radio"][id]');
	if (!target) return;

	updateClassesFor(target);
});

setTimeout(() => {
	reloadClassesFor();
});
