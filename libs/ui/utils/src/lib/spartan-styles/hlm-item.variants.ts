import { cva } from 'class-variance-authority';
import type { HlmStyle } from './hlm-style';

type CvaFn = (props?: { variant?: string; size?: string }) => string;

export const itemVariantsByStyle: Record<HlmStyle, CvaFn> = {
  nova: cva(
    'group/item flex cursor-default select-none items-center rounded-lg px-2 py-1 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&>ng-icon]:text-[length:--spacing(4)]',
    {
      variants: {
        variant: {
          default: 'text-foreground data-[highlighted=true]:bg-muted',
          destructive: 'text-destructive data-[highlighted=true]:bg-destructive/10',
        },
        size: {
          default: 'text-sm',
          sm: 'text-xs',
          lg: 'text-base',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
  ) as CvaFn,
  vega: cva(
    'group/item flex cursor-default select-none items-center rounded-md px-2 py-1.5 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&>ng-icon]:text-[length:--spacing(4)]',
    {
      variants: {
        variant: {
          default: 'text-foreground data-[highlighted=true]:bg-muted',
          destructive: 'text-destructive data-[highlighted=true]:bg-destructive/10',
        },
        size: {
          default: 'text-sm',
          sm: 'text-xs',
          lg: 'text-base',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
  ) as CvaFn,
  lyra: cva(
    'group/item flex cursor-default select-none items-center rounded-none px-2 py-1 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&>ng-icon]:text-[length:--spacing(4)]',
    {
      variants: {
        variant: {
          default: 'text-foreground data-[highlighted=true]:bg-muted',
          destructive: 'text-destructive data-[highlighted=true]:bg-destructive/10',
        },
        size: {
          default: 'text-xs',
          sm: 'text-[0.625rem]',
          lg: 'text-sm',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
  ) as CvaFn,
  maia: cva(
    'group/item flex cursor-default select-none items-center rounded-xl px-3 py-1.5 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&>ng-icon]:text-[length:--spacing(4)]',
    {
      variants: {
        variant: {
          default: 'text-foreground data-[highlighted=true]:bg-muted',
          destructive: 'text-destructive data-[highlighted=true]:bg-destructive/10',
        },
        size: {
          default: 'text-sm',
          sm: 'text-xs',
          lg: 'text-base',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
  ) as CvaFn,
  mira: cva(
    'group/item flex cursor-default select-none items-center rounded-md px-1.5 py-0.5 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&>ng-icon]:text-[length:--spacing(3.5)]',
    {
      variants: {
        variant: {
          default: 'text-foreground data-[highlighted=true]:bg-muted',
          destructive: 'text-destructive data-[highlighted=true]:bg-destructive/10',
        },
        size: {
          default: 'text-xs/relaxed',
          sm: 'text-[0.625rem]',
          lg: 'text-sm',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
  ) as CvaFn,
  luma: cva(
    'group/item flex cursor-default select-none items-center rounded-3xl px-3 py-1.5 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&>ng-icon]:text-[length:--spacing(4)]',
    {
      variants: {
        variant: {
          default: 'text-foreground data-[highlighted=true]:bg-accent',
          destructive: 'text-destructive data-[highlighted=true]:bg-destructive/10',
        },
        size: {
          default: 'text-sm',
          sm: 'text-xs',
          lg: 'text-base',
        },
      },
      defaultVariants: {
        variant: 'default',
        size: 'default',
      },
    },
  ) as CvaFn,
};
