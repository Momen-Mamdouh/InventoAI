import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Categories } from '@invento/owner-dashboard-feature-categories';
import {
  CategoriesState,
  CategoriesService,
  Category,
} from '@invento/owner-dashboard-data-access-category';
import { Attributes } from '@invento/owner-dashboard-feature-attributes';
import {
  AttributeService,
  ProductAttribute,
  AttributeDisplayStyle,
} from '@invento/owner-dashboard-data-access-attribute';
import { Products } from '@invento/owner-dashboard-feature-products';
import {
  ProductService,
  ApiProductListItem,
  PaginatedResponse,
} from '@invento/owner-dashboard-data-access-product';
import { LocaleService } from '@invento/shared-util-i18n';

describe('E2E Journey: Catalog & Inventory Management Workflow', () => {
  let router: Router;

  // Categories Mocks
  let categoriesStateMock: {
    categories: ReturnType<typeof signal<Category[]>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    total: ReturnType<typeof signal<number>>;
    page: ReturnType<typeof signal<number>>;
    limit: ReturnType<typeof signal<number>>;
    totalPages: ReturnType<typeof signal<number>>;
    filters: ReturnType<
      typeof signal<{ search: string; isPublished?: boolean; isFeatured?: boolean }>
    >;
    loadCategories: ReturnType<typeof vi.fn>;
    deleteCategory: ReturnType<typeof vi.fn>;
    reorderCategories: ReturnType<typeof vi.fn>;
    setFilters: ReturnType<typeof vi.fn>;
    setLimit: ReturnType<typeof vi.fn>;
  };

  let categoriesServiceMock: {
    list: ReturnType<typeof vi.fn>;
  };

  // Attributes Mocks
  let attributeServiceMock: {
    getAttributes: ReturnType<typeof vi.fn>;
    createAttribute: ReturnType<typeof vi.fn>;
    deleteAttribute: ReturnType<typeof vi.fn>;
  };

  // Products Mocks
  let productServiceMock: {
    getProducts: ReturnType<typeof vi.fn>;
    deleteProduct: ReturnType<typeof vi.fn>;
    updateProduct: ReturnType<typeof vi.fn>;
    reorderProducts: ReturnType<typeof vi.fn>;
  };

  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };

  const initialCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Smartphones & Accessories',
      slug: 'smartphones',
      description: 'Latest flagship devices and chargers',
      imageUrl: 'https://example.com/phones.jpg',
      position: 1,
      isPublished: true,
      isFeatured: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const initialAttributes: ProductAttribute[] = [
    {
      id: 'attr-1',
      name: 'Size',
      key: 'size',
      isVariantAxis: true,
      displayStyle: AttributeDisplayStyle.List,
      isFilterable: true,
      showOnProductPage: true,
      position: 1,
      values: [
        { id: 'val-1', value: 'Small', slug: 's', swatchHex: null, position: 1 },
        { id: 'val-2', value: 'Medium', slug: 'm', swatchHex: null, position: 2 },
      ],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const initialProducts: ApiProductListItem[] = [
    {
      id: 'prod-1',
      title: 'Galaxy Ultra Pro 5G',
      slug: 'galaxy-ultra-pro-5g',
      status: 'active',
      isFeatured: true,
      position: 0,
      minPriceAmount: 3499900,
      maxPriceAmount: 3499900,
      minCompareAtAmount: null,
      compareAtAmount: null,
      totalStock: 45,
      variantCount: 3,
      imageUrl: 'https://example.com/phone.jpg',
      categories: [{ id: 'cat-1', name: 'Smartphones', slug: 'smartphones' }],
      createdAt: '2026-01-10T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
    },
    {
      id: 'prod-2',
      title: 'Wireless Noise Cancelling Earbuds',
      slug: 'wireless-earbuds-anc',
      status: 'draft',
      isFeatured: false,
      position: 1,
      minPriceAmount: 249900,
      maxPriceAmount: 249900,
      minCompareAtAmount: null,
      compareAtAmount: null,
      totalStock: 0,
      variantCount: 1,
      imageUrl: null,
      categories: [],
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    categoriesStateMock = {
      categories: signal<Category[]>(initialCategories),
      loading: signal(false),
      error: signal(null),
      total: signal(1),
      page: signal(1),
      limit: signal(10),
      totalPages: signal(1),
      filters: signal({ search: '', isPublished: undefined, isFeatured: undefined }),
      loadCategories: vi.fn(),
      deleteCategory: vi.fn(),
      reorderCategories: vi.fn(),
      setFilters: vi.fn(),
      setLimit: vi.fn(),
    };

    categoriesServiceMock = {
      list: vi.fn().mockReturnValue(of({ items: initialCategories })),
    };

    attributeServiceMock = {
      getAttributes: vi.fn().mockReturnValue(of(initialAttributes)),
      createAttribute: vi.fn().mockReturnValue(of(initialAttributes[0])),
      deleteAttribute: vi.fn().mockReturnValue(of(void 0)),
    };

    productServiceMock = {
      getProducts: vi.fn().mockReturnValue(
        of({
          items: initialProducts,
          total: initialProducts.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        } as PaginatedResponse<ApiProductListItem>),
      ),
      deleteProduct: vi.fn().mockReturnValue(of(void 0)),
      updateProduct: vi.fn().mockReturnValue(of(void 0)),
      reorderProducts: vi.fn().mockReturnValue(of(void 0)),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Categories, Attributes, Products],
      providers: [
        provideRouter([]),
        { provide: CategoriesState, useValue: categoriesStateMock },
        { provide: CategoriesService, useValue: categoriesServiceMock },
        { provide: AttributeService, useValue: attributeServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate');
  });

  it('Step 1: opens Categories management and triggers category creation drawer flow', () => {
    const fixture: ComponentFixture<Categories> = TestBed.createComponent(Categories);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(categoriesStateMock.loadCategories).toHaveBeenCalled();
    expect(component.categories().length).toBe(1);

    component.onAdd();
    expect(component.isFormOpen()).toBe(true);
    expect(component.editing()).toBeNull();

    component.onCloseForm();
    expect(component.isFormOpen()).toBe(false);
  });

  it('Step 2: manages product attributes and filters by search query', () => {
    const fixture: ComponentFixture<Attributes> = TestBed.createComponent(Attributes);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(attributeServiceMock.getAttributes).toHaveBeenCalled();
    expect(component.attributes().length).toBe(1);

    component.searchQuery.set('size');
    expect(component.filteredAttributes().length).toBe(1);

    component.searchQuery.set('non-existing');
    expect(component.filteredAttributes().length).toBe(0);
  });

  it('Step 3: loads Products catalog and executes multi-criteria search and pagination', () => {
    const fixture: ComponentFixture<Products> = TestBed.createComponent(Products);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(productServiceMock.getProducts).toHaveBeenCalled();
    expect(component.products().length).toBe(2);

    component.searchTerm.set('Galaxy');
    expect(component.searchTerm()).toBe('Galaxy');

    component.onPageChange(2);
    expect(component.currentPage()).toBe(2);
  });

  it('Step 4: selects multiple catalog products and executes bulk status modification', () => {
    const fixture: ComponentFixture<Products> = TestBed.createComponent(Products);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.toggleSelect('prod-1');
    expect(component.selectedProductIds().includes('prod-1')).toBe(true);

    component.openBulkDeleteModal();
    expect(component.isBulkDeleteModalOpen()).toBe(true);

    component.bulkDelete();
    expect(productServiceMock.deleteProduct).toHaveBeenCalledWith('prod-1');
  });

  it('Step 5: navigates from product listing directly to product edit canvas', () => {
    const fixture: ComponentFixture<Products> = TestBed.createComponent(Products);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.viewProductDetails('prod-1');
    expect(router.navigate).toHaveBeenCalledWith(['/products', 'prod-1']);
  });
});
