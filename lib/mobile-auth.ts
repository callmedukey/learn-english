import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.AUTH_SECRET);

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  nickname: string | null;
  hasPaidSubscription: boolean;
}

export async function verifyMobileToken(
  request: Request
): Promise<JWTPayload | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
