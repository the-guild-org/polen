var e = `QML Directory`,
  t = `qmldir`,
  n = [{ include: `#comment` }, { include: `#keywords` }, { include: `#version` }, { include: `#names` }],
  r = {
    comment: { patterns: [{ begin: `#`, end: `$`, name: `comment.line.number-sign.qmldir` }] },
    'file-name': { patterns: [{ match: `\\b\\w+\\.(qmltypes|qml|js)\\b`, name: `string.unquoted.qmldir` }] },
    identifier: { patterns: [{ match: `\\b\\w+\\b`, name: `variable.parameter.qmldir` }] },
    keywords: {
      patterns: [{
        match: `\\b(module|singleton|internal|plugin|classname|typeinfo|depends|designersupported)\\b`,
        name: `keyword.other.qmldir`,
      }],
    },
    'module-name': { patterns: [{ match: `\\b[A-Z]\\w*\\b`, name: `entity.name.type.qmldir` }] },
    names: { patterns: [{ include: `#file-name` }, { include: `#module-name` }, { include: `#identifier` }] },
    version: { patterns: [{ match: `\\b\\d+\\.\\d+\\b`, name: `constant.numeric.qml` }] },
  },
  i = `source.qmldir`,
  a = { displayName: e, name: t, patterns: n, repository: r, scopeName: i }
export { a as default, e as displayName, i as scopeName, n as patterns, r as repository, t as name }
