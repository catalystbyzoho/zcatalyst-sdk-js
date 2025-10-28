interface ICatalystConnectionsResponse {
	connections: {
		headers: Record<string, string>;
		parameters: Record<string, string>;
	};
}
