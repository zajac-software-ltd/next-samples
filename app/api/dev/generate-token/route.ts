import { NextRequest, NextResponse } from "next/server";
import { generateServiceToken, SERVICE_SCOPES } from "@/lib/service-auth";
import { z } from "zod";

const generateTokenSchema = z.object({
  issuer: z.string().default('postman-test'),
  scopes: z.array(z.string()).default(['user:read', 'user:create', 'invite:send']),
  expiresIn: z.string().default('24h'),
});

/**
 * Development endpoint to generate service tokens for testing
 * This should be disabled in production
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Token generation endpoint disabled in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validationResult = generateTokenSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { issuer, scopes, expiresIn } = validationResult.data;

    // Validate scopes
    const validScopes = Object.values(SERVICE_SCOPES) as string[];
    const invalidScopes = scopes.filter(scope => !validScopes.includes(scope));
    
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: 'Invalid scopes', invalidScopes, validScopes },
        { status: 400 }
      );
    }

    // Generate token
    const token = generateServiceToken(issuer, scopes, expiresIn);
    
    // Calculate expiration
    const expiresInMs = parseExpiration(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);

    return NextResponse.json({
      token,
      issuer,
      scopes,
      expiresIn,
      expiresAt: expiresAt.toISOString(),
      usage: {
        header: `Authorization: Bearer ${token}`,
        curlExample: `curl -H "Authorization: Bearer ${token}" ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/service/users`
      }
    });

  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    );
  }
}

/**
 * Get available scopes and example requests
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Token generation endpoint disabled in production' },
      { status: 403 }
    );
  }

  const availableScopes = Object.values(SERVICE_SCOPES);
  
  return NextResponse.json({
    availableScopes,
    examples: {
      generateToken: {
        method: 'POST',
        url: '/api/dev/generate-token',
        body: {
          issuer: 'postman-test',
          scopes: ['user:read', 'user:create'],
          expiresIn: '1h'
        }
      },
      useToken: {
        method: 'GET',
        url: '/api/service/users',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE'
        }
      }
    },
    endpoints: {
      standard: [
        'GET /api/service/users',
        'POST /api/service/users',
        'GET /api/service/invites',
        'POST /api/service/invites',
        'GET /api/service/sessions',
        'POST /api/service/sessions'
      ],
      enhanced: [
        'GET /api/service/secure/users',
        'POST /api/service/secure/users'
      ]
    }
  });
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
