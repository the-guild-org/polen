import { Command } from '@molt/command'
import { PackageManager } from '@wollybeard/kit'
import { ExampleController } from '../tests/examples/helpers/example-controller/index.js'
import { ExampleName } from '../tests/examples/helpers/example-name.js'

const args = Command
  .create()
  .parameter(`name`, ExampleName as any)
  .parameter(`link`, PackageManager.LinkProtocol.optional() as any)
  // todo: update `@molt/command`
  .parse() as { name: ExampleName; link?: PackageManager.LinkProtocol }

const ___controller = await ExampleController.create({
  exampleName: args.name,
  debugMode: true,
  polenLink: args.link,
})
