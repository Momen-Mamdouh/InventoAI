import { Pipe, PipeTransform } from '@angular/core';
import { formatOrderDate } from '@invento/user-site/app/core/utils/date.utils';

@Pipe({
  name: 'formatOrderDate',
  standalone: true,
})
export class FormatOrderDatePipe implements PipeTransform {
  transform(value: string | number | Date | null | undefined, includeRelative = false): string {
    return formatOrderDate(value, includeRelative);
  }
}
