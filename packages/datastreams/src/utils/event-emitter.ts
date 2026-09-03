/**
 * Browser-compatible EventEmitter
 *
 * This provides a minimal EventEmitter implementation that works in both
 * Node.js and browser environments without requiring Node.js built-in modules.
 */

type EventListener = (...args: Array<any>) => void;
type EventMap = Map<string, Set<EventListener>>;

/**
 * Minimal EventEmitter implementation for cross-platform compatibility
 */
export class EventEmitter {
	private events: EventMap = new Map();

	/**
	 * Register an event listener
	 */
	on(event: string, listener: EventListener): this {
		if (!this.events.has(event)) {
			this.events.set(event, new Set());
		}
		this.events.get(event)!.add(listener);
		return this;
	}

	/**
	 * Register a one-time event listener
	 */
	once(event: string, listener: EventListener): this {
		const onceWrapper = (...args: Array<any>) => {
			this.off(event, onceWrapper);
			listener(...args);
		};
		return this.on(event, onceWrapper);
	}

	/**
	 * Remove an event listener
	 */
	off(event: string, listener: EventListener): this {
		const listeners = this.events.get(event);
		if (listeners) {
			listeners.delete(listener);
			if (listeners.size === 0) {
				this.events.delete(event);
			}
		}
		return this;
	}

	/**
	 * Remove all listeners for an event, or all events if no event specified
	 */
	removeAllListeners(event?: string): this {
		if (event) {
			this.events.delete(event);
		} else {
			this.events.clear();
		}
		return this;
	}

	/**
	 * Emit an event with arguments
	 */
	emit(event: string, ...args: Array<any>): boolean {
		const listeners = this.events.get(event);
		if (!listeners || listeners.size === 0) {
			return false;
		}

		// Create array from set to avoid issues if listeners modify the set during iteration
		const listenersArray = Array.from(listeners);
		for (const listener of listenersArray) {
			try {
				listener(...args);
			} catch (error) {
				// Emit error event if available, otherwise log to console
				if (event !== 'error') {
					this.emit('error', error);
				} else {
					// eslint-disable-next-line no-console
					console.error('EventEmitter error:', error);
				}
			}
		}
		return true;
	}

	/**
	 * Get the number of listeners for an event
	 */
	listenerCount(event: string): number {
		const listeners = this.events.get(event);
		return listeners ? listeners.size : 0;
	}

	/**
	 * Get all listeners for an event
	 */
	listeners(event: string): Array<EventListener> {
		const listeners = this.events.get(event);
		return listeners ? Array.from(listeners) : [];
	}
}
