var e = `Fortran (Fixed Form)`,
  t = [`f`, `F`, `f77`, `F77`, `for`, `FOR`],
  n = {
    'source.fortran.fixed - ( string | comment )': {
      patterns: [{ include: `#line-header` }, { include: `#line-end-comment` }],
    },
  },
  r = `fortran-fixed-form`,
  i = [{ include: `#comments` }, { include: `#line-header` }, { include: `source.fortran.free` }],
  a = {
    comments: {
      patterns: [{ begin: `^[cC\\*]`, end: `\\n`, name: `comment.line.fortran` }, {
        begin: `^ *!`,
        end: `\\n`,
        name: `comment.line.fortran`,
      }],
    },
    'line-end-comment': { begin: `(?<=^.{72})(?!\\n)`, end: `(?=\\n)`, name: `comment.line-end.fortran` },
    'line-header': {
      captures: {
        1: { name: `constant.numeric.fortran` },
        2: { name: `keyword.line-continuation-operator.fortran` },
        3: { name: `source.fortran.free` },
        4: { name: `invalid.error.fortran` },
      },
      match: `^(?!\\s*[!#])(?:([ \\d]{5} )|( {5}.)|(\\t)|(.{1,5}))`,
    },
  },
  o = `source.fortran.fixed`,
  s = { displayName: e, fileTypes: t, injections: n, name: r, patterns: i, repository: a, scopeName: o }
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
