import '../test-setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Attributes } from '@invento/owner-dashboard-feature-attributes';
import {
  AttributeService,
  ProductAttribute,
  AttributeDisplayStyle,
} from '@invento/owner-dashboard-data-access-attribute';
import { LocaleService } from '@invento/shared-util-i18n';

describe('Attributes Management Integration Tests', () => {
  let fixture: ComponentFixture<Attributes>;
  let component: Attributes;
  let attributeServiceMock: {
    getAttributes: ReturnType<typeof vi.fn>;
    createAttribute: ReturnType<typeof vi.fn>;
    deleteAttribute: ReturnType<typeof vi.fn>;
  };
  let localeServiceMock: {
    translate: ReturnType<typeof vi.fn>;
    locale: ReturnType<typeof vi.fn>;
    isRtl: ReturnType<typeof vi.fn>;
  };

  const mockAttributes: ProductAttribute[] = [
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
        { id: 'val-3', value: 'Large', slug: 'l', swatchHex: null, position: 3 },
      ],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'attr-2',
      name: 'Color',
      key: 'color',
      isVariantAxis: true,
      displayStyle: AttributeDisplayStyle.Swatch,
      isFilterable: true,
      showOnProductPage: true,
      position: 2,
      values: [
        {
          id: 'val-4',
          value: 'Midnight Blue',
          slug: 'midnight-blue',
          swatchHex: '#003366',
          position: 1,
        },
        { id: 'val-5', value: 'Space Gray', slug: 'space-gray', swatchHex: '#555555', position: 2 },
      ],
      createdAt: '2026-01-05T00:00:00Z',
      updatedAt: '2026-01-05T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    attributeServiceMock = {
      getAttributes: vi.fn().mockReturnValue(of(mockAttributes)),
      createAttribute: vi.fn().mockReturnValue(of(mockAttributes[0])),
      deleteAttribute: vi.fn().mockReturnValue(of(void 0)),
    };

    localeServiceMock = {
      translate: vi.fn((k: string) => k),
      locale: vi.fn().mockReturnValue('en'),
      isRtl: vi.fn().mockReturnValue(false),
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Attributes],
      providers: [
        { provide: AttributeService, useValue: attributeServiceMock },
        { provide: LocaleService, useValue: localeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Attributes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates Attributes component and loads attributes list', () => {
    expect(component).toBeDefined();
    expect(attributeServiceMock.getAttributes).toHaveBeenCalled();
    expect(component.attributes().length).toBe(2);
    expect(component.isLoading()).toBe(false);
  });

  it('filters attributes list by search term matching name or key', () => {
    component.searchQuery.set('Color');
    expect(component.filteredAttributes().length).toBe(1);
    expect(component.filteredAttributes()[0].key).toBe('color');

    component.searchQuery.set('size');
    expect(component.filteredAttributes().length).toBe(1);
    expect(component.filteredAttributes()[0].name).toBe('Size');

    component.searchQuery.set('');
    expect(component.filteredAttributes().length).toBe(2);
  });

  it('opens and closes drawer for adding a new attribute', () => {
    expect(component.isAttributeDrawerOpen()).toBe(false);

    component.openAddAttributeDrawer();
    expect(component.isAttributeDrawerOpen()).toBe(true);
    expect(component.editingAttribute()).toBeNull();

    component.closeAttributeDrawer();
    expect(component.isAttributeDrawerOpen()).toBe(false);
  });

  it('opens drawer for editing an existing attribute', () => {
    component.openEditAttributeDrawer(mockAttributes[0]);
    expect(component.isAttributeDrawerOpen()).toBe(true);
    expect(component.editingAttribute()).toEqual(mockAttributes[0]);
    expect(component.attrName()).toBe('Size');
    expect(component.attrKey()).toBe('size');
  });

  it('handles load error and allows retry through fetchAttributes', () => {
    attributeServiceMock.getAttributes.mockReturnValue(
      throwError(() => ({ error: { message: 'Connection failed' } })),
    );

    component.fetchAttributes();

    expect(component.errorMessage()).toBe('Connection failed');
    expect(component.isLoading()).toBe(false);

    attributeServiceMock.getAttributes.mockReturnValue(of(mockAttributes));
    component.fetchAttributes();

    expect(component.errorMessage()).toBeNull();
    expect(component.attributes().length).toBe(2);
  });
});
