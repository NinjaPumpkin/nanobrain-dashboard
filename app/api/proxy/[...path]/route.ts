import { NextRequest, NextResponse } from 'next/server';

const VPS_URL = process.env.NANOBRAIN_VPS_URL;
const API_TOKEN = process.env.NANOBRAIN_API_TOKEN;

async function proxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>
): Promise<NextResponse> {
  if (!VPS_URL || !API_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'Proxy not configured: missing VPS_URL or API_TOKEN' },
      { status: 500 }
    );
  }

  const { path } = await params;
  const targetPath = path.join('/');
  const url = new URL(`/api/${targetPath}`, VPS_URL);

  // Forward query string parameters
  const searchParams = request.nextUrl.searchParams;
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: HeadersInit = {
    'Authorization': `Bearer ${API_TOKEN}`,
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  };

  // Forward body for non-GET requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    fetchOptions.body = await request.text();
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);
    const data = await response.text();

    const responseHeaders = new Headers();
    const upstreamContentType = response.headers.get('content-type');
    if (upstreamContentType) {
      responseHeaders.set('content-type', upstreamContentType);
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `VPS unreachable: ${message}` },
      { status: 502 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, context.params);
}
