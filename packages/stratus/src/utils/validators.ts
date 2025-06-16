export function ignoreEmptyProperties(data: Record<string, string>) {
	return Object.fromEntries(Object.entries(data).filter(([_, value]) => value.trim() !== ''));
}
