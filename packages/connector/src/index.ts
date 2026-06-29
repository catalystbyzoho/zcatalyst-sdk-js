/**
 * Catalyst Connector — securely store and reuse third-party credentials and configuration.
 *
 * @packageDocumentation
 */

import { Handler } from '@zcatalyst/transport';
import { Component, CONSTANTS, isNonNullObject, ObjectHasProperties } from '@zcatalyst/utils';

import pkg from '../package.json';
const { version } = pkg;
import { Connector } from './connection';
import { CatalystConnectorError } from './utils/error';
import { getConnectorJson } from './utils/validators';

const { CLIENT_ID, CLIENT_SECRET, AUTH_URL, REFRESH_URL, CONNECTOR_NAME, COMPONENT } = CONSTANTS;

/**
 * Loads connector configuration and creates Connector instances.
 */
export class Connection implements Component {
	app?: unknown;
	requester: Handler;
	connectionJson: { [x: string]: unknown } | null;
	constructor(propJson: string | { [x: string]: { [x: string]: string } }, app?: unknown) {
		this.app = app;
		this.requester = new Handler(app, this);
		this.connectionJson = getConnectorJson(propJson);
	}

	/**
	 * getComponentName operation.
	 */
	getComponentName(): string {
		return COMPONENT.connector;
	}

	/**
	 * getComponentVersion operation.
	 */
	getComponentVersion(): string {
		return version;
	}

	/**
	 * Retrieves a configured connector by name.
	 * @param connectorName - The configured connector name.
	 * @returns Connector.
	 * @throws {CatalystConnectorError} when input validation fails.
	 * @example
	 * ```ts
	 * const connector = connection.getConnector('crm');
	 * ```
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
