import { ExampleController } from '../examples/_tests/helpers/example-controller.js'
import { ExampleName } from '../examples/_tests/helpers/example-name.js'
import { Command } from '@molt/command'
import { PolenSource } from '../examples/_tests/helpers/polen-source.js'

const args = Command
  .create()
  .parameter(`name`, ExampleName)
  .parameter(`polen`, PolenSource.default(`registry`))
  .parse()

const _controller = await ExampleController.create({
  exampleName: args.name,
  debug: true,
  polenSource: args.polen,
})
