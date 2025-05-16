#!/usr/bin/env node

import { Arr, Fs, Path, Str } from '@wollybeard/kit'
import manifest from '../../../package.json' with { type: 'json' }
import { isNot } from '@wollybeard/kit/eq'
import { getWith } from '@wollybeard/kit/obj'
import $ from 'ansis'

const commandsDir = import.meta.dirname
const moduleName = Path.parse(import.meta.filename).name

const getCommandNames = async (): Promise<string[]> => {
  const files = (await Fs.readDirFilesNames(commandsDir)) ?? []
  const names = files
    .map(Path.parse)
    .map(getWith(`name`))
    .filter(isNot(moduleName))
  return names
}

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

const getRepoUrl = (url: string): string => {
  return url
    .replace(/^git\+/, ``) // Remove git+ prefix
    .replace(/\.git$/, ``) // Remove .git suffix
}

const h2 = (str: string) => {
  return $.bold.black.bgWhiteBright(` ${str.toUpperCase()} `)
}

const s = Str.Builder()
const repoUrl = getRepoUrl(manifest.repository.url)
const commandNames = await getCommandNames()

s``
s``
s`${$.bold.redBright`POLEN 🌺`}`
s`${$.whiteBright(manifest.description)}.`
s``
s``
s`${h2(`commands`)}`
s``
if (Arr.isEmpty(commandNames)) {
  s`  No commands available yet.`
} else {
  commandNames.forEach(name => {
    s`  ${$.dim`$ polen`} ${$.cyanBright(name)}`
  })
}
s``
s`${$.dim`Get help for a command with ${code(`polen <command> --help`)}`}`
s``
s``
s`${h2(`learn more`)}`
s``
s`${
  Str.indent(Str.table({
    data: {
      'Source Code': link(repoUrl),
      'Built By': link(`https://the-guild.dev`),
      'Ecosystem': link(`https://graphql.org`),
    },
  }))
}`
s``
s``

console.log(Str.indent(String(s)))
