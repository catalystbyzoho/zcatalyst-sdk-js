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
- Understanding of [WebSocket communication](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/websocket/)
- Token pair generation for authentication

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
// Get token pair first (from server API)
const tokenPair = await fetch('/api/get-token-pair').then(res => res.json());

// Create WebSocket connection
const ws = new DataStreamsWebSocket({
  url: tokenPair.url,
  key: tokenPair.key,
  zuid: tokenPair.zuid,
  enableLogging: true
});

// Handle connection events
ws.on('open', (event) => {
  console.log('Connected to data stream');
  // Subscribe to live events
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

// Create WebSocket connection
const ws = new DataStreamsWebSocket('ws://localhost:8080/stream');

// Handle connection events
ws.on('open', () => {
  console.log('Connected to data stream');
});

ws.on('message', (data) => {
  console.log('Received message:', data);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Disconnected from data stream');
});

// Send message
ws.send(JSON.stringify({ type: 'ping' }));
```

### Environment Support

This package automatically detects the environment and uses appropriate WebSocket implementations:

- **Node.js**: Uses `ws` WebSocket library
- **Browser**: Uses native WebSocket API

## Async/await

We recommend using [await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to wait for the promise returned by data stream operations:

```js
// async/await.
try {
  const stream = await dataStreams.create(config);
  // process stream creation.
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
  const stream = await dataStreams.create(config);
  // process stream.
} catch (error) {
  const message = error.message;
  const status = error.statusCode;
  console.log({ message, status });
}
```

## API Reference

### DataStreams Admin Methods

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
console.log(tokenPair.zuid);    // User ID for WebSocket connection
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
  console.log('Channel Description:', channel.description);
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
  description: channelDetails.description,
  created_at: channelDetails.created_at,
  status: channelDetails.status
});
```

</details>

<details>
<summary>
Get Live Connection Count
</summary>

```js
const liveCount = await dataStreams.getLiveCount('channel-id');

console.log('Active connections:', liveCount.count);
console.log('Last updated:', liveCount.timestamp);
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
  url: 'us4-dms.zoho.com',
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

// Subscribe after connection is established
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
console.log('Connection state:', state); // 'connected', 'connecting', 'closing', 'closed'

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
  key: "websocket-authentication-key",
  zuid: "user-identifier"
}
```

#### Channel Information

```js
{
  id: "channel-id",
  name: "channel-name",
  description: "channel-description",
  created_at: "2023-01-01T00:00:00.000Z",
  status: "active"
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

### Subscribe Types

- **"0"** - Live events (default)
- **"-1"** - Earliest available events
- **"-2"** - Resume from previous session
- **streaming-id** - Specific streaming ID

## Resources

- [Catalyst Data Streams Documentation](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/introduction/)
- [WebSocket Communication](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/websocket/)
- [Channel Management](https://docs.catalyst.zoho.com/en/cloud-scale/help/data-streams/channel-management/)
- [Data Streams SDK Reference](https://docs.catalyst.zoho.com/en/sdk/server-side-sdks/node-js-sdk/data-streams/)
- [SDK Documentation](https://docs.catalyst.zoho.com/en/sdk/)

## Contributing

Contributions to this library are always welcome and highly encouraged.

See [CONTRIBUTING](../../CONTRIBUTING.md) for more information on how to get started.

## License

This SDK is distributed under the Apache License 2.0. See [LICENSE](../../LICENCE) file for more information.
