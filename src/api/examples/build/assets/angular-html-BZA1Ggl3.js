var e = `Angular HTML`,
  t = {
    'R:text.html - (comment.block, text.html meta.embedded, meta.tag.*.*.html, meta.tag.*.*.*.html, meta.tag.*.*.*.*.html)':
      {
        comment: `Uses R: to ensure this matches after any other injections.`,
        patterns: [{ match: `<`, name: `invalid.illegal.bad-angle-bracket.html` }],
      },
  },
  n = `angular-html`,
  r = [{ include: `text.html.basic#core-minus-invalid` }, {
    begin: `(</?)(\\w[^\\s>]*)(?<!/)`,
    beginCaptures: { 1: { name: `punctuation.definition.tag.begin.html` }, 2: { name: `entity.name.tag.html` } },
    end: `((?: ?/)?>)`,
    endCaptures: { 1: { name: `punctuation.definition.tag.end.html` } },
    name: `meta.tag.other.unrecognized.html.derivative`,
    patterns: [{ include: `text.html.basic#attribute` }],
  }],
  i = `text.html.derivative.ng`,
  a = { displayName: e, injections: t, name: n, patterns: r, scopeName: i }
export { a as default, e as displayName, i as scopeName, n as name, r as patterns, t as injections }
