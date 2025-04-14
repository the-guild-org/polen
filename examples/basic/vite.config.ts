import { Polen } from 'polen'

export default Polen.createConfiguration({
  templateVariables: {
    title: `Basic Developer Portal`,
  },
  schemaAugmentations: [
    {
      type: `description`,
      on: { type: `TargetField`, name: `hello`, typeTarget: { type: `TargetType`, name: `Query` } },
      placement: `over`,
      content: `**Extra content from [Polen](https://github.com/the-guild-org/polen)**.`,
    },
  ],
})
