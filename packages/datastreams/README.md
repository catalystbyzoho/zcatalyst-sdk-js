# @zcatalyst/datastreams

JavaScript SDK for Catalyst Data Streams - Real-Time Data Streaming

## Overview

The `@zcatalyst/datastreams` package provides JavaScript/TypeScript methods to implement [Catalyst Data Streams](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/introduction/), a real-time publish-subscribe messaging service for bidirectional communication between clients and servers.

**Catalyst Data Streams** enables WebSocket-based real-time communication, allowing you to build collaborative applications, live dashboards, and instant notification systems.

### Key Features

- **Real-Time Communication**: WebSocket-based instant messaging
- **Pub/Sub Architecture**: Publisher-subscriber pattern
- **Bidirectional**: Two-way communication between clients and server
- **Channel Management**: Organize streams into channels
- **Live Connection Tracking**: Monitor active connections
- **Token-Based Auth**: Secure channel access with tokens
- **Multi-Client**: Support multiple simultaneous connections
- **Scalable**: Handle high-volume real-time data

### Use Cases

- Build real-time chat applications
- Live dashboards and analytics
- Collaborative editing tools
- Real-time notifications and alerts
- Live game updates and leaderboards
- IoT device communication
- Stock tickers and price updates
- Social media feeds

### Prerequisites

- A [Catalyst project](https://docs.catalyst.zoho.com/en/getting-started/catalyst-projects) set up
- Data Stream channels created
- Understanding of [WebSocket subscription](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/implementation/subscribe-websocket/)
- A [token pair](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/implementation/generate-token-pair/) for authentication

## Installation

To install this package, simply type add or install @zcatalyst/datastreams
using your favorite package manager:

- `npm install @zcatalyst/datastreams`
- `yarn add @zcatalyst/datastreams`
- `pnpm add @zcatalyst/datastreams`

## Getting Started

### Import

The Catalyst SDK provides real-time data streaming capabilities.
To use data streams, import the `DataStreams`:

```js
// ES5 example
const { DataStreams } = require("@zcatalyst/datastreams");
```

```ts
// ES6+ example
import { DataStreams } from "@zcatalyst/datastreams";
```

### Usage

#### Node.js Environment

For server-side data streaming operations:

```js
const dataStreams = new DataStreams(app);

// Get token pair for channel authentication
const tokenPair = await dataStreams.getTokenPair('channel-id', {
  userId: 'user123'
});

// Get all channels
const channels = await dataStreams.getAllChannels();

// Get channel details
const channelDetails = await dataStreams.getChannelDetails('channel-id');

// Get live connection count
const liveCount = await dataStreams.getLiveCount('channel-id');

// Publish data to channel
const result = await dataStreams.publishData('channel-id', 'Hello subscribers!');
```

#### Browser Environment

For client-side real-time data consumption:

```js
// Get token pair first (from your server API, or DataStreams.getTokenPair)
const tokenPair = await fetch('/api/get-token-pair').then(res => res.json());

// Create WebSocket connection
const ws = new DataStreamsWebSocket({
  url: tokenPair.url,
  key: tokenPair.key,
  zuid: tokenPair['wss-id'],
  enableLogging: true
});

// Handle connection events
ws.on('open', (event) => {
  console.log('Connected to data stream');
  // Subscribe to live events (must be called after 'open')
  ws.subscribe('0'); // 0 = live events
});

ws.on('message', (event) => {
  console.log('Received data:', event.data);
  console.log('Streaming ID:', event.streamingId);

  // Send acknowledgement to receive next message
  ws.sendAck();
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', (event) => {
  console.log('Connection closed');
});
```

### WebSocket Connection

The `DataStreamsWebSocket` class provides low-level WebSocket access:

```js
import { DataStreamsWebSocket } from '@zcatalyst/datastreams';

// The connection (wss) starts as soon as the object is created.
// `url` is a host name (e.g. the `url` returned by getTokenPair), not a full URL.
const ws = new DataStreamsWebSocket({ url, key, zuid });

ws.on('open', () => ws.subscribe('0'));
ws.on('message', (event) => {
  console.log('Received message:', event.data);
  ws.sendAck();
});
ws.on('error', (error) => console.error('WebSocket error:', error.code, error.message));
ws.on('close', () => console.log('Disconnected from data stream'));
```

### Environment Support

- **Node.js**: `DataStreams` exposes the admin methods (`getAllChannels`, `getChannelDetails`, `getLiveCount`, `publishData`) in addition to `getTokenPair`. The `ws` library is used for WebSocket connections.
- **Browser**: `DataStreams` exposes only `getTokenPair`. Native WebSocket API is used.

## Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by data stream operations:

```js
// async/await.
try {
  const result = await dataStreams.publishData('channel-id', 'Hello subscribers!');
  // process result.
} catch (error) {
  // error handling.
} finally {
  // finally.
}
```

## Error Handling

When the service returns an exception, the error will include the exception information,
as well as response metadata (e.g. request id).

```js
try {
  await dataStreams.publishData('channel-id', 'Hello subscribers!');
} catch (error) {
  const message = error.message;
  const status = error.statusCode;
  console.log({ message, status });
}
```

## API Reference

### DataStreams Methods

`getTokenPair` is available in Node.js and the browser. The remaining methods are Node.js (admin) only.

<details>
<summary>
Get Token Pair
</summary>

```js
const tokenPair = await dataStreams.getTokenPair('channel-id', {
  userId: 'user123'        // or connectionName: 'connection-name'
});

// Response format
console.log(tokenPair.key);     // WebSocket authentication key
console.log(tokenPair.url);     // WebSocket host
console.log(tokenPair['wss-id']);      // WebSocket session ID
console.log(tokenPair['channel-id']);  // Channel ID
```

</details>

<details>
<summary>
Get All Channels
</summary>

```js
const channels = await dataStreams.getAllChannels();

// Response contains array of all available channels
channels.forEach(channel => {
  console.log('Channel ID:', channel.id);
  console.log('Channel Name:', channel.name);
  console.log('Channel Status:', channel.status);
});
```

</details>

<details>
<summary>
Get Channel Details
</summary>

```js
const channelDetails = await dataStreams.getChannelDetails('channel-id');

console.log('Channel info:', {
  id: channelDetails.id,
  name: channelDetails.name,
  status: channelDetails.status,
  retention: channelDetails.retention,
  created_time: channelDetails.created_time
});
```

</details>

<details>
<summary>
Get Live Connection Count
</summary>

```js
const liveCount = await dataStreams.getLiveCount('channel-id');

console.log('Active connections:', liveCount);
```

</details>

<details>
<summary>
Publish Data to Channel
</summary>

```js
const result = await dataStreams.publishData('channel-id', 'Hello subscribers!');

// Returns true if data was published successfully
if (result) {
  console.log('Data published successfully');
} else {
  console.log('Failed to publish data');
}
```

</details>

### DataStreams WebSocket Methods

<details>
<summary>
Create WebSocket Connection
</summary>

```js
const ws = new DataStreamsWebSocket({
  url: 'websocket-host', // host name from getTokenPair
  key: 'websocket-auth-key',
  zuid: 'user-id',
  enableLogging: true    // Optional: enable debug logging
});
```

</details>

<details>
<summary>
Subscribe to Channel Events
</summary>

```js
// Subscribe to live events (0 = live, -1 = earliest, -2 = resume, streaming-id = specific)
ws.subscribe('0');

// subscribe() throws if the connection is not open yet, so call it from the 'open' handler
ws.on('open', () => {
  ws.subscribe('0');
});
```

</details>

<details>
<summary>
Handle WebSocket Events
</summary>

```js
// Connection established
ws.on('open', (event) => {
  console.log('Connected:', event.message);
});

// Receive data messages
ws.on('message', (event) => {
  console.log('Data:', event.data);
  console.log('Streaming ID:', event.streamingId);

  // Send acknowledgement to receive next message
  ws.sendAck();
});

// Handle errors
ws.on('error', (error) => {
  console.error('Error:', error.code, error.message);

  // Handle specific error codes
  switch (error.code) {
    case 3000: // Authentication failed
      console.log('Please generate new credentials');
      break;
    case 1000: // Session expired
      console.log('Reconnecting with new credentials');
      break;
    case 1013: // Connection blocked
      console.log('Contact support');
      break;
  }
});

// Connection closed
ws.on('close', (event) => {
  console.log('Connection closed');
});

// Pong response (for ping)
ws.on('pong', (event) => {
  console.log('Pong received:', event.message);
});
```

</details>

<details>
<summary>
Unsubscribe from Channel
</summary>

```js
ws.unsubscribe();
```

</details>

<details>
<summary>
Send Acknowledgement
</summary>

```js
// Send acknowledgement to receive next message
ws.sendAck();

// Usually called after processing a message
ws.on('message', (event) => {
  // Process the message
  processData(event.data);

  // Send acknowledgement
  ws.sendAck();
});
```

</details>

<details>
<summary>
Check Connection Status
</summary>

```js
// Check if connected
if (ws.isConnected()) {
  console.log('WebSocket is connected');
}

// Get connection state
const state = ws.getConnectionState();
console.log('Connection state:', state); // 'connected', 'connecting', 'closing', 'closed', 'disconnected'

// Get session info
const session = ws.getSessionInfo();
console.log('Session ID:', session.sid);
console.log('User ID:', session.uid);
```

</details>

<details>
<summary>
Close Connection
</summary>

```js
ws.close();
```

</details>

### Data Format

#### Token Pair Response

```js
{
  "wss-id": "websocket-session-id",
  "channel-id": "channel-id",
  key: "websocket-authentication-key",
  url: "websocket-host"
}
```

#### Channel Information

```js
{
  id: "channel-id",
  name: "channel-name",
  status: "channel-status",
  retention: 0,
  created_time: "...",
  modified_time: "...",
  created_by: { zuid, email_id, user_type },
  modified_by: { zuid, email_id, user_type }
  // also: parentId, service, project_id, control_type, control_ids, source
}
```

#### WebSocket Message Event

```js
{
  data: "message-content",
  streamingId: "unique-streaming-id",
  url: "optional-api-url",     // For API operation messages
  method: "optional-http-method" // For API operation messages
}
```

#### WebSocket Error Event

```js
{
  code: 3000,                  // Error code
  message: "Error description"
}
```

### Common Error Codes

- **3000** - Authentication failed, generate new credentials
- **1000** - Session expired, reconnect with new credentials
- **1013** - Connection blocked, contact support
- **1011** - Server down, retry after a minute
- **1014** - Missing key parameter
- **1006** - Failed to create the WebSocket connection
- **1007** - Invalid host received in a switch-URL message

### Subscribe Types

- **"0"** - Live events (default)
- **"-1"** - Earliest available events
- **"-2"** - Resume from previous session
- **streaming-id** - Specific streaming ID

## Resources

- [Catalyst Data Streams Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/introduction/)
- [Subscribe via WebSocket](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/implementation/subscribe-websocket/)
- [Manage Channels](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/implementation/manage-channels/)
- [Data Streams JavaScript SDK Reference](https://docs.catalyst.zoho.com/en/sdk/javascript/v1/cloudscale/data-streams/get-component-instance/)
- [SDK Documentation](https://docs.catalyst.zoho.com/en/sdk/)

## Contributing

Contributions to this library are always welcome and highly encouraged.

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
