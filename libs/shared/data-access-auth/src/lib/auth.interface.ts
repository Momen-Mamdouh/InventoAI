/**
 * Superset of the three apps' `auth.interface.ts` (invento 37 lines, site-builder 36, userSite
 * 31 — research.md R7). `storeId`/`storeSlug` are optional because only invento's JWTs and
 * responses carry them; every other app simply never populates them.
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  image: string | null;
  email: string;
  role: string;
  storeId?: string | null;
  storeSlug?: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
