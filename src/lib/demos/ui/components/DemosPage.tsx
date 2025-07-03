import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import React from 'react'
import { getOrderedDemos } from '../../config.ts'
import type { DemoPageData } from '../types.ts'
import { DemoCard } from './DemoCard.tsx'
import { PageHeader } from './PageHeader.tsx'
import { VersionInfo } from './VersionInfo.tsx'

// Read CSS file once at module level
const demosCSS = readFileSync(
  join(import.meta.dirname, 'demos.css'),
  'utf-8',
)

export const DemosPage = ({ data }: { data: DemoPageData }) => {
  const { theme, content, demos } = data

  return (
    <html lang='en'>
      <head>
        <meta charSet='UTF-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <title>{content.title}{data.prNumber && ` - PR #${data.prNumber} Preview`}</title>
        <meta name='description' content={content.description} />
        {content.logoUrl && <link rel='icon' href={content.logoUrl} />}
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
        <PageHeader data={data} />
        <div className='container'>
          <div className='demos-grid'>
            {demos.map(demo => <DemoCard key={demo.name} demo={demo} data={data} />)}
          </div>
          <VersionInfo data={data} />
          <div className='footer'>
            <p>
              Built with{' '}
              <a href='https://github.com/the-guild-org/polen' target='_blank' rel='noreferrer'>
                Polen
              </a>{' '}
              - The delightful GraphQL documentation framework
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
