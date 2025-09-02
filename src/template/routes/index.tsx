import { Catalog } from '#lib/catalog'
import { routeIndex } from '#lib/react-router-effect/react-router-effect'
import { Box } from '@radix-ui/themes'
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
      {examplesCatalog.examples.length > 0 && schema && (
        <ExamplesSection
          catalog={examplesCatalog}
          schema={schema.definition}
          {...(typeof homeConfig.examples === 'object'
            ? Object.fromEntries(
              Object.entries({
                title: homeConfig.examples.title,
                description: homeConfig.examples.description,
                maxExamples: homeConfig.examples.maxExamples,
                showExecutionTime: homeConfig.examples.showExecutionTime,
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
