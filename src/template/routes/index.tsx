import { Catalog } from '#lib/catalog'
import { routeIndex } from '#lib/react-router-effect/react-router-effect'
import { Box } from '@radix-ui/themes'
import { examples } from 'virtual:polen/project/examples'
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
  return <Box>home todo</Box>
}

export const index = routeIndex({
  Component,
})
