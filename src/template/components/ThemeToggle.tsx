import type { React } from '#dep/react/index'
import { DesktopIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { IconButton } from '@radix-ui/themes'
import { useTheme } from '../contexts/ThemeContext.tsx'

export const ThemeToggle: React.FC = () => {
  const { appearance, toggleTheme, preference } = useTheme()

  const handleClick = () => {
    toggleTheme()
  }

  // Determine next state in cycle: system → light → dark → system
  const getNextTheme = () => {
    if (!preference || preference === 'system') return 'light'
    if (preference === 'light') return 'dark'
    return 'system'
  }

  const getIcon = () => {
    // Show icon based on preference, not appearance
    if (!preference || preference === 'system') {
      return <DesktopIcon width='18' height='18' />
    }
    if (preference === 'light') {
      return <SunIcon width='18' height='18' />
    }
    return <MoonIcon width='18' height='18' />
  }

  return (
    <IconButton
      size='2'
      variant='ghost'
      color='gray'
      onClick={handleClick}
      aria-label={`Switch to ${getNextTheme()} theme`}
      style={{ cursor: `pointer` }}
    >
      {getIcon()}
    </IconButton>
  )
}
