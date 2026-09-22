import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Products } from '@invento/owner-dashboard-feature-products';
import {
  ProductService,
  ApiProductListItem,
  PaginatedResponse,
} from '@invento/owner-dashboard-data-access-product';
import { CategoriesService, Category } from '@invento/owner-dashboard-data-access-category';
import { AttributeService } from '@invento/owner-dashboard-data-access-attribute';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Products Catalog Integration Tests', () => {
  let fixture: ComponentFixture<Products>;
  let component: Products;
  let productServiceMock: {
    getProducts: ReturnType<typeof vi.fn>;
    deleteProduct: ReturnType<typeof vi.fn>;
    updateProduct: ReturnType<typeof vi.fn>;
    reorderProducts: ReturnType<typeof vi.fn>;
  };
  let categoriesServiceMock: {
    list: ReturnType<typeof vi.fn>;
  };
  let attributeServiceMock: {
    getAttributes: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };

  const mockProducts: ApiProductListItem[] = [
    {
      id: 'prod-1',
      title: 'Wireless Noise-Canceling Headphones',
      slug: 'wireless-headphones',
      status: 'active',
      isFeatured: true,
      position: 0,
      minPriceAmount: 19999,
      maxPriceAmount: 19999,
      minCompareAtAmount: 24999,
      compareAtAmount: 24999,
      totalStock: 45,
      variantCount: 3,
      imageUrl: 'https://example.com/headphones.jpg',
      categories: [{ id: 'cat-1', name: 'Audio', slug: 'audio' }],
      createdAt: '2026-01-10T12:00:00Z',
      updatedAt: '2026-01-10T12:00:00Z',
    },
    {
      id: 'prod-2',
      title: 'Mechanical Gaming Keyboard',
      slug: 'mechanical-keyboard',
      status: 'active',
      isFeatured: false,
      position: 1,
      minPriceAmount: 12999,
      maxPriceAmount: 12999,
      minCompareAtAmount: null,
      compareAtAmount: null,
      totalStock: 12,
      variantCount: 2,
      imageUrl: 'https://example.com/keyboard.jpg',
      categories: [{ id: 'cat-2', name: 'Gaming', slug: 'gaming' }],
      createdAt: '2026-01-15T14:00:00Z',
      updatedAt: '2026-01-15T14:00:00Z',
    },
    {
      id: 'prod-3',
      title: 'Ergonomic Vertical Mouse',
      slug: 'vertical-mouse',
      status: 'archived',
      isFeatured: false,
      position: 2,
      minPriceAmount: 5999,
      maxPriceAmount: 5999,
      minCompareAtAmount: 7999,
      compareAtAmount: 7999,
      totalStock: 0,
      variantCount: 1,
      imageUrl: 'https://example.com/mouse.jpg',
      categories: [{ id: 'cat-2', name: 'Gaming', slug: 'gaming' }],
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-01T10:00:00Z',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Audio',
      slug: 'audio',
      description: 'Audio devices',
      imageUrl: null,
      position: 1,
      isPublished: true,
      isFeatured: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'cat-2',
      name: 'Gaming',
      slug: 'gaming',
      description: 'Gaming gear',
      imageUrl: null,
      position: 2,
      isPublished: true,
      isFeatured: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockPaginatedResponse: PaginatedResponse<ApiProductListItem> = {
    items: mockProducts,
    total: 3,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    productServiceMock = {
      getProducts: vi.fn().mockReturnValue(of(mockPaginatedResponse)),
      deleteProduct: vi.fn().mockReturnValue(of(void 0)),
      updateProduct: vi.fn().mockReturnValue(of(void 0)),
      reorderProducts: vi.fn().mockReturnValue(of(void 0)),
    };

    categoriesServiceMock = {
      list: vi.fn().mockReturnValue(of({ items: mockCategories, total: 2 })),
    };

    attributeServiceMock = {
      getAttributes: vi.fn().mockReturnValue(of([])),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productServiceMock },
        { provide: CategoriesService, useValue: categoriesServiceMock },
        { provide: AttributeService, useValue: attributeServiceMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Products component and loads product items and categories', () => {
    expect(component).toBeDefined();
    expect(productServiceMock.getProducts).toHaveBeenCalled();
    expect(categoriesServiceMock.list).toHaveBeenCalledWith({ limit: 100 });
    expect(component.products().length).toBe(3);
    expect(component.categories().length).toBe(2);
    expect(component.isLoading()).toBe(false);
  });

  it('filters products list by search query matching title', () => {
    component.searchTerm.set('Headphones');
    expect(component.processedProducts().length).toBe(1);
    expect(component.processedProducts()[0].title).toContain('Headphones');

    component.searchTerm.set('NonExistentItem');
    expect(component.processedProducts().length).toBe(0);

    component.searchTerm.set('');
    expect(component.processedProducts().length).toBe(3);
  });

  it('filters products list by category id', () => {
    component.colFilterCategory.set('cat-1');
    expect(component.processedProducts().length).toBe(1);
    expect(component.processedProducts()[0].categories[0].name).toBe('Audio');

    component.colFilterCategory.set('cat-2');
    expect(component.processedProducts().length).toBe(2);

    component.colFilterCategory.set('');
    expect(component.processedProducts().length).toBe(3);
  });

  it('sorts products by stock amount in ascending and descending order', () => {
    component.onSortChange('stock', 'asc');
    expect(component.paginatedProducts()[0].totalStock).toBe(0);

    component.onSortChange('stock', 'desc');
    expect(component.paginatedProducts()[0].totalStock).toBe(45);
  });

  it('deletes selected products via bulk delete modal', () => {
    component.selectedProductIds.set(['prod-1']);
    component.openBulkDeleteModal();
    expect(component.isBulkDeleteModalOpen()).toBe(true);

    component.bulkDelete();
    expect(productServiceMock.deleteProduct).toHaveBeenCalledWith('prod-1');
  });

  it('handles error when getProducts fails and displays error message with retry', () => {
    productServiceMock.getProducts.mockReturnValue(
      throwError(() => ({ error: { message: 'Failed to fetch products' } })),
    );

    component.fetchProducts();

    expect(component.errorMessage()).toBe('Failed to fetch products');
    expect(component.isLoading()).toBe(false);

    productServiceMock.getProducts.mockReturnValue(of(mockPaginatedResponse));
    component.fetchProducts();

    expect(component.errorMessage()).toBeNull();
    expect(component.products().length).toBe(3);
  });
});
