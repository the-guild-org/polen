var e = `CODEOWNERS`,
  t = `codeowners`,
  n = [{ include: `#comment` }, { include: `#pattern` }, { include: `#owner` }],
  r = {
    comment: {
      patterns: [{
        begin: `^\\s*#`,
        captures: { 0: { name: `punctuation.definition.comment.codeowners` } },
        end: `$`,
        name: `comment.line.codeowners`,
      }],
    },
    owner: { match: `\\S*@\\S+`, name: `storage.type.function.codeowners` },
    pattern: { match: `^\\s*(\\S+)`, name: `variable.other.codeowners` },
  },
  i = `text.codeowners`,
  a = { displayName: e, name: t, patterns: n, repository: r, scopeName: i }
export { a as default, e as displayName, i as scopeName, n as patterns, r as repository, t as name }
