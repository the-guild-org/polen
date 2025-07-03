import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import type { DemoConfig } from '../../config.ts'
import type { LandingPageData } from '../data-collector.ts'
import { DemosGrid } from './DemosGrid.tsx'
import { Footer } from './Footer.tsx'
import { Header } from './Header.tsx'
import { PrBanner } from './PrBanner.tsx'
import { VersionInfo } from './VersionInfo.tsx'

// Read CSS file once at module level
const demosCSS = readFileSync(
  join(import.meta.dirname, 'demos.css'),
  'utf-8',
)

const getPageTitle = (config: DemoConfig, data: LandingPageData): string => {
  let title = config.ui.content.title
  if (data.config.prNumber) {
    title = `${title} - PR #${data.config.prNumber} Preview`
  }
  return title
}

export const DemosPage: React.FC<{
  config: DemoConfig
  data: LandingPageData
}> = ({ config, data }) => {
  const { theme } = config.ui

  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>{getPageTitle(config, data)}</title>
        <meta name='description' content={config.ui.content.description} />
        {config.ui.content.logoUrl && <link rel='icon' href={config.ui.content.logoUrl} />}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root {
              --demo-primary-color: ${theme.primaryColor};
              --demo-bg-color: ${theme.backgroundColor};
              --demo-text-color: ${theme.textColor};
            }
            ${demosCSS}
          `,
          }}
        />
      </head>
      <body>
        {data.config.prNumber && <PrBanner prNumber={data.config.prNumber} />}
        <div className='container'>
          <Header config={config} data={data} />
          <DemosGrid config={config} data={data} />
          <VersionInfo data={data} />
          <Footer />
        </div>
      </body>
    </html>
  )
}
