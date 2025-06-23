import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useTheme } from '../contexts/ThemeContext.tsx'

export const CodeBlockEnhancer = () => {
  const { appearance } = useTheme()
  const location = useLocation()

  useEffect(() => {
    // Add styles for code block enhancements
    const styleId = 'code-block-enhancer-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = `
      /* Enhanced code block styles */
      pre.shiki {
        position: relative;
      }
      
      pre.shiki[data-title] {
        margin-top: 0;
        border-radius: 0 0 8px 8px !important;
      }
      
      pre.shiki[data-title]::before {
        content: attr(data-title);
        display: block;
        position: absolute;
        top: -2.5rem;
        left: -1px;
        right: -1px;
        background-color: ${appearance === 'dark' ? '#2a2b3d' : '#f3f4f6'};
        border: 1px solid var(--gray-4);
        border-bottom: 1px solid ${appearance === 'dark' ? '#3a3b4d' : '#e5e7eb'};
        border-radius: 8px 8px 0 0;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--gray-11);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      pre.shiki[data-title][data-language]::after {
        content: attr(data-language);
        position: absolute;
        top: -2rem;
        right: 1rem;
        font-size: 0.75rem;
        color: var(--gray-9);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .code-block-copy {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        cursor: pointer;
        border: none;
        border-radius: 4px;
        transition: all 0.2s;
        background-color: ${appearance === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)'};
        backdrop-filter: blur(4px);
        color: ${appearance === 'dark' ? '#fff' : '#000'};
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      pre.shiki[data-title] .code-block-copy {
        top: -2rem;
        right: 6rem;
        background-color: transparent;
        color: var(--gray-11);
      }
      
      .code-block-copy:hover {
        background-color: var(--accent-9) !important;
        color: white !important;
      }
      
      .code-block-copy[data-copied="true"] {
        background-color: var(--green-9) !important;
        color: white !important;
      }
    `

    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement)
      }
    }
  }, [appearance])

  useEffect(() => {
    const enhanceCodeBlocks = () => {
      const codeBlocks = document.querySelectorAll('pre.shiki:not([data-enhanced])')

      codeBlocks.forEach((block) => {
        const preElement = block as HTMLPreElement
        preElement.setAttribute('data-enhanced', 'true')

        // Get language from class name
        const classes = preElement.className.split(' ')
        const language = classes.find(c => c !== 'shiki' && c !== 'shiki-light' && c !== 'shiki-dark') || 'text'

        // Check for title in first line
        const codeElement = preElement.querySelector('code')
        if (!codeElement) return

        const firstLine = codeElement.textContent?.split('\n')[0] || ''
        let title = ''

        const titleMatch = firstLine.match(/^\/\/\s*title:\s*(.+)$/i)
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1]
          // Remove title line from display
          const firstLineElement = codeElement.querySelector('span.line') as HTMLElement
          if (firstLineElement) {
            firstLineElement.style.display = 'none'
          }

          // Set data attributes for CSS
          preElement.setAttribute('data-title', title)
          preElement.setAttribute('data-language', language)
          preElement.style.marginTop = '3rem'
        }

        // Create copy button
        const copyButton = document.createElement('button')
        copyButton.className = 'code-block-copy'
        copyButton.textContent = 'Copy'
        copyButton.setAttribute('data-copied', 'false')

        copyButton.onclick = async (e) => {
          e.preventDefault()
          e.stopPropagation()

          // Get clean code without the title line
          const code = codeElement.textContent || ''
          const cleanCode = title ? code.split('\n').slice(1).join('\n') : code

          try {
            await navigator.clipboard.writeText(cleanCode)
            copyButton.textContent = 'Copied!'
            copyButton.setAttribute('data-copied', 'true')
            setTimeout(() => {
              copyButton.textContent = 'Copy'
              copyButton.setAttribute('data-copied', 'false')
            }, 2000)
          } catch (err) {
            console.error('Failed to copy:', err)
          }
        }

        // Append copy button directly to pre element
        preElement.appendChild(copyButton)
      })
    }

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(enhanceCodeBlocks, 100)

    return () => {
      clearTimeout(timeoutId)
      // Clean up enhanced code blocks
      document.querySelectorAll('pre.shiki[data-enhanced]').forEach(block => {
        block.removeAttribute('data-enhanced')
        block.removeAttribute('data-title')
        block.removeAttribute('data-language')
        const copyButton = block.querySelector('.code-block-copy')
        if (copyButton) {
          copyButton.remove()
        }
        // Restore hidden title lines
        const firstLine = block.querySelector('span.line') as HTMLElement
        if (firstLine && firstLine.style.display === 'none') {
          firstLine.style.display = ''
        } // Reset margin

        ;(block as HTMLElement).style.marginTop = ''
      })
    }
  }, [location.pathname]) // Re-run when route changes

  return null
}
