// TODO: Review and replace inline styles with Tailwind classes
import { DirectedFilter } from '#lib/directed-filter'
import { routeIndex } from '#lib/react-router-effect/react-router-effect'
import { redirect } from 'react-router'
import { templateConfig } from 'virtual:polen/project/config'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { ExamplesSection } from '../components/home/ExamplesSection.js'
import { Hero } from '../components/home/HeroSection.js'
import { Container } from '../components/ui/index.js'

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
    <>
      {templateConfig.home.hero.enabled && (
        <Hero
          {...Object.fromEntries(
            Object.entries(templateConfig.home.hero).filter(([k, v]) => k !== 'enabled' && v !== undefined),
          )}
        />
      )}
      <Container style={{ marginTop: '800px' }}>
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
      </Container>
    </>
  )
}

export const index = routeIndex({
  loader,
  Component,
})
