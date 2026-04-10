import type { ComponentProps } from 'react';
import { Toaster, toast as sonnerToast } from 'sonner';
import 'sonner/dist/styles.css';

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

type SonnerPosition = ComponentProps<typeof Toaster>['position'];

function toSonnerPosition(placement: SupportedPlacement): SonnerPosition {
  const map: Record<SupportedPlacement, SonnerPosition> = {
    top: 'top-center',
    'top start': 'top-left',
    'top end': 'top-right',
    'top-left': 'top-left',
    'top-right': 'top-right',
    'top-center': 'top-center',
    bottom: 'bottom-center',
    'bottom start': 'bottom-left',
    'bottom end': 'bottom-right',
    'bottom-left': 'bottom-left',
    'bottom-right': 'bottom-right',
    'bottom-center': 'bottom-center',
  };

  return map[placement];
}

interface ToastProviderProps extends Omit<ComponentProps<typeof Toaster>, 'position'> {
  placement?: SupportedPlacement;
}

function ToastProvider({ placement = 'top end', ...props }: ToastProviderProps) {
  return (
    <Toaster
      closeButton
      duration={3500}
      position={toSonnerPosition(placement)}
      richColors
      toastOptions={{
        classNames: {
          toast: '!font-[IBM_Plex_Sans]',
        },
      }}
      {...props}
    />
  );
}

type ToastFn = (message: string, options?: Parameters<typeof sonnerToast>[1]) => string | number;

const baseToast: ToastFn = (message, options) => sonnerToast(message, options);

export const toast = Object.assign(baseToast, {
  success: (message: string) => sonnerToast.success(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
  danger: (message: string) => sonnerToast.error(message),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
});

export const Toast = {
  Provider: ToastProvider,
};
