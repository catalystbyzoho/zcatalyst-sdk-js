'use strict';

import { isNonNullObject } from '@zcatalyst/utils';
import { readFileSync } from 'fs';

export function getConnectorJson(propJson: unknown): { [x: string]: unknown } | null {
	let connectorJson = null;
	if (isNonNullObject(propJson, 'connectorJson', false)) {
		connectorJson = propJson;
	} else {
		let jsonString: string;
		try {
			jsonString = readFileSync(propJson as string, 'utf8');
		} catch (err) {
			return null;
		}
		try {
			connectorJson = JSON.parse(jsonString);
		} catch (err) {
			return null;
		}
	}
	return connectorJson;
}
