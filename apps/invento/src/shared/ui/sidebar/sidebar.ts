import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmSidebarImports } from '@spartan/helm/sidebar';
import {
  lucideLayoutDashboard,
  lucidePackage,
  lucideUsers,
  lucideShoppingCart,
  lucideTruck,
  lucideClipboardList,
  lucideBarChart3,
  lucideBot,
  lucideFolderTree,
  lucideTags,
  lucideMessageCircleQuestionMark,
  lucideChevronUp,
  lucideBotMessageSquare,
  lucideSparkles,
  lucideBadgeCheck,
  lucideCreditCard,
  lucideBell,
  lucideLogOut,
  lucideUser,
  lucideLock,
  lucideStore,
} from '@ng-icons/lucide';
import { HlmDropdownMenuImports } from '@spartan/helm/dropdown-menu';
import { HlmAvatar, HlmAvatarFallback } from '@spartan/helm/avatar';
import { TranslatePipe, LocaleService } from '@invento/core';
import { BrandLogo } from '@invento/shared-ui-brand-logo';
import { toast } from '@spartan/helm/sonner';
import { AuthService } from '@invento/shared-data-access-auth';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmSidebarImports,
    TranslatePipe,
    BrandLogo,
    HlmDropdownMenuImports,
    HlmAvatar,
    HlmAvatarFallback,
  ],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucidePackage,
      lucideUsers,
      lucideShoppingCart,
      lucideTruck,
      lucideClipboardList,
      lucideBarChart3,
      lucideBot,
      lucideFolderTree,
      lucideTags,
      lucideMessageCircleQuestionMark,
      lucideChevronUp,
      lucideBotMessageSquare,
      lucideSparkles,
      lucideBadgeCheck,
      lucideCreditCard,
      lucideBell,
      lucideLogOut,
      lucideUser,
      lucideLock,
      lucideStore,
    }),
  ],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly localeService = inject(LocaleService);

  protected readonly sidebarSide = computed(() => (this.localeService.isRtl() ? 'right' : 'left'));
  protected readonly appName = 'app_name';

  protected readonly navItems: NavItem[] = [
    { label: 'nav_home', icon: 'lucideLayoutDashboard', route: '/home' },
    { label: 'nav_products', icon: 'lucidePackage', route: '/products' },
    { label: 'nav_attributes', icon: 'lucideTags', route: '/attributes' },
    { label: 'nav_categories', icon: 'lucideFolderTree', route: '/categories' },
    { label: 'AI Catalog', icon: 'lucideSparkles', route: '/catalog-ai' },
    { label: 'nav_orders', icon: 'lucideShoppingCart', route: '/orders' },
    { label: 'nav_faq', icon: 'lucideMessageCircleQuestionMark', route: '/faq' },
    { label: 'nav_suppliers', icon: 'lucideTruck', route: '/suppliers' },
    { label: 'nav_purchase_requests', icon: 'lucideClipboardList', route: '/purchase-requests' },
    { label: 'nav_ai_advisor', icon: 'lucideBot', route: '/ai-advisor' },
    { label: 'nav_chatbot', icon: 'lucideBotMessageSquare', route: '/chatbot' },
  ];

  private readonly authService = inject(AuthService);

  protected readonly user = computed(() => {
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      const fallbackName = currentUser.email ? currentUser.email.split('@')[0] : 'Owner';
      return {
        name: fullName || fallbackName,
        email: currentUser.email || 'owner@inventoai.com',
        image: currentUser.image,
      };
    }
    // Fallback if no user loaded
    return {
      name: 'Owner',
      email: 'owner@inventoai.com',
      image: null,
    };
  });

  protected readonly userInitials = computed(() => {
    const currentUser = this.authService.currentUser();
    const first = currentUser?.firstName?.trim();
    const last = currentUser?.lastName?.trim();

    if (first && last) {
      return `${first[0]}${last[0]}`.toUpperCase();
    }
    if (first && first.length >= 2) {
      return first.substring(0, 2).toUpperCase();
    }
    if (first) {
      return first.toUpperCase();
    }

    const name = this.user().name.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }

    return 'OW';
  });

  protected logout(): void {
    this.authService.logout();
    toast.success('Logged out successfully');
  }
}
