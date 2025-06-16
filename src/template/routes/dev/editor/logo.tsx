import { createRoute } from '#lib/react-router-aid/react-router-aid'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import React, { useState } from 'react'
import { Form, useActionData } from 'react-router'
import { ShapesGalleryUnified } from '../../../components/dev/LogoEditor.tsx'

const action = async ({ request }: { request: Request }) => {
  // Dynamic imports for server-only modules
  const { debug } = await import('#singletons/debug')
  const { Fs } = await import('@wollybeard/kit')
  const PROJECT_DATA = await import('virtual:polen/project/data.jsonsuper').then(m => m.default)
  
  const _debug = debug.sub('logo-editor')
  console.log('[SERVER] Logo editor action called')
  _debug('action called')

  if (!import.meta.env.SSR) {
    console.error('Action running in browser context - this should run on server!')
    return { error: 'Action must run on server' }
  }

  try {
    console.log('[SERVER] Reading form data...')
    const formData = await request.formData()
    const svg = formData.get('svg') as string
    console.log('[SERVER] SVG data received, length:', svg?.length)

    if (!svg) {
      return { error: 'Missing logo data' }
    }

    const logoPath = PROJECT_DATA.paths.absolute.public.logo
    console.log('[SERVER] Logo path:', logoPath)
    _debug('Saving logo to:', logoPath)

    await Fs.write({ path: logoPath, content: svg })
    console.log('[SERVER] Logo saved successfully')
    _debug('Logo saved successfully')

    return {
      success: true,
      message: 'Logo saved successfully',
      path: logoPath,
    }
  } catch (error) {
    console.error('[SERVER] Error saving logo file:', error)
    return { error: 'Failed to save logo file' }
  }
}

const Component = () => {
  const [exportStatus, setExportStatus] = useState<string>('')
  const [svgToSave, setSvgToSave] = useState<string>('')
  const actionData = useActionData() as { success?: boolean; message?: string; error?: string } | undefined

  // Verify component is mounting
  React.useEffect(() => {
    console.log('Logo editor component mounted')
    return () => console.log('Logo editor component unmounted')
  }, [])

  // Handle action response
  React.useEffect(() => {
    if (actionData) {
      if (actionData.success) {
        setExportStatus('Logo saved! HMR will update your site automatically.')
        setTimeout(() => setExportStatus(''), 3000)
      } else if (actionData.error) {
        setExportStatus(`Error: ${actionData.error}`)
      }
    }
  }, [actionData])

  const handleSaveAsProjectLogo = () => {
    console.log('Button clicked - starting save process')
    try {
      // Get the largest preview SVG
      const svgElements = document.querySelectorAll('#logo-editor-preview svg')
      console.log('Found SVG elements:', svgElements.length)

      if (svgElements.length === 0) {
        console.error('No SVG elements found in #logo-editor-preview')
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
      console.log('SVG string created, length:', svgString.length)
      setSvgToSave(svgString)

      // Submit the form programmatically
      setTimeout(() => {
        const form = document.getElementById('save-logo-form') as HTMLFormElement
        console.log('Form element:', form)
        if (form) {
          console.log('Submitting form...')
          form.requestSubmit()
        } else {
          console.error('Form not found!')
        }
      }, 100) // Small delay to ensure state update
    } catch (error) {
      console.error('Error in handleSaveAsProjectLogo:', error)
      setExportStatus('Error saving logo files')
    }
  }

  const handleExportLogo = async () => {
    try {
      // We need to get the export button from the logo editor and trigger it
      // or better yet, modify the component to expose the export functionality
      // For now, let's get the largest preview SVG
      const svgElements = document.querySelectorAll('#logo-editor-preview svg')
      const largestSvg = Array.from(svgElements).reduce((largest, current) => {
        const currentSize = parseInt(current.getAttribute('width') || '0')
        const largestSize = parseInt(largest?.getAttribute('width') || '0')
        return currentSize > largestSize ? current : largest
      }, svgElements[0])

      if (!largestSvg) {
        setExportStatus('Error: No logo found to export')
        return
      }

      // Clone and prepare the SVG
      const svgClone = largestSvg.cloneNode(true) as SVGElement
      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      // Set a standard export size
      svgClone.setAttribute('width', '128')
      svgClone.setAttribute('height', '128')
      svgClone.setAttribute('viewBox', '0 0 128 128')

      // Get SVG string
      const svgString = new XMLSerializer().serializeToString(svgClone)

      // Fallback to download
      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'logo.svg'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportStatus("Logo downloaded! Place it in your project's logo location.")
      setTimeout(() => setExportStatus(''), 5000)
    } catch (error) {
      console.error('Error exporting logo:', error)
      setExportStatus('Error exporting logo')
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
          <Form method='post' action='/polen/editor/logo' id='save-logo-form'>
            <input type='hidden' name='svg' value={svgToSave} />
            <button type='submit' style={{ display: 'none' }}>Submit</button>
          </Form>
          <Flex gap='3' align='center'>
            <Button
              size='3'
              onClick={handleSaveAsProjectLogo}
              style={{ cursor: 'pointer' }}
              type='button'
            >
              Set as Project Logo
            </Button>
            <Button
              size='2'
              variant='soft'
              onClick={handleExportLogo}
              style={{ cursor: 'pointer' }}
            >
              Download SVG
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
