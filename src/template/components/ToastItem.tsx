import type { React } from '#dep/react/index'
import {
  CheckCircledIcon,
  Cross2Icon,
  CrossCircledIcon,
  ExclamationTriangleIcon,
  InfoCircledIcon,
} from '@radix-ui/react-icons'
import type { ReadonlyDeep } from 'type-fest'
import { Stores } from '../stores/$.js'
import { Box, Button, Card, Flex, IconButton, Text } from './ui/index.js'
import type { TextProps } from './ui/index.js'

const toastVariants = {
  info: {
    icon: <InfoCircledIcon />,
    color: 'blue',
  },
  success: {
    icon: <CheckCircledIcon />,
    color: 'green',
  },
  warning: {
    icon: <ExclamationTriangleIcon />,
    color: 'amber',
  },
  error: {
    icon: <CrossCircledIcon />,
    color: 'red',
  },
} satisfies Record<Stores.Toast.Type, {
  icon: React.ReactElement
  color: NonNullable<TextProps['color']>
}>

export const ToastItem: React.FC<{ toast: ReadonlyDeep<Stores.Toast.Toast> }> = ({ toast }) => {
  const handleClose = () => Stores.toast.remove(toast.id)
  const duration = toast.duration ?? 5000
  const showTimer = duration > 0
  const type: Stores.Toast.Type = toast.type || 'info'

  return (
    <Card
      size={'2'}
      style={{
        animation: 'slideIn 0.2s ease-out',
        position: 'relative',
      }}
    >
      <Flex gap='3' align='start' style={{ maxWidth: '400px' }}>
        <Text
          as='div'
          size='4'
          color={toastVariants[type].color}
        >
          {toastVariants[type].icon}
        </Text>
        <Box style={{ flex: 1 }}>
          <Flex align='baseline' gap='2' wrap='wrap'>
            <Text weight='medium' size='2'>
              {toast.message}
            </Text>
            {toast.actions.map((action) => (
              <Button
                id={action.label}
                size='1'
                variant='soft'
                onClick={() => {
                  action.onClick()
                  handleClose()
                }}
              >
                {action.label}
              </Button>
            ))}
          </Flex>

          {toast.description && (
            <Text size='1' color='gray' mt='1' style={{ display: 'block' }}>
              {toast.description}
            </Text>
          )}
        </Box>

        <IconButton
          size='1'
          variant='ghost'
          color='gray'
          onClick={handleClose}
          className='shrink-0'
        >
          <Cross2Icon />
        </IconButton>
      </Flex>

      {showTimer && (
        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: `var(--${toastVariants[toast.type || 'info'].color}-a3)`,
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              height: '100%',
              backgroundColor: `var(--${toastVariants[toast.type || 'info'].color}-a6)`,
              animation: `timerCountdown ${duration}ms linear forwards`,
            }}
          />
        </Box>
      )}
    </Card>
  )
}
