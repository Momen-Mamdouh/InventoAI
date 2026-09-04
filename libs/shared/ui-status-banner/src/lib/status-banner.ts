import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCircleAlert } from '@ng-icons/lucide';
import { HlmAlert } from '@spartan/helm/alert';

/**
 * Success/destructive feedback banner shown after a save or update action.
 *
 * Replaces four byte-identical inline banners (account settings' profile/security/notifications
 * views and the chatbot settings view) that hardcoded `emerald-50`/`rose-50` and therefore ignored
 * the active theme. Built on `hlmAlert`, whose `default`/`destructive` variants both render on
 * `bg-card` — the colour tint here comes from semantic tokens applied on top instead.
 */
@Component({
  selector: 'app-status-banner',
  standalone: true,
  imports: [NgIcon, HlmAlert],
  providers: [provideIcons({ lucideCheck, lucideCircleAlert })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      hlmAlert
      [variant]="variant() === 'destructive' ? 'destructive' : 'default'"
      class="flex items-center gap-3 text-xs sm:text-sm"
      [class]="bannerClasses()"
    >
      <div class="flex shrink-0 justify-center items-center rounded-full w-6 h-6" [class]="iconBubbleClasses()">
        <ng-icon [name]="resolvedIcon()" size="14" />
      </div>
      <span class="font-medium">{{ message() }}</span>
    </div>
  `,
})
export class StatusBanner {
  public readonly variant = input<'success' | 'destructive'>('success');
  public readonly message = input.required<string>();
  public readonly fadingOut = input<boolean>(false);
  public readonly icon = input<string>();

  protected readonly resolvedIcon = computed(
    () => this.icon() ?? (this.variant() === 'destructive' ? 'lucideCircleAlert' : 'lucideCheck'),
  );

  protected readonly bannerClasses = computed(() => {
    const tint =
      this.variant() === 'destructive' ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success';
    const fade = this.fadingOut()
      ? 'opacity-0 -translate-y-2 scale-95'
      : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-2';
    return `transition-all duration-300 ease-in-out ${tint} ${fade}`;
  });

  protected readonly iconBubbleClasses = computed(() =>
    this.variant() === 'destructive' ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success',
  );
}
