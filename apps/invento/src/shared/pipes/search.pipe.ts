import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search',
  standalone: true,
})
export class SearchPipe implements PipeTransform {
  transform<T extends object>(items: T[], searchTerm: string, keys: (keyof T)[] = []): T[] {
    if (!items || !searchTerm) {
      return items;
    }

    const lowerCaseSearch = searchTerm.toLowerCase().trim();

    return items.filter((item) => {
      if (keys.length > 0) {
        return keys.some((key) => {
          const value = item[key];
          return (
            value !== null &&
            value !== undefined &&
            (typeof value === 'string' || typeof value === 'number') &&
            value.toString().toLowerCase().includes(lowerCaseSearch)
          );
        });
      }

      return Object.values(item).some((val) => {
        return (
          val &&
          (typeof val === 'string' || typeof val === 'number') &&
          val.toString().toLowerCase().includes(lowerCaseSearch)
        );
      });
    });
  }
}
