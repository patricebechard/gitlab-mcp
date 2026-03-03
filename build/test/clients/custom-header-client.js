/**
 * Custom Header MCP Client for Testing Remote Authorization
 * Extends StreamableHTTPTestClient to support custom headers
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
/**
 * MCP client with support for custom HTTP headers
 * Useful for testing remote authorization scenarios
 */
export class CustomHeaderClient {
    client;
    transport = null;
    customHeaders;
    timeout;
    constructor(options = {}) {
        // Support both old signature (headers only) and new options object
        if ('headers' in options || 'timeout' in options || 'clientName' in options) {
            const opts = options;
            this.customHeaders = opts.headers || {};
            this.timeout = opts.timeout || 30000;
            this.client = new Client({
                name: opts.clientName || "test-client-with-headers",
                version: opts.clientVersion || "1.0.0"
            });
        }
        else {
            // Backward compatible: treat options as headers record
            this.customHeaders = options;
            this.timeout = 30000;
            this.client = new Client({ name: "test-client-with-headers", version: "1.0.0" });
        }
    }
    /**
     * Connect to MCP server with custom headers
     */
    async connect(url) {
        if (this.transport) {
            throw new Error('Client is already connected');
        }
        try {
            this.transport = new StreamableHTTPClientTransport(new URL(url), {
                requestInit: {
                    headers: this.customHeaders
                }
            });
            await this.client.connect(this.transport);
        }
        catch (error) {
            this.transport = null;
            throw new Error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Disconnect from server
     */
    async disconnect() {
        if (this.transport) {
            try {
                await this.transport.close();
            }
            catch (error) {
                // Silently ignore disconnect errors in tests
                // In production, you'd want proper logging
            }
            finally {
                this.transport = null;
            }
        }
    }
    /**
     * Get session ID from transport (useful for testing)
     */
    getSessionId() {
        return this.transport?.sessionId;
    }
    /**
     * Update custom headers (creates new connection if already connected)
     */
    setHeaders(headers) {
        if (this.transport) {
            throw new Error('Cannot update headers while connected. Disconnect first.');
        }
        this.customHeaders = headers;
    }
    /**
     * List available tools from server
     */
    async listTools() {
        if (!this.transport) {
            throw new Error('Client is not connected');
        }
        try {
            const response = await this.client.listTools();
            return response;
        }
        catch (error) {
            throw new Error(`Failed to list tools: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Call a tool on the server
     */
    async callTool(name, arguments_ = {}) {
        if (!this.transport) {
            throw new Error('Client is not connected');
        }
        try {
            const response = await this.client.callTool({ name, arguments: arguments_ });
            return response;
        }
        catch (error) {
            throw new Error(`Failed to call tool '${name}': ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get client connection status
     */
    get isConnected() {
        return this.transport !== null;
    }
}
