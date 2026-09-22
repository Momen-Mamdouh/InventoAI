import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Categories } from '@invento/owner-dashboard-feature-categories';
import { CategoriesState, Category } from '@invento/owner-dashboard-data-access-category';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Categories Management Integration Tests', () => {
  let fixture: ComponentFixture<Categories>;
  let component: Categories;
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
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };

  const mockCategoryList: Category[] = [
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
    {
      id: 'cat-2',
      name: 'Laptops & Computers',
      slug: 'laptops',
      description: 'Workstations and ultrabooks',
      imageUrl: 'https://example.com/laptops.jpg',
      position: 2,
      isPublished: false,
      isFeatured: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    categoriesStateMock = {
      categories: signal<Category[]>(mockCategoryList),
      loading: signal(false),
      error: signal(null),
      total: signal(2),
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

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Categories],
      providers: [
        { provide: CategoriesState, useValue: categoriesStateMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Categories);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Categories component and loads categories on initialization', () => {
    expect(component).toBeDefined();
    expect(categoriesStateMock.loadCategories).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
  });

  it('filters category list by column name search input', () => {
    component.colNameSearch.set('Laptops');
    expect(component.displayedCategories().length).toBe(1);
    expect(component.displayedCategories()[0].name).toBe('Laptops & Computers');

    component.colNameSearch.set('');
    expect(component.displayedCategories().length).toBe(2);
  });

  it('filters category list by publication status (published vs draft)', () => {
    component.colStatusFilter.set('published');
    expect(component.displayedCategories().length).toBe(1);
    expect(component.displayedCategories()[0].isPublished).toBe(true);

    component.colStatusFilter.set('unpublished');
    expect(component.displayedCategories().length).toBe(1);
    expect(component.displayedCategories()[0].isPublished).toBe(false);

    component.colStatusFilter.set('');
    expect(component.displayedCategories().length).toBe(2);
  });

  it('opens and closes category creation slide-over drawer', () => {
    expect(component.isFormOpen()).toBe(false);

    component.onAdd();
    expect(component.isFormOpen()).toBe(true);
    expect(component.editing()).toBeNull();

    component.onCloseForm();
    expect(component.isFormOpen()).toBe(false);
  });

  it('opens category edit drawer with prefilled category model', () => {
    component.onEdit(mockCategoryList[0]);
    expect(component.isFormOpen()).toBe(true);
    expect(component.editing()).toEqual(mockCategoryList[0]);
  });

  it('safeguards drag and drop reordering by disabling it when filters or sorts are active', () => {
    expect(component.isColumnFilteredOrSorted()).toBe(false);

    component.colNameSearch.set('smart');
    expect(component.isColumnFilteredOrSorted()).toBe(true);

    component.colNameSearch.set('');
    component.colPositionSort.set('asc');
    expect(component.isColumnFilteredOrSorted()).toBe(true);

    component.colPositionSort.set('none');
    expect(component.isColumnFilteredOrSorted()).toBe(false);
  });
});
