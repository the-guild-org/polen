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
})
