import { Pipe, PipeTransform } from '@angular/core';
import { ProductAttribute } from '@invento/owner-dashboard-data-access-attribute';

@Pipe({
  name: 'attributeSearch',
  standalone: true,
})
export class AttributeSearchPipe implements PipeTransform {
  transform(attributes: ProductAttribute[], searchQuery: string): ProductAttribute[] {
    if (!attributes || !searchQuery) {
      return attributes;
    }

    const query = searchQuery.toLowerCase().trim();
    return attributes.filter(
      (attr) => attr.name.toLowerCase().includes(query) || attr.key.toLowerCase().includes(query),
    );
  }
}
