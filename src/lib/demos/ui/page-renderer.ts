/**
 * HTML page renderer for demo landing pages
 */

import React from 'react'
import { renderToString } from 'react-dom/server'
import type { DemoConfig } from '../config.ts'
import { DemosPage } from './components/DemosPage.tsx'
import type { LandingPageData } from './data-collector.ts'

/**
 * Render demo landing page using React SSR
 */
export const renderDemoLandingPage = (
  config: DemoConfig,
  data: LandingPageData,
): string => {
  const html = renderToString(
    React.createElement(DemosPage, { config, data }),
  )
  return `<!DOCTYPE html>\n${html}`
}
