'use strict';

import { CONSTANTS } from '@zcatalyst/utils';
import { Agent as httpAgent } from 'http';
import { Agent as httpsAgent } from 'https';
/**
 * example structure
 * {
 * 	http: {
 * 		domain: httpAgent
 * 	}
 * }
 */
const agentMap: Record<string, Record<string, httpAgent | httpsAgent>> = {};

export default class RequestAgent {
	agent: httpAgent | httpsAgent;
	constructor(isHttps: boolean, host: string, replaceAgent: boolean) {
		const protocol = isHttps ? CONSTANTS.PROTOCOL.HTTPS : CONSTANTS.PROTOCOL.HTTP;
		if (agentMap[protocol] === undefined) {
			agentMap[protocol] = {};
		}
		const protocolMap = agentMap[protocol];
		if (protocolMap[host] === undefined || replaceAgent) {
			protocolMap[host] = isHttps
				? new httpsAgent({ keepAlive: true })
				: new httpAgent({ keepAlive: true });
		}
		this.agent = protocolMap[host];
	}
}
