import { ExampleController } from '../examples/_tests/helpers/example-controller.js'
import { ExampleName } from '../examples/_tests/helpers/example-name.js'
import { Command } from '@molt/command'
import { Ver } from '../examples/_tests/helpers/ver.js'

const args = Command
  .create()
  .parameter(`name`, ExampleName)
  // TODO Molt Command needs to support Transform
  .parameter(`polen`, Ver.optional() as any)
  .parse()

const _controller = await ExampleController.create({
  exampleName: args.name,
  debug: true,
  polenVer: args.polen as Ver | undefined,
})
