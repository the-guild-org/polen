var e = `Shell Session`,
  t = [`sh-session`],
  n = `shellsession`,
  r = [{
    captures: {
      1: { name: `entity.other.prompt-prefix.shell-session` },
      2: { name: `punctuation.separator.prompt.shell-session` },
      3: { name: `source.shell`, patterns: [{ include: `source.shell` }] },
    },
    match:
      `(?x) ^ (?: ( (?:\\(\\S+\\)\\s*)? (?: sh\\S*?                       | \\w+\\S+[@:]\\S+(?:\\s+\\S+)? | \\[\\S+?[@:][^\\n]+?\\].*? ) ) \\s* )? ( [>$#%❯➜] | \\p{Greek} ) \\s+ (.*) $`,
  }, { match: `^.+$`, name: `meta.output.shell-session` }],
  i = `text.shell-session`,
  a = { displayName: e, fileTypes: t, name: n, patterns: r, scopeName: i }
export { a as default, e as displayName, i as scopeName, n as name, r as patterns, t as fileTypes }
