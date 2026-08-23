import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePackage,
  lucideTag,
  lucideLoader2,
  lucideTrash2,
  lucideEdit,
  lucideX,
  lucideUpload,
  lucideImage,
  lucideGripVertical,
  lucideCheck,
  lucidePlus,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan/helm/button';
import { HlmCardImports } from '@spartan/helm/card';
import { HlmBadgeImports } from '@spartan/helm/badge';
import { HlmInputImports } from '@spartan/helm/input';
import { HlmSelectImports } from '@spartan/helm/select';

import {
  ApiProductDetail,
  UpdateProductDto,
  ApiProductVariant,
  ApiProductImage,
} from '../../../features/products/product.model';
import { ProductService } from '../../../features/products/product.service';
import { AttributeService } from '../../../features/attributes/attribute.service';
import { ProductAttribute } from '../../../features/attributes/attribute.model';
import { CategoriesService } from '../../../features/categories/category.service';
import { Category } from '../../../features/categories/category.model';
import { toast } from '@spartan-ng/brain/sonner';
import { DeleteConfirmDialog } from '../../categories/delete-confirm-dialog';

import { BreadcrumbService } from '../../../core/service/breadcrumb.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    FormsModule,
    NgIcon,
    HlmButton,
    HlmCardImports,
    HlmBadgeImports,
    HlmInputImports,
    HlmSelectImports,
    CdkDropList,
    CdkDrag,
    DeleteConfirmDialog,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucidePackage,
      lucideTag,
      lucideLoader2,
      lucideTrash2,
      lucideEdit,
      lucideX,
      lucideUpload,
      lucideImage,
      lucideGripVertical,
      lucideCheck,
      lucidePlus,
    }),
  ],
  templateUrl: './product-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly attributeService = inject(AttributeService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly product = signal<ApiProductDetail | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly isDeleting = signal(false);

  readonly isDeleteProductOpen = signal(false);
  readonly isDeleteVariantOpen = signal(false);
  readonly toDeleteVariantId = signal<string | null>(null);
  readonly isDeleteImageOpen = signal(false);
  readonly toDeleteImageId = signal<string | null>(null);

  readonly isEditDrawerOpen = signal(false);
  readonly isSaving = signal(false);
  editProductForm = {
    title: '',
    slug: '',
    description: '',
    shortDescription: '',
    searchKeywords: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    isFeatured: false,
    weightGrams: null as number | null,
    categoryIds: [] as string[],
    productAttributeValues: {} as Record<string, string>,
  };

  private readonly statusLabels: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    archived: 'Archived',
  };

  readonly statusItemToString = (value: unknown): string => {
    return this.statusLabels[String(value).toLowerCase()] ?? 'Draft';
  };

  readonly getProductAttributeValueLabel = (attrId: string, valId: unknown): string => {
    if (!valId) return '';
    const attr = this.globalAttributes().find((a) => a.id === attrId);
    if (!attr) return '';
    const val = attr.values.find((v) => v.id === valId);
    return val ? val.value : '';
  };

  readonly makeProductAttributeItemToString = (attrId: string) => {
    return (valId: unknown): string => this.getProductAttributeValueLabel(attrId, valId);
  };

  readonly axisAttributeItemToString = (attrId: unknown): string => {
    if (!attrId) return '';
    const attr = this.activeVariantAxes().find((a) => a.id === attrId);
    return attr ? attr.name : '';
  };

  readonly categories = signal<Category[]>([]);

  // Image Management
  readonly isUploadingImages = signal(false);
  readonly editingImageAltId = signal<string | null>(null);
  readonly editImageAltText = signal<string>('');

  // Global Attributes
  readonly globalAttributes = signal<ProductAttribute[]>([]);
  readonly variantAxes = computed(() => this.globalAttributes().filter((a) => a.isVariantAxis));
  readonly productAttributes = computed(() =>
    this.globalAttributes().filter((a) => !a.isVariantAxis),
  );
  readonly activeVariantAxes = computed(() => {
    const p = this.product();
    const allAxes = this.variantAxes();

    if (!p || !p.variants || p.variants.length === 0) {
      return allAxes;
    }

    // If the product has only ONE variant and it has NO attribute values (the default variant)
    // then the product is essentially "new" in terms of variant axes, so all axes are allowed.
    if (p.variants.length === 1 && p.variants[0].attributeValues.length === 0) {
      return allAxes;
    }

    const usedAttributeIds = p.variants[0].attributeValues.map((attr) => attr.attributeId);
    return allAxes.filter((axis) => usedAttributeIds.includes(axis.id));
  });

  // Variants Management
  readonly isGenerating = signal(false);
  readonly isGenerateDrawerOpen = signal(false);
  generateVariantsForm = {
    priceAmount: 0,
    stockQuantity: 0,
    axes: [{ attributeId: '', valueIds: [] as string[] }],
  };

  readonly isAddingVariant = signal(false);
  readonly isAddVariantDrawerOpen = signal(false);
  addVariantForm = {
    sku: '',
    priceAmount: 0,
    compareAtAmount: null as number | null,
    stockQuantity: 0,
    lowStockThreshold: 0,
    attributeValueIds: [] as string[],
  };

  readonly isEditVariantDrawerOpen = signal(false);
  readonly editingVariantId = signal<string | null>(null);
  editVariantForm = {
    sku: '',
    priceAmount: 0,
    compareAtAmount: null as number | null,
    stockQuantity: 0,
    lowStockThreshold: 0,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProduct(id);
      this.loadGlobalAttributes();
      this.loadCategories();
    } else {
      this.error.set('No product ID provided');
      this.isLoading.set(false);
    }
  }

  toggleEditCategory(catId: string): void {
    const ids = this.editProductForm.categoryIds || [];
    if (ids.includes(catId)) {
      this.editProductForm.categoryIds = ids.filter((id) => id !== catId);
    } else {
      this.editProductForm.categoryIds = [...ids, catId];
    }
  }

  isEditCategorySelected(catId: string): boolean {
    return (this.editProductForm.categoryIds || []).includes(catId);
  }

  loadCategories(): void {
    this.categoriesService.list({ limit: 100 }).subscribe({
      next: (res) => this.categories.set(res.items),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  loadGlobalAttributes(): void {
    this.attributeService.getAttributes().subscribe({
      next: (attrs) => this.globalAttributes.set(attrs),
      error: (err) => console.error('Failed to load attributes', err),
    });
  }

  loadProduct(id: string): void {
    this.isLoading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product.set(data);
        if (data && data.title) {
          this.breadcrumbService.setLabel(id, data.title);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product details', err);
        this.error.set('Failed to load product details');
        this.isLoading.set(false);
      },
    });
  }

  deleteProduct(): void {
    this.isDeleteProductOpen.set(true);
  }

  cancelDeleteProduct(): void {
    this.isDeleteProductOpen.set(false);
  }

  confirmDeleteProduct(): void {
    const p = this.product();
    if (!p) return;
    this.isDeleting.set(true);
    this.productService.deleteProduct(p.id).subscribe({
      next: () => {
        toast.success('Product deleted successfully');
        this.router.navigate(['/products']);
      },
      error: (err) => {
        console.error('Failed to delete product', err);
        toast.error('Failed to delete product');
        this.isDeleting.set(false);
        this.isDeleteProductOpen.set(false);
      },
    });
  }

  toggleEditDrawer(): void {
    const currentOpen = this.isEditDrawerOpen();
    if (!currentOpen) {
      const p = this.product();
      if (p) {
        const attributeValues: Record<string, string> = {};
        p.attributeValues.forEach((attr) => {
          // If it's a descriptive attribute, map it.
          attributeValues[attr.attributeId] = attr.id;
        });
        this.productAttributes().forEach((a) => {
          if (attributeValues[a.id] === undefined) {
            attributeValues[a.id] = '';
          }
        });

        this.editProductForm = {
          title: p.title,
          slug: p.slug,
          description: p.description || '',
          shortDescription: p.shortDescription || '',
          searchKeywords: p.searchKeywords || '',
          status: p.status,
          isFeatured: p.isFeatured,
          weightGrams: p.weightGrams,
          categoryIds: p.categories.map((c) => c.id),
          productAttributeValues: attributeValues,
        };
      }
    }
    this.isEditDrawerOpen.set(!currentOpen);
  }

  saveProductChanges(): void {
    const p = this.product();
    if (!p) return;

    if (!this.editProductForm.title.trim()) {
      toast.error('Product title is required.');
      return;
    }

    if (!this.editProductForm.status) {
      toast.error('Product status is required.');
      return;
    }

    this.isSaving.set(true);

    const rootAttributeValueIds = Object.values(this.editProductForm.productAttributeValues).filter(
      (val) => !!val,
    );

    const payload: UpdateProductDto = {
      title: this.editProductForm.title,
      slug: this.editProductForm.slug || undefined,
      description: this.editProductForm.description || undefined,
      shortDescription: this.editProductForm.shortDescription || undefined,
      searchKeywords: this.editProductForm.searchKeywords || undefined,
      status: this.editProductForm.status,
      isFeatured: this.editProductForm.isFeatured,
      weightGrams: this.editProductForm.weightGrams || undefined,
      categoryIds:
        this.editProductForm.categoryIds.length > 0 ? this.editProductForm.categoryIds : undefined,
      attributeValueIds: rootAttributeValueIds.length > 0 ? rootAttributeValueIds : undefined,
    };

    this.productService.updateProduct(p.id, payload).subscribe({
      next: (updatedProduct) => {
        this.product.set(updatedProduct);
        toast.success('Product updated successfully');
        this.isSaving.set(false);
        this.isEditDrawerOpen.set(false);
      },
      error: (err) => {
        console.error('Failed to update product', err);
        toast.error('Failed to update product');
        this.isSaving.set(false);
      },
    });
  }

  // --- Image Management Methods ---

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const p = this.product();
    if (!p) return;

    const filesArray = Array.from(input.files);
    // Limit to 8
    if (p.images.length + filesArray.length > 8) {
      toast.error(`You can only have up to 8 images total. You currently have ${p.images.length}.`);
      return;
    }

    this.isUploadingImages.set(true);
    this.productService.uploadProductImages(p.id, filesArray).subscribe({
      next: (updatedProduct) => {
        this.product.set(updatedProduct);
        toast.success('Images uploaded successfully');
        this.isUploadingImages.set(false);
        input.value = ''; // Reset input
      },
      error: (err) => {
        console.error('Failed to upload images', err);
        toast.error('Failed to upload images');
        this.isUploadingImages.set(false);
        input.value = '';
      },
    });
  }

  dropImage(event: CdkDragDrop<ApiProductImage[]>): void {
    const p = this.product();
    if (!p || !p.images) return;

    const newImages = [...p.images];
    moveItemInArray(newImages, event.previousIndex, event.currentIndex);

    // Optimistic update
    this.product.set({ ...p, images: newImages });

    const payload = newImages.map((img, idx) => ({ id: img.id, position: idx }));
    this.productService.reorderProductImages(p.id, payload).subscribe({
      next: (updatedProduct) => {
        this.product.set(updatedProduct);
      },
      error: (err) => {
        console.error('Failed to reorder images', err);
        this.loadProduct(p.id); // Rollback on error
      },
    });
  }

  startEditingAlt(imageId: string, currentAlt: string | null): void {
    this.editingImageAltId.set(imageId);
    this.editImageAltText.set(currentAlt || '');
  }

  saveImageAlt(imageId: string): void {
    const p = this.product();
    if (!p) return;

    const newAlt = this.editImageAltText().trim() || null;

    // Optimistic update
    const updatedImages = p.images.map((img) =>
      img.id === imageId ? { ...img, altText: newAlt } : img,
    );
    this.product.set({ ...p, images: updatedImages });
    this.editingImageAltId.set(null);

    this.productService.updateProductImage(p.id, imageId, newAlt).subscribe({
      next: (updatedProduct) => {
        this.product.set(updatedProduct);
        toast.success('Image alt text updated');
      },
      error: (err) => {
        console.error('Failed to update image alt text', err);
        toast.error('Failed to update image alt text');
        this.loadProduct(p.id);
      },
    });
  }

  deleteImage(imageId: string): void {
    this.toDeleteImageId.set(imageId);
    this.isDeleteImageOpen.set(true);
  }

  cancelDeleteImage(): void {
    this.isDeleteImageOpen.set(false);
    this.toDeleteImageId.set(null);
  }

  confirmDeleteImage(): void {
    const p = this.product();
    const imageId = this.toDeleteImageId();
    if (!p || !imageId) return;

    this.productService.deleteProductImage(p.id, imageId).subscribe({
      next: () => {
        toast.success('Image deleted successfully');
        this.loadProduct(p.id);
        this.isDeleteImageOpen.set(false);
        this.toDeleteImageId.set(null);
      },
      error: (err) => {
        console.error('Failed to delete image', err);
        toast.error('Failed to delete image');
        this.isDeleteImageOpen.set(false);
        this.toDeleteImageId.set(null);
      },
    });
  }

  // --- Variants Management Methods ---

  toggleGenerateDrawer(): void {
    const currentOpen = this.isGenerateDrawerOpen();
    if (!currentOpen) {
      const defaultAxisId =
        this.activeVariantAxes().length > 0 ? this.activeVariantAxes()[0].id : '';
      this.generateVariantsForm = {
        priceAmount: 0,
        stockQuantity: 0,
        axes: [{ attributeId: defaultAxisId, valueIds: [] }],
      };
    }
    this.isGenerateDrawerOpen.set(!currentOpen);
  }

  addAxis(): void {
    if (this.generateVariantsForm.axes.length >= 3) return;
    const defaultAxisId = this.activeVariantAxes().length > 0 ? this.activeVariantAxes()[0].id : '';
    this.generateVariantsForm.axes.push({ attributeId: defaultAxisId, valueIds: [] });
  }

  removeAxis(index: number): void {
    this.generateVariantsForm.axes.splice(index, 1);
  }

  toggleGenerateValue(axisIndex: number, valueId: string): void {
    const axis = this.generateVariantsForm.axes[axisIndex];
    const idx = axis.valueIds.indexOf(valueId);
    if (idx >= 0) {
      axis.valueIds.splice(idx, 1);
    } else {
      axis.valueIds.push(valueId);
    }
  }

  submitGenerateVariants(): void {
    const p = this.product();
    if (!p) return;

    if (this.generateVariantsForm.priceAmount < 0) {
      toast.error('Price cannot be negative.');
      return;
    }

    const validAxes = this.generateVariantsForm.axes.filter(
      (a) => a.attributeId && a.valueIds.length > 0,
    );
    if (validAxes.length === 0) {
      toast.error('Please select at least one attribute and value to generate variants.');
      return;
    }

    this.isGenerating.set(true);
    const payload = {
      priceAmount: Math.round(this.generateVariantsForm.priceAmount * 100),
      stockQuantity: this.generateVariantsForm.stockQuantity,
      axes: validAxes,
    };

    this.productService.generateVariants(p.id, payload).subscribe({
      next: (updatedProduct) => {
        this.product.set(updatedProduct);
        toast.success('Variants generated successfully');
        this.isGenerating.set(false);
        this.isGenerateDrawerOpen.set(false);
      },
      error: (err) => {
        console.error('Failed to generate variants', err);
        toast.error('Failed to generate variants');
        this.isGenerating.set(false);
      },
    });
  }

  toggleAddVariantDrawer(): void {
    const currentOpen = this.isAddVariantDrawerOpen();
    if (!currentOpen) {
      this.addVariantForm = {
        sku: '',
        priceAmount: 0,
        compareAtAmount: null,
        stockQuantity: 0,
        lowStockThreshold: 0,
        attributeValueIds: [],
      };
    }
    this.isAddVariantDrawerOpen.set(!currentOpen);
  }

  toggleAddVariantValue(valueId: string): void {
    const idx = this.addVariantForm.attributeValueIds.indexOf(valueId);
    if (idx >= 0) {
      this.addVariantForm.attributeValueIds.splice(idx, 1);
    } else {
      // For add variant, typically one value per axis. We don't enforce strictly on UI yet, just toggle it.
      if (this.addVariantForm.attributeValueIds.length >= 3) {
        toast.error('You can select a maximum of 3 attribute values.');
        return;
      }
      this.addVariantForm.attributeValueIds.push(valueId);
    }
  }

  submitAddVariant(): void {
    const p = this.product();
    if (!p) return;

    if (this.addVariantForm.priceAmount < 0) {
      toast.error('Price cannot be negative.');
      return;
    }

    const requiredAxes = this.activeVariantAxes();
    if (
      requiredAxes.length > 0 &&
      this.addVariantForm.attributeValueIds.length !== requiredAxes.length
    ) {
      toast.error(
        `Please select exactly one value for each of the ${requiredAxes.length} required attributes.`,
      );
      return;
    }

    this.isAddingVariant.set(true);
    const payload: {
      sku: string | null;
      priceAmount: number;
      compareAtAmount: number | null;
      stockQuantity: number;
      lowStockThreshold: number;
      attributeValueIds: string[];
    } = {
      ...this.addVariantForm,
      priceAmount: Math.round(this.addVariantForm.priceAmount * 100),
      compareAtAmount:
        this.addVariantForm.compareAtAmount != null
          ? Math.round(this.addVariantForm.compareAtAmount * 100)
          : null,
    };
    if (!payload.sku) {
      payload.sku = null;
    }

    this.productService.addVariant(p.id, payload).subscribe({
      next: (updatedProduct) => {
        this.product.set(updatedProduct);
        toast.success('Variant added successfully');
        this.isAddingVariant.set(false);
        this.isAddVariantDrawerOpen.set(false);
      },
      error: (err) => {
        console.error('Failed to add variant', err);
        toast.error('Failed to add variant');
        this.isAddingVariant.set(false);
      },
    });
  }

  openEditVariantDrawer(variant: ApiProductVariant): void {
    this.editingVariantId.set(variant.id);
    this.editVariantForm = {
      sku: variant.sku || '',
      priceAmount: variant.priceAmount / 100,
      compareAtAmount: variant.compareAtAmount != null ? variant.compareAtAmount / 100 : null,
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
    };
    this.isEditVariantDrawerOpen.set(true);
  }

  closeEditVariantDrawer(): void {
    this.isEditVariantDrawerOpen.set(false);
    this.editingVariantId.set(null);
  }

  submitEditVariant(): void {
    const p = this.product();
    const vId = this.editingVariantId();
    if (!p || !vId) return;

    if (this.editVariantForm.priceAmount < 0) {
      toast.error('Price cannot be negative.');
      return;
    }

    this.isSaving.set(true);
    const payload: {
      sku: string | null;
      priceAmount: number;
      compareAtAmount: number | null;
      stockQuantity: number;
      lowStockThreshold: number;
    } = {
      ...this.editVariantForm,
      priceAmount: Math.round(this.editVariantForm.priceAmount * 100),
      compareAtAmount:
        this.editVariantForm.compareAtAmount != null
          ? Math.round(this.editVariantForm.compareAtAmount * 100)
          : null,
    };
    if (!payload.sku) payload.sku = null;

    this.productService.updateVariant(p.id, vId, payload).subscribe({
      next: (updatedProduct) => {
        this.product.set(updatedProduct);
        toast.success('Variant updated successfully');
        this.isSaving.set(false);
        this.closeEditVariantDrawer();
      },
      error: (err) => {
        console.error('Failed to update variant', err);
        toast.error('Failed to update variant');
        this.isSaving.set(false);
      },
    });
  }

  deleteVariant(variantId: string): void {
    this.toDeleteVariantId.set(variantId);
    this.isDeleteVariantOpen.set(true);
  }

  cancelDeleteVariant(): void {
    this.isDeleteVariantOpen.set(false);
    this.toDeleteVariantId.set(null);
  }

  confirmDeleteVariant(): void {
    const p = this.product();
    const variantId = this.toDeleteVariantId();
    if (!p || !variantId) return;

    this.productService.deleteVariant(p.id, variantId).subscribe({
      next: () => {
        toast.success('Variant deleted successfully');
        this.loadProduct(p.id);
        this.isDeleteVariantOpen.set(false);
        this.toDeleteVariantId.set(null);
      },
      error: (err) => {
        console.error('Failed to delete variant', err);
        toast.error('Failed to delete variant');
        this.isDeleteVariantOpen.set(false);
        this.toDeleteVariantId.set(null);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }
}
