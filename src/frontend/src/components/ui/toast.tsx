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
      duration={4200}
      expand
      offset={20}
      mobileOffset={14}
      position={toSonnerPosition(placement)}
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            '!font-[IBM_Plex_Sans] !rounded-xl !border !border-[#DDE3EE] !bg-white/95 !text-[#111827] !shadow-[0_10px_30px_rgba(17,24,39,0.12)] backdrop-blur-sm !px-4 !py-3',
          content: '!gap-1',
          title: '!text-[0.95rem] !font-semibold !leading-5 !tracking-[-0.01em] !text-[#111827]',
          description: '!text-[0.84rem] !leading-5 !text-[#5F6776]',
          icon: '!text-[#1A56DB]',
          closeButton:
            '!border !border-[#D9E0EC] !bg-white !text-[#6B7280] hover:!bg-[#F3F5F9] hover:!text-[#111827] !transition-colors',
          success: '!border-l-4 !border-l-[#057A55] !bg-[#F7FCFA]',
          error: '!border-l-4 !border-l-[#C81E1E] !bg-[#FFF8F8]',
          warning: '!border-l-4 !border-l-[#C27803] !bg-[#FFFCF5]',
          info: '!border-l-4 !border-l-[#1A56DB] !bg-[#F7FAFF]',
          default: '!border-l-4 !border-l-[#1A56DB] !bg-[#F7FAFF]',
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
