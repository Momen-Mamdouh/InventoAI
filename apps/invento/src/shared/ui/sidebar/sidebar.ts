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
import { HlmAvatar, HlmAvatarImage, HlmAvatarFallback } from '@spartan/helm/avatar';
import { TranslatePipe, LocaleService } from '@invento/core';
import { BrandLogo } from '@invento/shared';
import { AuthService } from '../../../core/service/auth.service';

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
    HlmAvatarImage,
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
      return {
        name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        email: currentUser.email,
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
    const name = this.user().name;
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });
}
