import { NextRequest, NextResponse } from "next/server";
import { generateServiceToken, SERVICE_SCOPES } from "@/lib/service-auth";
import { z } from "zod";

const tokenRequestSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  scopes: z.array(z.string()),
  expiresIn: z.string().default('24h'),
});

/**
 * Token exchange endpoint for trusted applications
 * POST /api/service/token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = tokenRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { clientId, clientSecret, scopes, expiresIn } = validationResult.data;

    // Validate client credentials (you'd store these securely)
    const validClients: Record<string, string | undefined> = {
      'main-app': process.env.MAIN_APP_CLIENT_SECRET,
      // Add more clients as needed
    };

    if (!validClients[clientId] || validClients[clientId] !== clientSecret) {
      return NextResponse.json(
        { error: 'Invalid client credentials' },
        { status: 401 }
      );
    }

    // Validate requested scopes
    const validScopes = Object.values(SERVICE_SCOPES) as string[];
    const invalidScopes = scopes.filter(scope => !validScopes.includes(scope));
    
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: 'Invalid scopes', invalidScopes },
        { status: 400 }
      );
    }

    // Generate token
    const token = generateServiceToken(clientId, scopes, expiresIn);
    
    // Calculate expiration timestamp
    const expiresInMs = parseExpiration(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);

    return NextResponse.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: Math.floor(expiresInMs / 1000), // seconds
      expires_at: expiresAt.toISOString(),
      scope: scopes.join(' '),
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseExpiration(expiresIn: string): number {
  const units: Record<string, number> = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
  };

  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error('Invalid expiration format');

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}
