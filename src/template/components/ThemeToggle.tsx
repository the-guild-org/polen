import type { React } from '#dep/react/index'
import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { IconButton } from '@radix-ui/themes'
import { useTheme } from '../contexts/ThemeContext.tsx'

export const ThemeToggle: React.FC = () => {
  const { appearance, toggleTheme } = useTheme()

  return (
    <IconButton
      size="2"
      variant="ghost"
      color="gray"
      onClick={toggleTheme}
      aria-label={`Switch to ${appearance === 'light' ? 'dark' : 'light'} theme`}
      style={{ cursor: 'pointer' }}
    >
      {appearance === 'light' ? <MoonIcon width="18" height="18" /> : <SunIcon width="18" height="18" />}
    </IconButton>
  )
}