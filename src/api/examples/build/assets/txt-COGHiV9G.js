var e = `txt`,
  t = `source.txt`,
  n = [{ include: `#comment` }],
  r = {
    comment: {
      begin: `(?:(^[ \\t]*)|[ \\t]+)(?=#\\p{Print}*$)`,
      beginCaptures: { 1: { name: `punctuation.whitespace.comment.leading.txt` } },
      end: `(?!\\G)`,
      patterns: [{
        begin: `#`,
        beginCaptures: { 0: { name: `punctuation.definition.comment.txt` } },
        end: `\\n`,
        name: `comment.line.number-sign.txt`,
      }],
    },
  },
  i = { name: `txt`, scopeName: t, patterns: n, repository: r }
export { e as name, i as default, n as patterns, r as repository, t as scopeName }
