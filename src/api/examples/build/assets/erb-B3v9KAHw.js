var e = `ERB`,
  t = [`erb`, `rhtml`, `html.erb`],
  n = {
    'text.html.erb - (meta.embedded.block.erb | meta.embedded.line.erb | comment)': {
      patterns: [
        {
          begin: `(^\\s*)(?=<%+#(?![^%]*%>))`,
          beginCaptures: { 0: { name: `punctuation.whitespace.comment.leading.erb` } },
          end: `(?!\\G)(\\s*$\\n)?`,
          endCaptures: { 0: { name: `punctuation.whitespace.comment.trailing.erb` } },
          patterns: [{ include: `#comment` }],
        },
        {
          begin: `(^\\s*)(?=<%(?![^%]*%>))`,
          beginCaptures: { 0: { name: `punctuation.whitespace.embedded.leading.erb` } },
          end: `(?!\\G)(\\s*$\\n)?`,
          endCaptures: { 0: { name: `punctuation.whitespace.embedded.trailing.erb` } },
          patterns: [{ include: `#tags` }],
        },
        { include: `#comment` },
        { include: `#tags` },
      ],
    },
  },
  r = `erb`,
  i = [{ include: `text.html.basic` }],
  a = {
    comment: {
      patterns: [{
        begin: `<%+#`,
        beginCaptures: { 0: { name: `punctuation.definition.comment.begin.erb` } },
        end: `%>`,
        endCaptures: { 0: { name: `punctuation.definition.comment.end.erb` } },
        name: `comment.block.erb`,
      }],
    },
    tags: {
      patterns: [{
        begin: `<%+(?!>)[-=]?(?![^%]*%>)`,
        beginCaptures: { 0: { name: `punctuation.section.embedded.begin.erb` } },
        contentName: `source.ruby`,
        end: `(-?%)>`,
        endCaptures: { 0: { name: `punctuation.section.embedded.end.erb` }, 1: { name: `source.ruby` } },
        name: `meta.embedded.block.erb`,
        patterns: [{
          captures: { 1: { name: `punctuation.definition.comment.erb` } },
          match: `(#).*?(?=-?%>)`,
          name: `comment.line.number-sign.erb`,
        }, { include: `source.ruby` }],
      }, {
        begin: `<%+(?!>)[-=]?`,
        beginCaptures: { 0: { name: `punctuation.section.embedded.begin.erb` } },
        contentName: `source.ruby`,
        end: `(-?%)>`,
        endCaptures: { 0: { name: `punctuation.section.embedded.end.erb` }, 1: { name: `source.ruby` } },
        name: `meta.embedded.line.erb`,
        patterns: [{
          captures: { 1: { name: `punctuation.definition.comment.erb` } },
          match: `(#).*?(?=-?%>)`,
          name: `comment.line.number-sign.erb`,
        }, { include: `source.ruby` }],
      }],
    },
  },
  o = `text.html.erb`,
  s = { displayName: `ERB`, fileTypes: t, injections: n, name: `erb`, patterns: i, repository: a, scopeName: o }
export {
  a as repository,
  e as displayName,
  i as patterns,
  n as injections,
  o as scopeName,
  r as name,
  s as default,
  t as fileTypes,
}
