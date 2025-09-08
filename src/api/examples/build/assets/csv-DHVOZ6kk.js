var e = `CSV`,
  t = [`csv`],
  n = `csv`,
  r = [{
    captures: {
      1: { name: `rainbow1` },
      2: { name: `keyword.rainbow2` },
      3: { name: `entity.name.function.rainbow3` },
      4: { name: `comment.rainbow4` },
      5: { name: `string.rainbow5` },
      6: { name: `variable.parameter.rainbow6` },
      7: { name: `constant.numeric.rainbow7` },
      8: { name: `entity.name.type.rainbow8` },
      9: { name: `markup.bold.rainbow9` },
      10: { name: `invalid.rainbow10` },
    },
    match:
      `((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?((?: *"(?:[^"]*"")*[^"]*" *(?:,|$))|(?:[^,]*(?:,|$)))?`,
    name: `rainbowgroup`,
  }],
  i = `text.csv`,
  a = { displayName: `CSV`, fileTypes: t, name: `csv`, patterns: r, scopeName: i }
export { a as default, e as displayName, i as scopeName, n as name, r as patterns, t as fileTypes }
