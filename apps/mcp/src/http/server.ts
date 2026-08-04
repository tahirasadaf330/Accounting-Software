/**
 * HTTP surface (Guide 2.1 / 4.3 / 7.3):
 *   POST /mcp     MCP over streamable HTTP. Session-managed transport (the SDK's
 *                 canonical pattern) so compliant clients can do
 *                 initialize -> tools/list -> tools/call across requests.
 *   GET  /mcp     server->client SSE stream for an existing session.
 *   DELETE /mcp   explicit session termination.
 *   GET  /health  liveness, unauthenticated, no data.
 *   GET  /ready   readiness — checks DB connectivity (read-only + audit pools).
 *
 * STATELESS AUTHORIZATION: the session map holds ONLY transport plumbing — no
 * authorization or business data. EVERY tool call is independently re-authorized
 * from the request headers by the Part-V runner (Guide 2.1 / 3.5). Nothing about
 * who-may-see-what is remembered between calls.
 *
 * Binds to the INTERNAL interface only; the port must additionally be firewalled
 * to the Atlas host IP(s). A small HTTP body cap rejects oversized payloads fast.
 */
import { randomUUID } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { buildServer } from '../mcp/server.js';
import { config } from '../config.js';
import { log } from '../logging.js';
import { roPool, auditPool } from '../db/pools.js';

const MAX_SESSIONS = 500;
const transports = new Map<string, StreamableHTTPServerTransport>();

class BodyTooLargeError extends Error {}

function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new BodyTooLargeError());
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, obj: unknown): void {
  const body = Buffer.from(JSON.stringify(obj));
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': body.length });
  res.end(body);
}

function firstHeader(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function rpcError(res: ServerResponse, status: number, code: number, message: string): void {
  sendJson(res, status, { jsonrpc: '2.0', error: { code, message }, id: null });
}

async function handleMcpPost(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body: Buffer;
  try {
    body = await readBody(req, config.httpBodyLimit);
  } catch {
    rpcError(res, 413, -32600, 'Payload too large');
    return;
  }

  let parsed: unknown;
  try {
    parsed = body.length ? JSON.parse(body.toString('utf8')) : undefined;
  } catch {
    rpcError(res, 400, -32700, 'Parse error');
    return;
  }

  const sessionId = firstHeader(req.headers['mcp-session-id']);
  const existing = sessionId ? transports.get(sessionId) : undefined;

  let transport: StreamableHTTPServerTransport;
  if (existing) {
    transport = existing;
  } else {
    if (sessionId) {
      rpcError(res, 404, -32001, 'Session not found');
      return;
    }
    if (!isInitializeRequest(parsed)) {
      rpcError(res, 400, -32000, 'No valid session ID provided');
      return;
    }
    if (transports.size >= MAX_SESSIONS) {
      rpcError(res, 503, -32000, 'Server busy');
      return;
    }
    // New session: build a fresh server + transport on initialize.
    const server = buildServer();
    const newTransport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sid: string) => {
        transports.set(sid, newTransport);
      },
    });
    newTransport.onclose = () => {
      const sid = newTransport.sessionId;
      if (sid) transports.delete(sid);
    };
    try {
      await server.connect(newTransport);
    } catch (e) {
      log.error(null, 'failed to connect mcp server', e);
      rpcError(res, 500, -32603, 'Internal error');
      return;
    }
    transport = newTransport;
  }

  try {
    await transport.handleRequest(req, res, parsed);
  } catch (e) {
    log.error(null, 'mcp POST handling error', e);
    if (!res.headersSent) rpcError(res, 500, -32603, 'Internal error');
  }
}

async function handleMcpSession(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const sessionId = firstHeader(req.headers['mcp-session-id']);
  const transport = sessionId ? transports.get(sessionId) : undefined;
  if (!transport) {
    rpcError(res, 404, -32001, 'Session not found');
    return;
  }
  try {
    await transport.handleRequest(req, res);
  } catch (e) {
    log.error(null, 'mcp session handling error', e);
    if (!res.headersSent) rpcError(res, 500, -32603, 'Internal error');
  }
}

async function handleReady(res: ServerResponse): Promise<void> {
  try {
    await roPool.query('SELECT 1');
    if (auditPool) await auditPool.query('SELECT 1');
    sendJson(res, 200, { status: 'ready' });
  } catch (e) {
    log.warn(null, 'readiness check failed', e);
    sendJson(res, 503, { status: 'unavailable' });
  }
}

export function startHttpServer(): Server {
  const srv = createServer((req, res) => {
    const path = (req.url ?? '').split('?')[0];

    if (req.method === 'GET' && path === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }
    if (req.method === 'GET' && path === '/ready') {
      void handleReady(res);
      return;
    }
    if (path === '/mcp') {
      if (req.method === 'POST') void handleMcpPost(req, res);
      else if (req.method === 'GET' || req.method === 'DELETE') void handleMcpSession(req, res);
      else rpcError(res, 405, -32000, 'Method not allowed');
      return;
    }
    sendJson(res, 404, { error: 'not found' });
  });

  srv.listen(config.port, config.host, () => {
    log.info(null, `${config.systemSlug}-mcp listening on http://${config.host}:${config.port} (path /mcp)`);
  });
  return srv;
}
