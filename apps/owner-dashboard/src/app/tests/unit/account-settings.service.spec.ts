import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, firstValueFrom } from 'rxjs';
import { AUTH_CONFIG } from '@invento/shared-data-access-auth';
import { AccountSettingsService } from '@invento/owner-dashboard-feature-account-settings';
import type {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
  ActionMessageResponse,
} from '@invento/owner-dashboard-feature-account-settings';

describe('AccountSettingsService Unit Tests', () => {
  let service: AccountSettingsService;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
  };

  const mockProfile: UserProfile = {
    id: 'usr-123',
    firstName: 'Tariq',
    lastName: 'Mansoor',
    email: 'tariq@example.com',
    image: 'https://example.com/avatar.jpg',
    phone: '+201000000000',
    company: 'Voltix Electronics',
    timeZone: 'Africa/Cairo',
    language: 'ar',
    role: 'owner',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-09-22T00:00:00.000Z',
  };

  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
      patch: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AccountSettingsService,
        { provide: HttpClient, useValue: httpMock },
        { provide: AUTH_CONFIG, useValue: { apiBaseUrl: 'https://api.inventoai.shop' } },
      ],
    });

    service = TestBed.inject(AccountSettingsService);
  });

  it('fetches authenticated profile via GET /users/me', async () => {
    httpMock.get.mockReturnValue(of(mockProfile));

    const result: UserProfile = await firstValueFrom<UserProfile>(service.getProfile());

    expect(result).toEqual(mockProfile);
    expect(httpMock.get).toHaveBeenCalledWith(expect.stringMatching(/\/users\/me$/));
  });

  it('updates profile via PATCH /users/me with partial fields', async () => {
    const payload: UpdateProfilePayload = {
      firstName: 'Tariq',
      lastName: 'Hassan',
      phone: '+201111111111',
    };
    const updatedProfile: UserProfile = { ...mockProfile, ...payload };
    httpMock.patch.mockReturnValue(of(updatedProfile));

    const result: UserProfile = await firstValueFrom<UserProfile>(service.updateProfile(payload));

    expect(result.firstName).toBe('Tariq');
    expect(result.lastName).toBe('Hassan');
    expect(httpMock.patch).toHaveBeenCalledWith(expect.stringMatching(/\/users\/me$/), payload);
  });

  it('changes password via PATCH /users/change-password', async () => {
    const payload: ChangePasswordPayload = {
      oldPassword: 'OldPassword123!',
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    };
    const response: ActionMessageResponse = { message: 'Password updated successfully' };
    httpMock.patch.mockReturnValue(of(response));

    const result: ActionMessageResponse = await firstValueFrom<ActionMessageResponse>(
      service.changePassword(payload),
    );

    expect(result.message).toBe('Password updated successfully');
    expect(httpMock.patch).toHaveBeenCalledWith(
      expect.stringMatching(/\/users\/change-password$/),
      payload,
    );
  });
});
