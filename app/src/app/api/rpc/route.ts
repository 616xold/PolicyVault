import { NextResponse } from 'next/server.js';

import { projectConfig } from '../../../lib/config.js';

export const dynamic = 'force-dynamic';

function buildProxyHeaders(contentType: string | null) {
  return {
    'Cache-Control': 'no-store',
    'Content-Type': contentType ?? 'application/json',
  };
}

export async function POST(request: Request) {
  const body = await request.text();

  try {
    const response = await fetch(projectConfig.rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      cache: 'no-store',
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: buildProxyHeaders(response.headers.get('Content-Type')),
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: -32000,
          message: 'Local RPC proxy unavailable',
        },
        id: null,
        jsonrpc: '2.0',
      },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    },
  });
}
