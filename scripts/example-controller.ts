import { ExampleName } from '../examples/_tests/helpers/example-name.js'
import { Command } from '@molt/command'
import { ExampleController } from '../examples/_tests/helpers/example-controller/index.js'
import { LinkProtocol } from '#lib/link-protocol.js'

const args = Command
  .create()
  .parameter(`name`, ExampleName)
  .parameter(`link`, LinkProtocol.optional())
  .parse()

const ___controller = await ExampleController.create({
  exampleName: args.name,
  debugMode: true,
  polenLink: args.link,
})
