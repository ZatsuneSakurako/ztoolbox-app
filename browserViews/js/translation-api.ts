import {BridgedWindow} from "./bridgedWindow";

const i18ex = {
	_: function (key:string) {
		return (<BridgedWindow> window).znmApi._(key)
	}
}

/*		---- Nodes translation ----		*/
async function translateNodes() {
	const nodes:Element[] = [...document.querySelectorAll("[data-translate-id]")];
	for (let node of nodes) {
		if (typeof node.tagName === "string") {
			i18ex._((<HTMLElement> node).dataset.translateId)
				.then(str => {
					node.textContent = str;
					delete (<HTMLElement> node).dataset.translateId;
				})
				.catch(console.error)
			;
		}
	}
}

function translateNodes_title() {
	const nodes:Element[] = [...document.querySelectorAll("[data-translate-title]")];
	for (let node of nodes) {
		if (typeof node.tagName === "string") {
			i18ex._((<HTMLElement> node).dataset.translateTitle)
				.then(str => {
					node.setAttribute('title', str);
					delete (<HTMLElement> node).dataset.translateTitle;
				})
				.catch(console.error)
			;
		}
	}
}

export async function loadTranslations() {
	const observer = new MutationObserver(function (mutations) {
		mutations.forEach(function (mutation) {
			if (mutation.type === "childList") {
				translateNodes();
				translateNodes_title();
			} else if (mutation.type === "attributes") {
				switch (mutation.attributeName) {
					case 'data-translate-id':
						translateNodes();
						break;
					case 'data-translate-title':
						translateNodes_title();
						break;
				}
			}
		});
	});

	translateNodes();
	translateNodes_title();

	// pass in the target node, as well as the observer options
	observer.observe(document.body, {
		attributes: true,
		childList: true,
		subtree: true
	});

	// later, you can stop observing
	//observer.disconnect();
}