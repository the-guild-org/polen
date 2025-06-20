#!/usr/bin/env node

import { Arr, Cli, Path, Str } from '@wollybeard/kit'
import $ from 'ansis'
import console from 'console'

const commandsDir = import.meta.dirname
const thisModuleName = Path.parse(import.meta.filename).name
const cliName = `polen static`

const h2 = (str: string) => {
  return $.bold.black.bgWhiteBright(` ${str.toUpperCase()} `)
}

const code = (str: string) => {
  if (!$.isSupported()) return `\`${str}\``
  return $.magenta(str)
}

const s = Str.Builder()
const allCommands = await Cli.discoverCommandPointers(commandsDir)
const commands = allCommands.filter(_ => _.name !== thisModuleName)

s``
s`${$.bold.redBright`POLEN 🌺`} ${$.dim(`static commands`)}`
s`Manage static builds and deployments.`
s``
s``
s`${h2(`commands`)}`
s``

if (Arr.isEmpty(commands)) {
  s`No commands available yet.`
} else {
  commands.forEach(command => {
    s`${$.dim`$ ${cliName}`} ${$.cyanBright(command.name)}`
  })
}
s``
s`${$.dim`Get help for a command with ${code(`polen static <command> --help`)}`}`
s``

console.log(Str.indent(String(s)))
