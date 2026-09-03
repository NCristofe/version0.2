import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

export function register() {
  if (!('serviceWorker' in navigator)) return;

  const updateSW = registerSW({
    onNeedRefresh() {
      toast.info('Nova versão disponível!', {
        action: {
          label: 'Atualizar',
          onClick: () => updateSW(true),
        },
        duration: Infinity,
      });
    },
    onOfflineReady() {
      console.log('App pronto para uso offline.');
    },
    onRegisterError(error) {
      console.error('Falha ao registrar Service Worker:', error);
    },
  });
}
