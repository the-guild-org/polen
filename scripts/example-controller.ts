import { ExampleController } from '../examples/_tests/helpers/example-controller.js'
import { ExampleName } from '../examples/_tests/helpers/example-name.js'
import { Command } from '@molt/command'

const args = Command
  .create()
  .parameter(`name`, ExampleName)
  .parse()

const _controller = await ExampleController.create({
  exampleName: args.name,
  debug: true,
})
