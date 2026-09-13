import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import {
  AccountSettingsProfile,
  AccountSettingsSecurity,
} from '@invento/user-site-feature-account-settings';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { StoreSlugService } from '@invento/user-site-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';

const MOCK_USER: User = {
  id: 'user-42',
  email: 'shikha@layali.com',
  firstName: 'Shikha',
  lastName: 'Al-Mansoor',
  image: null,
  role: 'customer',
  isEmailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Account Settings Integration Tests', () => {
  let mockAuthService: Partial<AuthService>;
  let mockStoreSlugService: Partial<StoreSlugService>;
  let mockLocaleService: Partial<LocaleService>;

  beforeEach(() => {
    mockAuthService = {
      currentUser: signal<User | null>(MOCK_USER),
      changePassword: vi.fn().mockReturnValue(of(void 0)),
      logout: vi.fn(),
    };

    mockStoreSlugService = {
      slug: signal('layali'),
    };

    mockLocaleService = {
      isRtl: signal(false),
      locale: signal('en'),
      translate: vi.fn((k: string) => k),
    };
  });

  describe('AccountSettingsProfile Component', () => {
    let fixture: ComponentFixture<AccountSettingsProfile>;
    let component: AccountSettingsProfile;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AccountSettingsProfile],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: mockAuthService },
          { provide: StoreSlugService, useValue: mockStoreSlugService },
          { provide: LocaleService, useValue: mockLocaleService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AccountSettingsProfile);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates profile component and computes user initials correctly', () => {
      expect(component).toBeTruthy();
      expect(component.currentUser()?.email).toBe('shikha@layali.com');
      expect(component.initials()).toBe('SA');
    });

    it('toggles password change modal state', () => {
      expect(component.isPasswordModalOpen()).toBe(false);
      component.openPasswordModal();
      expect(component.isPasswordModalOpen()).toBe(true);

      component.closePasswordModal();
      expect(component.isPasswordModalOpen()).toBe(false);
    });

    it('evaluates password strength rules in real-time as user types', () => {
      component.passwordForm.patchValue({
        currentPassword: 'oldPassword1',
        newPassword: 'short',
        confirmPassword: 'short',
      });

      expect(component.hasMinLength()).toBe(false);
      expect(component.hasLetterAndNumber()).toBe(false);

      component.passwordForm.patchValue({
        newPassword: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      });

      expect(component.hasMinLength()).toBe(true);
      expect(component.hasLetterAndNumber()).toBe(true);
      expect(component.passwordsMatch()).toBe(true);
    });

    it('submits password change through authService when valid', () => {
      component.openPasswordModal();
      component.passwordForm.setValue({
        currentPassword: 'oldPassword1',
        newPassword: 'NewStrongPassword123!',
        confirmPassword: 'NewStrongPassword123!',
      });

      component.savePassword();
      expect(mockAuthService.changePassword).toHaveBeenCalledWith({
        oldPassword: 'oldPassword1',
        newPassword: 'NewStrongPassword123!',
        confirmPassword: 'NewStrongPassword123!',
      });
      expect(component.isPasswordModalOpen()).toBe(false);
    });
  });

  describe('AccountSettingsSecurity Component', () => {
    let fixture: ComponentFixture<AccountSettingsSecurity>;
    let component: AccountSettingsSecurity;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [AccountSettingsSecurity],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: mockAuthService },
          { provide: LocaleService, useValue: mockLocaleService },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AccountSettingsSecurity);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates security component and validates matching passwords on form', () => {
      expect(component).toBeTruthy();

      component.form.setValue({
        currentPassword: 'CurrentPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'MismatchPassword',
      });

      expect(component.form.valid).toBe(false);
      expect(component.passwordsMatch()).toBe(false);

      component.form.patchValue({
        confirmPassword: 'NewPassword123',
      });

      expect(component.passwordsMatch()).toBe(true);
    });
  });
});
