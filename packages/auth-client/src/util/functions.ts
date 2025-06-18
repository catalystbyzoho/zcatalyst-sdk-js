export function wrapCheck(targetFunction: () => unknown): Promise<unknown> {
	return wrapWithPromise((): void => {
		if (true) targetFunction();
	});
}

export function wrapWithPromise(targetFunction: () => unknown): Promise<unknown> {
	return new Promise((resolve, reject) => {
		targetFunction();
		resolve('success');
	});
}

export function setGlobal(key: string, value: unknown) {
	window[key] = value;
}
