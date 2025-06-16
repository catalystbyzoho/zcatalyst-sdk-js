'use strict';

import { Handler } from '@zcatalyst/transport';
import { CONSTANTS, isNonNullObject, ObjectHasProperties } from '@zcatalyst/utils';

import { Connector } from './connection';
import { CatalystConnectorError } from './utils/error';
import { getConnectorJson } from './utils/validators';

const { CLIENT_ID, CLIENT_SECRET, AUTH_URL, REFRESH_URL, CONNECTOR_NAME } = CONSTANTS;

export class Connection {
	app?: unknown;
	requester: Handler;
	connectionJson: { [x: string]: unknown } | null;
	constructor(propJson: string | { [x: string]: { [x: string]: string } }, app?: unknown) {
		this.app = app;
		this.requester = new Handler(app);
		this.connectionJson = getConnectorJson(propJson);
	}

	/**
	 * Retrieves a connector instance by name.
	 *
	 * @param {string} connectorName - The name of the connector to retrieve.
	 * @returns {Connector} An instance of the requested connector.
	 * @throws {CatalystConnectorError} If the connection JSON is invalid or required properties are missing.
	 *
	 * @example
	 * try {
	 *     const myConnector = catalystApp.getConnector('my_connector');
	 *     console.log(myConnector); // Instance of Connector
	 * } catch (error) {
	 *     console.error('Failed to get connector:', error.message);
	 * }
	 */
	getConnector(connectorName: string): Connector {
		if (this.connectionJson === null) {
			throw new CatalystConnectorError(
				'invalid_input',
				'The input passed to connector must be a valid JSON object or a string path to a JSON file',
				this.connectionJson
			);
		}
		const connector = this.connectionJson[connectorName];
		isNonNullObject(connector, 'connector.' + connectorName, true);
		ObjectHasProperties(
			connector as { [x: string]: unknown },
			[CLIENT_ID, CLIENT_SECRET, AUTH_URL, REFRESH_URL],
			'connector.' + connectorName,
			true
		);
		return new Connector(this, Object.assign({ [CONNECTOR_NAME]: connectorName }, connector));
	}
}

export { Connector };
