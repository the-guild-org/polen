import { Catalog } from '#lib/catalog'
import { routeIndex } from '#lib/react-router-effect/react-router-effect'
import { Box } from '@radix-ui/themes'
import * as React from 'react'
import { Navigate } from 'react-router'
import { templateConfig } from 'virtual:polen/project/config'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { schemasCatalog } from 'virtual:polen/project/schemas'
import { ExamplesSection } from '../components/home/ExamplesSection.js'
import { Hero } from '../components/home/Hero.js'
import { QuickStartSection } from '../components/home/QuickStart.js'
import { SocialProof } from '../components/home/SocialProof.js'

const Component = () => {
  const schema = schemasCatalog && Catalog.getLatestSchema(schemasCatalog)

  // If home is disabled, redirect to reference page
  if (templateConfig.home.enabled === false) {
    return <Navigate to="/reference" replace />
  }

  // Filter examples based on home config
  const filteredExamples = React.useMemo(() => {
    // Early return if examples is disabled or not configured
    if (templateConfig.home.examples === false || !templateConfig.home.examples) {
      return examplesCatalog.examples
    }

    // At this point, TypeScript knows templateConfig.home.examples is the object type
    const examplesConfig = templateConfig.home.examples
    let examples = [...examplesCatalog.examples]

    // Apply 'only' filter if specified
    if (examplesConfig.only && examplesConfig.only.length > 0) {
      examples = examples.filter(
        example => examplesConfig.only!.includes(example.name),
      )
    }

    // Apply 'exclude' filter if specified
    if (examplesConfig.exclude && examplesConfig.exclude.length > 0) {
      examples = examples.filter(
        example => !examplesConfig.exclude!.includes(example.name),
      )
    }

    return examples
  }, [templateConfig.home.examples])

  return (
    <Box>
      {templateConfig.home.hero !== false && (
        <Hero
          {...(typeof templateConfig.home.hero === 'object'
            ? Object.fromEntries(Object.entries(templateConfig.home.hero).filter(([_, v]) => v !== undefined))
            : {})}
        />
      )}
      {templateConfig.home.socialProof && typeof templateConfig.home.socialProof === 'object'
        && 'logos' in templateConfig.home.socialProof && (
        <SocialProof
          logos={[...templateConfig.home.socialProof.logos] as any}
          {...(templateConfig.home.socialProof.title !== undefined
            ? { title: templateConfig.home.socialProof.title }
            : {})}
        />
      )}
      {templateConfig.home.quickStart !== false && <QuickStartSection />}
      {templateConfig.home.examples !== false && filteredExamples.length > 0 && schema && (
        <ExamplesSection
          examples={filteredExamples}
          schema={schema.definition}
          {...(typeof templateConfig.home.examples === 'object'
            ? Object.fromEntries(
              Object.entries({
                title: templateConfig.home.examples.title,
                description: templateConfig.home.examples.description,
                maxExamples: templateConfig.home.examples.maxExamples,
              }).filter(([_, v]) => v !== undefined),
            )
            : {})}
        />
      )}
      {/*{schema && templateConfig.home.quickStart !== false && <PlaygroundPreview schema={schema.definition} />}*/}
      {
        /*{templateConfig.home.stats !== false && <FeaturesGrid />}
      {templateConfig.home.changelog !== false && (
        <RecentChanges
          {...(typeof templateConfig.home.changelog === 'object'
            ? Object.fromEntries(Object.entries(templateConfig.home.changelog).filter(([_, v]) => v !== undefined))
            : {})}
        />
      )}
      {templateConfig.home.resources !== false && (
        <Resources
          {...(typeof templateConfig.home.resources === 'object'
            ? Object.fromEntries(Object.entries(templateConfig.home.resources).filter(([_, v]) => v !== undefined))
            : {})}
        />
      )}*/
      }
    </Box>
  )
}

export const index = routeIndex({
  Component,
})
