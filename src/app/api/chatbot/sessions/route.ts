import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id } = body;

    // Forward request to external chatbot API
    const response = await fetch('http://34.28.155.240:7000/api/v1/chat/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: session_id || `session_${Date.now()}`
      })
    });

    if (!response.ok) {
      // Fallback session creation
      const fallbackSessionId = session_id || `session_${Date.now()}`;
      return NextResponse.json({
        success: true,
        data: {
          id: fallbackSessionId,
          startTime: new Date().toISOString(),
          messages: []
        }
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Session creation error:', error);
    
    // Fallback session creation
    const fallbackSessionId = `session_${Date.now()}`;
    return NextResponse.json({
      success: true,
      data: {
        id: fallbackSessionId,
        startTime: new Date().toISOString(),
        messages: []
      }
    });
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Chatbot sessions endpoint is active. Use POST to create sessions.' },
    { status: 200 }
  );
}