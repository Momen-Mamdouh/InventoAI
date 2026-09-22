import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import {
  Profile,
  Security,
  BillingPlan,
  MyStores,
  AccountSettingsService,
  UserProfile,
} from '@invento/owner-dashboard-feature-account-settings';
import { AuthService, User } from '@invento/shared-data-access-auth';
import { StoreService } from '@invento/owner-dashboard-data-access-store';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Account Settings Integration Tests', () => {
  let accountSettingsServiceMock: {
    getProfile: ReturnType<typeof vi.fn>;
    updateProfile: ReturnType<typeof vi.fn>;
    changePassword: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    currentUser: ReturnType<typeof signal<User | null>>;
    getStoreSlug: ReturnType<typeof vi.fn>;
    setCurrentUser: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
    setLocale: ReturnType<typeof vi.fn>;
  };

  const mockUserProfile: UserProfile = {
    id: 'user-001',
    firstName: 'Tariq',
    lastName: 'Mansoor',
    email: 'tariq@voltix.shop',
    image: 'https://example.com/avatar.png',
    phone: '+201012345678',
    company: 'Voltix Electronics',
    timeZone: 'Africa/Cairo',
    language: 'ar',
    role: 'owner',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z',
  };

  const mockAuthUser: User = {
    id: 'user-001',
    firstName: 'Tariq',
    lastName: 'Mansoor',
    email: 'tariq@voltix.shop',
    role: 'owner',
    image: 'https://example.com/avatar.png',
    storeSlug: 'voltix',
    isEmailVerified: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    accountSettingsServiceMock = {
      getProfile: vi.fn().mockReturnValue(of(mockUserProfile)),
      updateProfile: vi.fn().mockReturnValue(of(mockUserProfile)),
      changePassword: vi.fn().mockReturnValue(of({ message: 'Password updated successfully' })),
    };

    authServiceMock = {
      currentUser: signal<User | null>(mockAuthUser),
      setCurrentUser: vi.fn((user: User) => {
        authServiceMock.currentUser.set(user);
      }),
      getStoreSlug: vi.fn().mockReturnValue('voltix'),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
      setLocale: vi.fn(),
    };
  });

  describe('Profile Component', () => {
    let fixture: ComponentFixture<Profile>;
    let component: Profile;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [Profile],
        providers: [
          provideRouter([]),
          { provide: AccountSettingsService, useValue: accountSettingsServiceMock },
          { provide: AuthService, useValue: authServiceMock },
          { provide: LocaleService, useValue: localeServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(Profile);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates Profile component and populates form signals from backend response', () => {
      expect(component).toBeDefined();
      expect(accountSettingsServiceMock.getProfile).toHaveBeenCalled();
      expect(component.fullName()).toBe('Tariq Mansoor');
      expect(component.email()).toBe('tariq@voltix.shop');
      expect(component.company()).toBe('Voltix Electronics');
    });

    it('updates profile through save action and updates AuthService currentUser signal', () => {
      const updatedProfile = { ...mockUserProfile, firstName: 'Tariq', lastName: 'Omar' };
      accountSettingsServiceMock.updateProfile.mockReturnValue(of(updatedProfile));

      component.fullName.set('Tariq Omar');
      component.saveChanges();

      expect(accountSettingsServiceMock.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: 'Tariq', lastName: 'Omar' }),
      );
      expect(authServiceMock.currentUser()?.firstName).toBe('Tariq');
      expect(authServiceMock.currentUser()?.lastName).toBe('Omar');
    });
  });

  describe('Security Component', () => {
    let fixture: ComponentFixture<Security>;
    let component: Security;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [Security],
        providers: [
          provideRouter([]),
          { provide: AccountSettingsService, useValue: accountSettingsServiceMock },
          { provide: LocaleService, useValue: localeServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(Security);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates Security component and sets active session card details', () => {
      expect(component).toBeDefined();
      expect(component.sessions().length).toBeGreaterThan(0);
      expect(component.updating()).toBe(false);
    });

    it('submits password change and displays success feedback', () => {
      component.currentPassword.set('CurrentPass123!');
      component.newPassword.set('BrandNewPass123!');
      component.confirmPassword.set('BrandNewPass123!');

      component.updatePassword();

      expect(accountSettingsServiceMock.changePassword).toHaveBeenCalledWith({
        oldPassword: 'CurrentPass123!',
        newPassword: 'BrandNewPass123!',
        confirmPassword: 'BrandNewPass123!',
      });
      expect(component.passwordSuccess()).toBe('Password updated successfully');
    });
  });

  describe('BillingPlan Component', () => {
    let fixture: ComponentFixture<BillingPlan>;
    let component: BillingPlan;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [BillingPlan],
        providers: [provideRouter([]), { provide: LocaleService, useValue: localeServiceMock }],
      }).compileComponents();

      fixture = TestBed.createComponent(BillingPlan);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates BillingPlan component and initializes current plan', () => {
      expect(component).toBeDefined();
      expect(component.plan().name).toBe('Invento Pro');
      expect(component.invoices().length).toBeGreaterThan(0);
    });
  });

  describe('MyStores Component', () => {
    let fixture: ComponentFixture<MyStores>;
    let component: MyStores;
    let storeServiceMock: {
      getMyStore: ReturnType<typeof vi.fn>;
    };

    beforeEach(async () => {
      storeServiceMock = {
        getMyStore: vi.fn().mockReturnValue(
          of({
            id: 'store-1',
            name: 'Voltix',
            slug: 'voltix',
            description: 'My store description',
            status: 'live',
            heroImageUrl: null,
            createdAt: '2026-01-01T00:00:00Z',
          }),
        ),
      };

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [MyStores],
        providers: [
          provideRouter([]),
          { provide: StoreService, useValue: storeServiceMock },
          { provide: AuthService, useValue: authServiceMock },
          { provide: LocaleService, useValue: localeServiceMock },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(MyStores);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates MyStores component and resolves active store data', () => {
      expect(component).toBeDefined();
      expect(storeServiceMock.getMyStore).toHaveBeenCalled();
      expect(component.stores().length).toBe(1);
      expect(component.stores()[0].slug).toBe('voltix');
      expect(component.hasStore()).toBe(true);
    });
  });
});
