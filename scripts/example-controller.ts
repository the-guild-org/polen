import { ExampleName } from '../examples/_tests/helpers/example-name.js'
import { Command } from '@molt/command'
import type { Ver } from '../examples/_tests/helpers/ver.js'
import { VerForMoltCommand } from '../examples/_tests/helpers/ver.js'
import { ExampleController } from '../examples/_tests/helpers/example-controller/_namespace.js'

const args = Command
  .create()
  .parameter(`name`, ExampleName)
  // TODO Molt Command needs to support Transform
  .parameter(`polenVer`, VerForMoltCommand.optional())
  .parse()

const _controller = await ExampleController.create({
  exampleName: args.name,
  debugMode: true,
  polenVer: args.polenVer as Ver | undefined,
})
