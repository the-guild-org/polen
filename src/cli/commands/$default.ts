#!/usr/bin/env node

import { Arr, Cli, Path, Str } from '@wollybeard/kit'
import manifest from '../../../package.json' with { type: 'json' }
import $ from 'ansis'
import console from 'console'

const commandsDir = import.meta.dirname
const thisModuleName = Path.parse(import.meta.filename).name
const cliName = `polen`

// Styles

const code = (str: string) => {
  if (!$.isSupported()) return `\`${str}\``
  return $.magenta(str)
}

const link = (str: string) => {
  if (!$.isSupported()) return $.underline(str)
  const url = new URL(str)
  // Split URL into protocol and the rest
  const protocol = `${url.protocol}//`
  const rest = str.substring(protocol.length)
  return `${$.dim(protocol)}${$.blue(rest)}`
}

const h2 = (str: string) => {
  return $.bold.black.bgWhiteBright(` ${str.toUpperCase()} `)
}

// ------

const getRepoUrl = (url: string): string => {
  return url
    .replace(/^git\+/, ``)
    .replace(/\.git$/, ``)
}

const s = Str.Builder()
const repoUrl = getRepoUrl(manifest.repository.url)
const allCommands = await Cli.discoverCommandPointers(commandsDir)
const commands = allCommands.filter(_ => _.name !== thisModuleName)

s``
s``
s`${$.bold.redBright`POLEN 🌺`}`
s`${$.whiteBright(manifest.description)}.`
s``
s``
s`${h2(`commands`)}`
s``

// todo?

// match(commands)
//   .empty(() => {
//     s`  No commands available yet.`
//   })
//   .else(commands => {
//     commands.forEach(command => {
//       s`  ${$.dim`$ ${cliName}`} ${$.cyanBright(command.name)}`
//     })
//   })

// match(commands, [
//   [[], () => {
//     s`  No commands available yet.`
//   }],
//   commands => {
//     commands.forEach(command => {
//       s`  ${$.dim`$ ${cliName}`} ${$.cyanBright(command.name)}`
//     })
//   },
// ])

if (Arr.isEmpty(commands)) {
  s`No commands available yet.`
} else {
  commands.forEach(command => {
    s`${$.dim`$ ${cliName}`} ${$.cyanBright(command.name)}`
  })
}
s``
s`${$.dim`Get help for a command with ${code(`polen <command> --help`)}`}`
s``
s``
s`${h2(`learn more`)}`
s``
s`${
  Str.table({
    data: {
      'Source Code': link(repoUrl),
      'Built By': link(`https://the-guild.dev`),
      'Ecosystem': link(`https://graphql.org`),
    },
  })
}`
s``
s``

console.log(Str.indent(String(s)))
