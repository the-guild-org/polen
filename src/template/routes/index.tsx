import { Catalog } from '#lib/catalog'
import { routeIndex } from '#lib/react-router-effect/react-router-effect'
import { Box } from '@radix-ui/themes'
import * as React from 'react'
import { examplesCatalog } from 'virtual:polen/project/examples'
import { homeConfig } from 'virtual:polen/template/home-config'
import { ExamplesSection } from '../components/home/ExamplesSection.js'
// import { FeaturesGridSection } from '../components/home/FeaturesGrid.js'
import { Hero } from '../components/home/Hero.js'
// import { PlaygroundPreviewSection } from '../components/home/PlaygroundPreview.js'
import { QuickStartSection } from '../components/home/QuickStart.js'
// import { RecentChangesSection } from '../components/home/RecentChanges.js'
// import { ResourcesSection } from '../components/home/Resources.js'
import { SocialProof } from '../components/home/SocialProof.js'
import { catalog } from '../data/catalog.js'

const Component = () => {
  const schema = catalog && Catalog.getLatestSchema(catalog)

  // @claude if home is disabled that means the home page should become the reference
  // If home is explicitly disabled, return null
  // if (homeConfig.enabled === false) {
  //   return null
  // }

  // Filter examples based on home config
  const filteredExamples = React.useMemo(() => {
    // Early return if examples is disabled or not configured
    if (homeConfig.examples === false || !homeConfig.examples) {
      return examplesCatalog.examples
    }

    // At this point, TypeScript knows homeConfig.examples is the object type
    const examplesConfig = homeConfig.examples
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
  }, [homeConfig.examples])

  return (
    <Box>
      {homeConfig.hero !== false && (
        <Hero
          {...(typeof homeConfig.hero === 'object'
            ? Object.fromEntries(Object.entries(homeConfig.hero).filter(([_, v]) => v !== undefined))
            : {})}
        />
      )}
      {homeConfig.socialProof && typeof homeConfig.socialProof === 'object' && 'logos' in homeConfig.socialProof && (
        <SocialProof
          logos={[...homeConfig.socialProof.logos] as any}
          {...(homeConfig.socialProof.title !== undefined ? { title: homeConfig.socialProof.title } : {})}
        />
      )}
      {homeConfig.quickStart !== false && <QuickStartSection />}
      {homeConfig.examples !== false && filteredExamples.length > 0 && schema && (
        <ExamplesSection
          examples={filteredExamples}
          schema={schema.definition}
          {...(typeof homeConfig.examples === 'object'
            ? Object.fromEntries(
              Object.entries({
                title: homeConfig.examples.title,
                description: homeConfig.examples.description,
                maxExamples: homeConfig.examples.maxExamples,
              }).filter(([_, v]) => v !== undefined),
            )
            : {})}
        />
      )}
      {/*{schema && homeConfig.quickStart !== false && <PlaygroundPreview schema={schema.definition} />}*/}
      {
        /*{homeConfig.stats !== false && <FeaturesGrid />}
      {homeConfig.changelog !== false && (
        <RecentChanges
          {...(typeof homeConfig.changelog === 'object'
            ? Object.fromEntries(Object.entries(homeConfig.changelog).filter(([_, v]) => v !== undefined))
            : {})}
        />
      )}
      {homeConfig.resources !== false && (
        <Resources
          {...(typeof homeConfig.resources === 'object'
            ? Object.fromEntries(Object.entries(homeConfig.resources).filter(([_, v]) => v !== undefined))
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
