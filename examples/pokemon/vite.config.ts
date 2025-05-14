import Restart from 'vite-plugin-restart'
import Inspect from 'vite-plugin-inspect'
import { Polen } from 'polen'

export default Polen.defineConfig({
  templateVariables: {
    title: `Pokemon Developer Portal`,
  },
  schemaAugmentations: [
    {
      type: `description`,
      on: {
        type: `TargetField`,
        name: `pokemons`,
        typeTarget: { type: `TargetType`, name: `Query` },
      },
      placement: `over`,
      content: `**Extra content from [Polen](https://github.com/the-guild-org/polen)**.`,
    },
  ],
  vite: {
    plugins: [
      Inspect({
        build: true,
        outputDir: '.vite-inspect',
      }),
      Restart({
        restart: [
          '../../build/**/*',
        ],
      }),
    ],
  },
})
