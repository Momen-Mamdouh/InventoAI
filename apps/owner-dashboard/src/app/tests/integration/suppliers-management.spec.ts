import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Suppliers } from '@invento/owner-dashboard-feature-suppliers';
import { SuppliersState, Supplier } from '@invento/owner-dashboard-data-access-supplier';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Suppliers Management Integration Tests', () => {
  let fixture: ComponentFixture<Suppliers>;
  let component: Suppliers;
  let suppliersStateMock: {
    suppliers: ReturnType<typeof signal<Supplier[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    total: ReturnType<typeof signal<number>>;
    page: ReturnType<typeof signal<number>>;
    limit: ReturnType<typeof signal<number>>;
    totalPages: ReturnType<typeof signal<number>>;
    overallTotal: ReturnType<typeof signal<number>>;
    overallActive: ReturnType<typeof signal<number>>;
    overallInactive: ReturnType<typeof signal<number>>;
    atCapacity: ReturnType<typeof signal<boolean>>;
    maxSuppliers: number;
    hasItems: ReturnType<typeof signal<boolean>>;
    loadSuppliers: ReturnType<typeof vi.fn>;
    loadKpis: ReturnType<typeof vi.fn>;
    deleteSupplier: ReturnType<typeof vi.fn>;
    setPage: ReturnType<typeof vi.fn>;
    setLimit: ReturnType<typeof vi.fn>;
    toggleActive: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };

  const mockSuppliers: Supplier[] = [
    {
      id: 'sup-1',
      name: 'Global Tech Distributors',
      contactEmail: 'kareem@globaltech.com',
      phone: '+201099887766',
      leadTimeDays: 5,
      isActive: true,
      notes: 'Key distributor for semiconductors and microchips',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'sup-2',
      name: 'Delta Components Ltd',
      contactEmail: 'hany@deltacomponents.com',
      phone: '+201122334455',
      leadTimeDays: 14,
      isActive: false,
      notes: 'Secondary supplier for enclosures',
      createdAt: '2026-02-15T00:00:00Z',
      updatedAt: '2026-02-15T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    suppliersStateMock = {
      suppliers: signal<Supplier[]>(mockSuppliers),
      loading: signal(false),
      error: signal(null),
      total: signal(2),
      page: signal(1),
      limit: signal(10),
      totalPages: signal(1),
      overallTotal: signal(2),
      overallActive: signal(1),
      overallInactive: signal(1),
      atCapacity: signal(false),
      maxSuppliers: 100,
      hasItems: signal(true),
      loadSuppliers: vi.fn(),
      loadKpis: vi.fn(),
      deleteSupplier: vi.fn(),
      setPage: vi.fn(),
      setLimit: vi.fn(),
      toggleActive: vi.fn(),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Suppliers],
      providers: [
        provideRouter([]),
        { provide: SuppliersState, useValue: suppliersStateMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Suppliers);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Suppliers component and calls state.load on init', () => {
    expect(component).toBeDefined();
    expect(suppliersStateMock.loadSuppliers).toHaveBeenCalled();
    expect(component.suppliers().length).toBe(2);
  });

  it('filters suppliers by column search name query', () => {
    component.colSearchName.set('Global');
    expect(component.displayedSuppliers().length).toBe(1);
    expect(component.displayedSuppliers()[0].name).toContain('Global Tech');

    component.colSearchName.set('Delta');
    expect(component.displayedSuppliers().length).toBe(1);
    expect(component.displayedSuppliers()[0].name).toContain('Delta Components');

    component.colSearchName.set('');
    expect(component.displayedSuppliers().length).toBe(2);
  });

  it('opens and closes slide-over drawer for supplier creation', () => {
    expect(component.isFormOpen()).toBe(false);

    component.onAdd();
    expect(component.isFormOpen()).toBe(true);
    expect(component.editing()).toBeNull();

    component.onCloseForm();
    expect(component.isFormOpen()).toBe(false);
  });

  it('opens edit drawer prefilled with selected supplier data', () => {
    component.onEdit(mockSuppliers[0]);
    expect(component.isFormOpen()).toBe(true);
    expect(component.editing()).toEqual(mockSuppliers[0]);
  });
});
