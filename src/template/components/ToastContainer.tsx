import type { React } from '#dep/react/index'
import { Box, Flex } from '@radix-ui/themes'
import { useSnapshot } from 'valtio'
import { Stores } from '../stores/$.js'
import { ToastItem } from './ToastItem.js'

export const ToastContainer: React.FC = () => {
  const snap = useSnapshot(Stores.Toast.store)

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }

          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }

          @keyframes timerCountdown {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
      <Box
        position='fixed'
        bottom='0'
        right='0'
        p='4'
        style={{
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <Flex
          direction='column'
          gap='2'
          align='end'
          style={{ pointerEvents: 'auto' }}
        >
          {snap.toasts.map(toast => <ToastItem key={toast.id} toast={toast} />)}
        </Flex>
      </Box>
    </>
  )
}
