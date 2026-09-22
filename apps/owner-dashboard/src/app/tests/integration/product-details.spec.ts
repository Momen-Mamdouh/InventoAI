import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetails } from '@invento/owner-dashboard-feature-products';
import { ProductService, ApiProductDetail } from '@invento/owner-dashboard-data-access-product';
import { CategoriesService, Category } from '@invento/owner-dashboard-data-access-category';
import { AttributeService } from '@invento/owner-dashboard-data-access-attribute';
import { BreadcrumbService } from '@invento/owner-dashboard-util-breadcrumb';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Product Details Integration Tests', () => {
  let fixture: ComponentFixture<ProductDetails>;
  let component: ProductDetails;
  let productServiceMock: {
    getProductById: ReturnType<typeof vi.fn>;
    updateProduct: ReturnType<typeof vi.fn>;
    deleteProductVariant: ReturnType<typeof vi.fn>;
  };
  let categoriesServiceMock: {
    list: ReturnType<typeof vi.fn>;
  };
  let attributeServiceMock: {
    getAttributes: ReturnType<typeof vi.fn>;
  };
  let breadcrumbServiceMock: {
    setLabel: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Audio Equipment',
      slug: 'audio',
      description: 'Audio gear',
      imageUrl: null,
      position: 1,
      isPublished: true,
      isFeatured: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockProductDetail: ApiProductDetail = {
    id: 'prod-1',
    title: 'Professional Studio Microphone',
    slug: 'studio-mic',
    description: 'Cardioid condenser microphone with XLR output',
    shortDescription: 'Studio mic',
    searchKeywords: 'microphone, studio, audio',
    status: 'active',
    isFeatured: true,
    weightGrams: 500,
    position: 0,
    minPriceAmount: 29999,
    maxPriceAmount: 31999,
    totalStock: 33,
    variantCount: 2,
    categories: [{ id: 'cat-1', name: 'Audio Equipment', slug: 'audio' }],
    attributeValues: [],
    images: [{ id: 'img-1', url: 'https://example.com/mic.jpg', altText: null, position: 0 }],
    variants: [
      {
        id: 'var-1',
        sku: 'MIC-BLK-01',
        priceAmount: 29999,
        compareAtAmount: 34999,
        stockQuantity: 25,
        lowStockThreshold: 5,
        isDefault: true,
        position: 0,
        attributeValues: [],
      },
      {
        id: 'var-2',
        sku: 'MIC-SLV-02',
        priceAmount: 31999,
        compareAtAmount: 36999,
        stockQuantity: 8,
        lowStockThreshold: 5,
        isDefault: false,
        position: 1,
        attributeValues: [],
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  };

  beforeEach(async () => {
    productServiceMock = {
      getProductById: vi.fn().mockReturnValue(of(mockProductDetail)),
      updateProduct: vi.fn().mockReturnValue(of(mockProductDetail)),
      deleteProductVariant: vi.fn().mockReturnValue(of(void 0)),
    };

    categoriesServiceMock = {
      list: vi.fn().mockReturnValue(of({ items: mockCategories, total: 1 })),
    };

    attributeServiceMock = {
      getAttributes: vi.fn().mockReturnValue(of([])),
    };

    breadcrumbServiceMock = {
      setLabel: vi.fn(),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => (k === 'id' ? 'prod-1' : null) } },
            paramMap: of({ get: (k: string) => (k === 'id' ? 'prod-1' : null) }),
          },
        },
        { provide: ProductService, useValue: productServiceMock },
        { provide: CategoriesService, useValue: categoriesServiceMock },
        { provide: AttributeService, useValue: attributeServiceMock },
        { provide: BreadcrumbService, useValue: breadcrumbServiceMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates ProductDetails component and resolves product by route id parameter', () => {
    expect(component).toBeDefined();
    expect(productServiceMock.getProductById).toHaveBeenCalledWith('prod-1');
    expect(component.product()?.title).toBe('Professional Studio Microphone');
    expect(component.product()?.minPriceAmount).toBe(29999);
    expect(component.product()?.variants.length).toBe(2);
  });

  it('renders product variants table with correct pagination and count', () => {
    expect(component.totalVariantPages()).toBe(1);
    expect(component.paginatedVariants().length).toBe(2);
    expect(component.paginatedVariants()[0].sku).toBe('MIC-BLK-01');
    expect(component.paginatedVariants()[1].sku).toBe('MIC-SLV-02');
  });

  it('sorts variants by stock in ascending and descending directions', () => {
    component.onVariantSortChange('stock', 'asc');
    expect(component.paginatedVariants()[0].stockQuantity).toBe(8);

    component.onVariantSortChange('stock', 'desc');
    expect(component.paginatedVariants()[0].stockQuantity).toBe(25);
  });
});
