import { DirectedFilter } from '#lib/directed-filter/$'
import { routeIndex } from '#lib/react-router-effect/react-router-effect'
import { Box } from '@radix-ui/themes'
import { redirect } from 'react-router'
import { templateConfig } from 'virtual:polen/project/config'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { ExamplesSection } from '../components/home/ExamplesSection.js'
import { Hero } from '../components/home/Hero.js'
import { QuickStartSection } from '../components/home/QuickStart.js'
import { SocialProof } from '../components/home/SocialProof.js'

const loader = () => {
  // If home is disabled, redirect to reference page
  if (!templateConfig.home.enabled) {
    return redirect('/reference')
  }

  return null
}

const Component = () => {
  const filteredExamples = DirectedFilter.filterByProperty(templateConfig.home.examples.filter)('name')(
    examplesCatalog.examples,
  )

  return (
    <Box>
      {templateConfig.home.hero !== false && (
        <Hero
          {...Object.fromEntries(
            Object.entries(templateConfig.home.hero).filter(([_, v]) => v !== undefined),
          )}
        />
      )}
      {templateConfig.home.socialProof !== false && (
        <SocialProof
          logos={[...templateConfig.home.socialProof.logos] as any}
          {...(templateConfig.home.socialProof.title !== undefined
            ? { title: templateConfig.home.socialProof.title }
            : {})}
        />
      )}
      {templateConfig.home.quickStart !== false && <QuickStartSection />}
      {templateConfig.home.examples.enabled && filteredExamples.length > 0 && (
        <ExamplesSection
          examples={filteredExamples}
          schemaCatalog={schemasCatalog ?? undefined}
          {...Object.fromEntries(
            Object.entries({
              title: templateConfig.home.examples.title,
              description: templateConfig.home.examples.description,
              maxExamples: templateConfig.home.examples.maxExamples,
            }).filter(([_, v]) => v !== undefined),
          )}
        />
      )}
    </Box>
  )
}

export const index = routeIndex({
  loader,
  Component,
})
