import { NextRequest, NextResponse } from 'next/server';

interface ErrorLogData {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
  sessionId?: string;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 50; // Max 50 error reports per 15 minutes per IP

  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

function sanitizeErrorData(data: any): ErrorLogData {
  return {
    message: String(data.message || 'Unknown error').slice(0, 1000),
    stack: data.stack ? String(data.stack).slice(0, 5000) : undefined,
    componentStack: data.componentStack ? String(data.componentStack).slice(0, 5000) : undefined,
    timestamp: data.timestamp || new Date().toISOString(),
    userAgent: String(data.userAgent || 'Unknown').slice(0, 500),
    url: String(data.url || 'Unknown').slice(0, 500),
    userId: data.userId ? String(data.userId).slice(0, 100) : undefined,
    sessionId: data.sessionId ? String(data.sessionId).slice(0, 100) : undefined,
  };
}

function logError(errorData: ErrorLogData, ip: string) {
  // In production, you would send this to your logging service
  // Examples: Winston, Pino, external services like Datadog, New Relic, etc.
  
  const logEntry = {
    level: 'error',
    timestamp: errorData.timestamp,
    message: 'Client-side error',
    error: {
      message: errorData.message,
      stack: errorData.stack,
      componentStack: errorData.componentStack,
    },
    context: {
      userAgent: errorData.userAgent,
      url: errorData.url,
      userId: errorData.userId,
      sessionId: errorData.sessionId,
      clientIP: ip,
    },
  };

  // Console log for development/debugging
  console.error('Client Error Report:', JSON.stringify(logEntry, null, 2));

  // In production, send to external logging service
  if (process.env.NODE_ENV === 'production') {
    // Example integrations:
    
    // Sentry
    // Sentry.captureException(new Error(errorData.message), {
    //   extra: logEntry.context,
    //   tags: { source: 'client' }
    // });
    
    // Datadog
    // datadogLogger.error(errorData.message, logEntry.context);
    
    // Custom webhook
    // fetch(process.env.ERROR_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry)
    // }).catch(console.error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Rate limiting
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const errorData = sanitizeErrorData(body);
    
    // Validate required fields
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the error
    logError(errorData, clientIP);

    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Error in log-error endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}