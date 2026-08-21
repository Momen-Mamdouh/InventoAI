export interface User {
  id: string;
  firstName: string;
  lastName: string;
  image: string | null;
  email: string;
  role: string;
  storeId?: string | null;
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
