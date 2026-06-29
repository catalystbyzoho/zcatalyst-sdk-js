import { isNonNullObject } from '@zcatalyst/utils';
import { readFileSync } from 'fs';

/**
 * Loads connector configuration from an object or a JSON file path.
 * @param propJson - The connector configuration object or path to a JSON file.
 * @returns { [x: string]: unknown } | null.
 * @example
 * ```ts
 * const config = getConnectorJson('./connector.json');
 * ```
 */
export function getConnectorJson(propJson: unknown): { [x: string]: unknown } | null {
	let connectorJson = null;
	if (isNonNullObject(propJson, 'connectorJson', false)) {
		connectorJson = propJson;
	} else {
		let jsonString: string;
		try {
			jsonString = readFileSync(propJson as string, 'utf8');
		} catch {
			return null;
		}
		try {
			connectorJson = JSON.parse(jsonString);
		} catch {
			return null;
		}
	}
	return connectorJson;
}
