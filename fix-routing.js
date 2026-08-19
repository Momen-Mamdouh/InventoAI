const fs = require('fs');
const files = [
  'apps/invento/src/pages/accSetting/profile/profile.html',
  'apps/invento/src/pages/accSetting/security/security.html',
  'apps/invento/src/pages/accSetting/notifications/notifications.html',
  'apps/invento/src/pages/accSetting/myStores/my-stores.html',
  'apps/invento/src/pages/accSetting/bilingPlan/biling-plan.html',
];
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace button tags with 'a' tags
  content = content.replace(
    /<button\s+type="button"([^>]*?)>\s*<ng-icon name="lucideUser" size="16" \/>\s*<span>Profile<\/span>\s*<\/button>/g,
    '<a routerLink="/profile"$1>\n        <ng-icon name="lucideUser" size="16" />\n        <span>Profile</span>\n      </a>',
  );
  content = content.replace(
    /<button([^>]*?)>\s*<ng-icon name="lucideUser" size="16" \/>\s*<span>Profile<\/span>\s*<\/button>/g,
    '<a routerLink="/profile"$1>\n        <ng-icon name="lucideUser" size="16" />\n        <span>Profile</span>\n      </a>',
  );

  content = content.replace(
    /<button\s+type="button"([^>]*?)>\s*<ng-icon name="lucideShield" size="16" \/>\s*<span>Security<\/span>\s*<\/button>/g,
    '<a routerLink="/security"$1>\n        <ng-icon name="lucideShield" size="16" />\n        <span>Security</span>\n      </a>',
  );
  content = content.replace(
    /<button([^>]*?)>\s*<ng-icon name="lucideShield" size="16" \/>\s*<span>Security<\/span>\s*<\/button>/g,
    '<a routerLink="/security"$1>\n        <ng-icon name="lucideShield" size="16" />\n        <span>Security</span>\n      </a>',
  );

  content = content.replace(
    /<button\s+type="button"([^>]*?)>\s*<ng-icon name="lucideBell" size="16" \/>\s*<span>Notifications<\/span>\s*<\/button>/g,
    '<a routerLink="/notifications"$1>\n        <ng-icon name="lucideBell" size="16" />\n        <span>Notifications</span>\n      </a>',
  );
  content = content.replace(
    /<button([^>]*?)>\s*<ng-icon name="lucideBell" size="16" \/>\s*<span>Notifications<\/span>\s*<\/button>/g,
    '<a routerLink="/notifications"$1>\n        <ng-icon name="lucideBell" size="16" />\n        <span>Notifications</span>\n      </a>',
  );

  content = content.replace(
    /<button\s+type="button"([^>]*?)>\s*<ng-icon name="lucideCreditCard" size="16" \/>\s*<span>Billing & Plan<\/span>\s*<\/button>/g,
    '<a routerLink="/billing"$1>\n        <ng-icon name="lucideCreditCard" size="16" />\n        <span>Billing & Plan</span>\n      </a>',
  );
  content = content.replace(
    /<button([^>]*?)>\s*<ng-icon name="lucideCreditCard" size="16" \/>\s*<span>Billing & Plan<\/span>\s*<\/button>/g,
    '<a routerLink="/billing"$1>\n        <ng-icon name="lucideCreditCard" size="16" />\n        <span>Billing & Plan</span>\n      </a>',
  );

  content = content.replace(
    /<button\s+type="button"([^>]*?)>\s*<ng-icon name="lucideStore" size="16" \/>\s*<span>My Stores<\/span>\s*<\/button>/g,
    '<a routerLink="/my-stores"$1>\n        <ng-icon name="lucideStore" size="16" />\n        <span>My Stores</span>\n      </a>',
  );
  content = content.replace(
    /<button([^>]*?)>\s*<ng-icon name="lucideStore" size="16" \/>\s*<span>My Stores<\/span>\s*<\/button>/g,
    '<a routerLink="/my-stores"$1>\n        <ng-icon name="lucideStore" size="16" />\n        <span>My Stores</span>\n      </a>',
  );

  // Strip click handlers
  content = content.replace(/\(click\)="activeTab\.set\('[^']+'\)"/g, '');

  fs.writeFileSync(file, content, 'utf8');
});
console.log('Done!');
