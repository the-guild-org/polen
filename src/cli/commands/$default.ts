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

const commandNames = await getCommandNames()

const codeStyle = (str: string) => {
  if (!$.isSupported()) return `\`${str}\``
  return $.magenta(str)
}

const s = Str.Builder()

s``
s``
s`${$.bold.redBright`POLEN 🌺`}`
s`${$.whiteBright(manifest.description)}.`
s``
s`Available Commands:`
s``
if (Arr.isEmpty(commandNames)) {
  s`  No commands available yet.`
} else {
  commandNames.forEach(name => {
    s`  ${$.dim`$ polen`} ${$.cyanBright(name)}`
  })
}
s``
s``
s`${$.dim`Get help for a command with ${codeStyle(`polen <command> --help`)}`}`
s``
s``

console.log(Str.indent(String(s)))
