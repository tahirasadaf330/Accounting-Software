/**
 * Tiny MCP client for driving the connector by hand WITHOUT Atlas (Guide 8.2).
 * Sets the two identity headers and runs initialize -> tools/list -> tools/call.
 *
 *   pnpm --filter mcp smoke                         # OWNER (default user), accounting_describe
 *   pnpm --filter mcp smoke ali@hayo.net            # a different user
 *   pnpm --filter mcp smoke --bad-secret            # wrong agent key -> denial
 *   pnpm --filter mcp smoke --no-user               # missing user id -> denial
 *   pnpm --filter mcp smoke ali@hayo.net --tool accounting_describe --args {}
 */
import 'dotenv/config';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function getFlagValue(args: string[], flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const target = process.env.MCP_URL || 'http://127.0.0.1:7801/mcp';
  const secret = process.env.ATLAS_MCP_SECRET || '';
  const badSecret = args.includes('--bad-secret');
  const noUser = args.includes('--no-user');
  const user = args.find((a) => a.includes('@')) || 'tahira.sadaf@kingrevolution.com';
  const tool = getFlagValue(args, '--tool') || 'accounting_describe';
  const toolArgs = JSON.parse(getFlagValue(args, '--args') || '{}');

  const headers: Record<string, string> = {
    'x-atlas-agent-key': badSecret ? 'definitely-the-wrong-secret-value-0000000000' : secret,
    'x-atlas-request-id': 'smoke-' + Math.random().toString(36).slice(2, 10),
  };
  if (!noUser) headers['x-atlas-user-id'] = user;

  const transport = new StreamableHTTPClientTransport(new URL(target), { requestInit: { headers } });
  const client = new Client({ name: 'accounting-smoke', version: '0.0.0' });
  await client.connect(transport);

  console.log('── scenario:', JSON.stringify({ user: noUser ? '(none)' : user, badSecret, tool }));
  const tools = await client.listTools();
  console.log('tools/list:', tools.tools.map((t) => t.name).join(', '));

  const res = (await client.callTool({ name: tool, arguments: toolArgs })) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (res.content ?? []).map((c) => c.text ?? '').join('\n');
  console.log(`${tool} ->`);
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }

  await client.close();
}

main().catch((e) => {
  console.error('smoke error:', (e as Error).message);
  process.exit(1);
});
