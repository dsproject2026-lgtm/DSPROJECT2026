import { Toast as HeroToast, toast as heroToast } from '@heroui/react';

type SupportedPlacement =
  | 'top'
  | 'top start'
  | 'top end'
  | 'top-left'
  | 'top-right'
  | 'top-center'
  | 'bottom'
  | 'bottom start'
  | 'bottom end'
  | 'bottom-left'
  | 'bottom-right'
  | 'bottom-center';

type HeroPlacement = 'top' | 'top start' | 'top end' | 'bottom' | 'bottom start' | 'bottom end';

function toHeroPlacement(placement: SupportedPlacement): HeroPlacement {
  const map: Record<SupportedPlacement, HeroPlacement> = {
    top: 'top',
    'top start': 'top start',
    'top end': 'top end',
    'top-left': 'top start',
    'top-right': 'top end',
    'top-center': 'top',
    bottom: 'bottom',
    'bottom start': 'bottom start',
    'bottom end': 'bottom end',
    'bottom-left': 'bottom start',
    'bottom-right': 'bottom end',
    'bottom-center': 'bottom',
  };

  return map[placement];
}

export const Toast = {
  Provider: ({
    placement = 'top-right',
    maxVisibleToasts = 4,
  }: {
    placement?: SupportedPlacement;
    maxVisibleToasts?: number;
  }) => (
    <HeroToast.Provider
      placement={toHeroPlacement(placement)}
      maxVisibleToasts={maxVisibleToasts}
      className="z-[10000]"
    />
  ),
};

type ToastOptions = Parameters<typeof heroToast>[1];
type VariantOptions = Parameters<typeof heroToast.success>[1];

type ToastApi = {
  (message: string, options?: ToastOptions): string;
  notify: (message: string, options?: ToastOptions) => string;
  success: (message: string, options?: VariantOptions) => string;
  info: (message: string, options?: VariantOptions) => string;
  warning: (message: string, options?: VariantOptions) => string;
  danger: (message: string, options?: VariantOptions) => string;
  dismiss: (id?: string) => void;
};

const RECENT_TOAST_WINDOW_MS = 1200;
const recentToasts = new Map<string, number>();

function shouldSuppressToast(key: string) {
  const now = Date.now();
  const last = recentToasts.get(key);
  recentToasts.set(key, now);
  return typeof last === 'number' && now - last < RECENT_TOAST_WINDOW_MS;
}

const toastBase = ((message: string, options?: ToastOptions) => {
  if (shouldSuppressToast(`default:${message}`)) return '';
  return heroToast(message, options);
}) as ToastApi;

toastBase.notify = (message: string, options?: ToastOptions) => {
  if (shouldSuppressToast(`default:${message}`)) return '';
  return heroToast(message, options);
};
toastBase.success = (message: string, options?: VariantOptions) => {
  if (shouldSuppressToast(`success:${message}`)) return '';
  return heroToast.success(message, options);
};
toastBase.info = (message: string, options?: VariantOptions) => {
  if (shouldSuppressToast(`info:${message}`)) return '';
  return heroToast.info(message, options);
};
toastBase.warning = (message: string, options?: VariantOptions) => {
  if (shouldSuppressToast(`warning:${message}`)) return '';
  return heroToast.warning(message, options);
};
toastBase.danger = (message: string, options?: VariantOptions) => {
  if (shouldSuppressToast(`danger:${message}`)) return '';
  return heroToast.danger(message, options);
};
toastBase.dismiss = (id?: string) => {
  if (id) {
    heroToast.close(id);
    return;
  }
  heroToast.clear();
};

export const toast = toastBase;
