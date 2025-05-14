import { ExampleName } from '../examples/_tests/helpers/example-name.js'
import { Command } from '@molt/command'
import { ExampleController } from '../examples/_tests/helpers/example-controller/index.js'
import { PackageManager } from '@wollybeard/kit'

const args = Command
  .create()
  .parameter(`name`, ExampleName)
  .parameter(`link`, PackageManager.LinkProtocol.optional() as any)
  // todo: update `@molt/command`
  .parse() as { name: ExampleName, link?: PackageManager.LinkProtocol }

const ___controller = await ExampleController.create({
  exampleName: args.name,
  debugMode: true,
  polenLink: args.link,
})
