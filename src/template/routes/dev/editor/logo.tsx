import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import React, { useState } from 'react'
import { useFetcher } from 'react-router'
import { ShapesGalleryUnified } from '../../../components/dev/LogoEditor.tsx'

const action = async ({ request }: { request: Request }) => {
  // Check if running on server
  if (typeof window !== 'undefined') {
    console.error('ERROR: Action is running on client!')
    return { error: 'Action must run on server' }
  }
  
  console.log('===========================================')
  console.log('LOGO EDITOR ACTION CALLED ON SERVER!')
  console.log('Request method:', request.method)
  console.log('Request URL:', request.url)
  console.log('===========================================')
  
  // Dynamic imports for server-only modules
  const { debug } = await import('#singletons/debug')
  const { Fs } = await import('@wollybeard/kit')
  const PROJECT_DATA = await import('virtual:polen/project/data.jsonsuper').then(m => m.default)

  const _debug = debug.sub('logo-editor')
  _debug('action called')

  try {
    const formData = await request.formData()
    const svg = formData.get('svg') as string
    _debug('SVG data received, length:', svg?.length)

    if (!svg) {
      return { error: 'Missing logo data' }
    }

    const logoPath = PROJECT_DATA.paths.absolute.public.logo
    _debug('Saving logo to:', logoPath)

    await Fs.write({ path: logoPath, content: svg })
    _debug('Logo saved successfully')

    return {
      success: true,
      message: 'Logo saved successfully',
      path: logoPath,
    }
  } catch (error) {
    _debug('Error saving logo file:', error)
    return { error: 'Failed to save logo file' }
  }
}

const Component = () => {
  const [exportStatus, setExportStatus] = useState<string>('')
  const fetcher = useFetcher()


  // Handle action response
  React.useEffect(() => {
    const data = fetcher.data as { success?: boolean; message?: string; error?: string } | undefined
    if (data) {
      if (data.success) {
        setExportStatus('Logo saved! HMR will update your site automatically.')
        setTimeout(() => setExportStatus(''), 3000)
      } else if (data.error) {
        setExportStatus(`Error: ${data.error}`)
      }
    }
  }, [fetcher.data])

  const handleSaveAsProjectLogo = () => {
    try {
      // Get the largest preview SVG
      const svgElements = document.querySelectorAll('#logo-editor-preview svg')

      if (svgElements.length === 0) {
        setExportStatus('Error: No logo found to save')
        return
      }

      const largestSvg = Array.from(svgElements).reduce((largest, current) => {
        const currentSize = parseInt(current.getAttribute('width') || '0')
        const largestSize = parseInt(largest?.getAttribute('width') || '0')
        return currentSize > largestSize ? current : largest
      }, svgElements[0])

      if (!largestSvg) {
        setExportStatus('Error: No logo found to save')
        return
      }

      // Clone and prepare the SVG
      const svgClone = largestSvg.cloneNode(true) as SVGElement
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      svgClone.setAttribute('width', '128')
      svgClone.setAttribute('height', '128')
      svgClone.setAttribute('viewBox', '0 0 128 128')

      const svgString = new XMLSerializer().serializeToString(svgClone)

      // Create a form and submit it to force server-side execution
      const form = document.createElement('form')
      form.method = 'post'
      form.action = '/polen/editor/logo'
      
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'svg'
      input.value = svgString
      
      form.appendChild(input)
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      setExportStatus('Error saving logo files')
    }
  }

  return (
    <Box p='6'>
      <Flex direction='column' gap='4'>
        <Box>
          <Heading size='8' mb='2'>Logo Editor</Heading>
          <Text size='3' color='gray' style={{ display: 'block', marginBottom: '0.5rem' }}>
            Design your logo and save it directly to your project
          </Text>
          <Text size='2' color='gray'>
            Click "Set as Project Logo" to save logo.svg to your project root (dark mode uses CSS invert)
          </Text>
        </Box>

        <Box id='logo-editor-preview'>
          <ShapesGalleryUnified />
        </Box>

        <Flex direction='column' gap='3'>
          <Flex gap='3' align='center'>
            <Button
              size='3'
              onClick={handleSaveAsProjectLogo}
              style={{ cursor: 'pointer' }}
              type='button'
            >
              Set as Project Logo
            </Button>
            {exportStatus && (
              <Text size='2' color={exportStatus.includes('Error') ? 'red' : 'green'}>
                {exportStatus}
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}

export const logoEditor = createRoute({
  path: 'polen/editor/logo',
  Component,
  action,
})
