'use strict';

import { Handler } from '@zcatalyst/transport';
import { Component, CONSTANTS, isValidInputString, wrapValidators } from '@zcatalyst/utils';

import { Lighthouse } from './lighthouse';
import { CatalystSlateError } from './utils/error';

const { COMPONENT } = CONSTANTS;

export class Slate implements Component {
	readonly requester: Handler;
	readonly _app: unknown;

	constructor(app?: unknown) {
		this._app = app;
		this.requester = new Handler(app, this);
	}

	/**
	 * Returns the name of the component.
	 * @returns {string} Component name
	 */
	getComponentName(): string {
		return COMPONENT.slate;
	}

	/**
	 * Creates a Lighthouse instance for the given app and deployment.
	 * @param {string} appId - The application ID
	 * @param {string} deploymentId - The deployment ID
	 * @returns {Lighthouse} A Lighthouse instance
	 * @throws {CatalystSlateError} If the provided IDs are invalid
	 */
	lighthouse(appId: string, deploymentId: string): Lighthouse {
		wrapValidators(() => {
			isValidInputString(appId, 'app_id', true);
			isValidInputString(deploymentId, 'deployment_id', true);
		}, CatalystSlateError);
		return new Lighthouse(this._app, appId, deploymentId);
	}
}

export { Lighthouse };
export * from './utils/interface';
