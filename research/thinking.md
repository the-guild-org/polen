# Interface Definition

- i would rather annotations are added to the hydratable schemas, not the 'pure' original ones

- annotations need to specify file name mapping i agree, beause they'll use variables in their data to be named

# Interface IO

- thinking through the IO...

Factories for creating managers?

```ts
const catalogExporter: Hydra.Exporter.Exporter<CatalogHydratableSchema> = Hydra
  .Exporter.make(catalogHydratableSchema)
const catalogImporter: Hydra.Importer.Importer<CatalogHydratableSchema> = Hydra
  .Importer.make(catalogHydratableSchema)

function* gen() {
  // defaults
  yield* catalogExporter.write(catalogHydratable) // Effect<...>
  // override defaults
  yield* catalogExporter.write(catalogHydratable, {
    name: '...',
    path: '...',
    targets: {/* ...*/},
  }) // Effect<...>

  yield* catalogExporter.import(catalogHydratable) // Effect<CatalogHydrated, ...>
}
```

In the above, I guess the methods shown would have to run in an Effect Context that includes something like... 'HydraIO' ? or more general like 'IO' ? (LocalFileIO, RemoteFileIO, etc.)

But do we need managers? Maybe just direct funcs:

```ts
function* gen() {
  yield* Hydra.Exporter.export(catalogHydratableSchema, catalogHydratable)
  yield* Hydra.Importer.import(catalogHydratableSchema, catalogHydratable)
}
```

I can see that actually these are close/same if we think about the in terms of currying!

Maybe instead of two namesaced we have just one:

```ts
Hydra.Bridge.{import, export, ...}
```

This make sme realize we'll need to have the schemas on the client side, noted.

The whole point is to have incremental hydration so our importing needs to be more piecemeal capable but remain type safe. This is where a manager might come in handy.

```ts
const catalogHydrator = Hydra.Bridge.make(catalogHydratableSchema)

function* gen() {
  yield* catalogHydrator.hydrateRevision(catalogHydratable, {
    /*  ... unique key(s) marked by hydratable form ... */
  })
  // catalogHydratable is mutated to have all dehydrated instances of that revision now be hydrated!
}
```

# Interface Hydrator Depth

We would also need to think abuot depth:

```ts
function* gen() {
  // hydrate ONLY self, not children
  yield* catalogHydrator.hydrateCatalog(catalogHydratable)

  // hydrate self AND ALL children
  yield* catalogHydrator.hydrateCatalog(catalogHydratable, {
    hydrate: true,
    children: true,
  })

  // hydrate self AND the 'something' relation
  yield* catalogHydrator.hydrateCatalog(catalogHydratable, {
    hydrate: true,
    children: { something: true },
  })
}
```

i am realizing we will need a more nuanced way to express hydration targetting.
currently we can express:

- self
- self + selected children
- skip + selected children
- self + selected children + selected grandchildren
- skip + skip children + selected grandchildren ...

so as a grammar...

```
- <SELECT> = <take|skip>, [<SELECTION>]
- <SELECTION> = <relation_name>:<SELECT>
```

but notice we have no way to express '*' here, its only explicit selections.
maybe that's fine for now, but i think it might be a DX issue in some cases.
but as i think about it more... i think its OK for now.

# About the hydrator alogirthm

1. when record is hydrated all instances of that record in the current visible dehydrated data are hydrated

- for example imgine schema of: `post -> { text, author, comments -> { text, author, message } }` -- hydrating 'author' of post would also hydrate that same record on comments if present e.g. the author of the post commented on their own post

2. if its possible that a relation's relations are not visible yet beacuse its simply stored as null (e.g. post.comments is null instead of array of dehydrated) which IIUC is ** NOT ** a concept we ahve today but IF it were my expectation that would be WHEN scope of "data" would expand that any incoming dehydrated records THAT HAVE ALREADY BEEN HYDRATED BEFORE would automatically hydrate on additon

- for example, going back to our blog scheam, imagine that comments was null, we hydate the author, then LATER 'discover' the comments meaning 'null' becomes dehydrated comments (note, 'discover' being a new term to capture state change of null -> dehydrated which is different than dehydrated -> hydrated) any comment author record that is the post author (identified by the unique keys) would be hydrated automatically

3. In sum:
   - we have the state change concept curently of dehydrated -> hydrated which gives the benefit of being to do things like "post as X number of comments" by "x different authors" etc. WITHOUT having to fetch the whole record
   - in the future we may want the state change concept of null -> dehydrated and maybe even null -> hydrated

# General Notes

- realizing that 'children' as a term in this doc and in existing Targets data type might be better called 'relations'
- realizing that 'Targets' as a term would be better called 'Selection'!

# For Claude

## Confirmations

- I agree with 'bridge' as annotation namespace

## Changes

- [x] I think annotations paths should be relative to a base that will be decided at the last mile, e.g. annotation might say '/a/b/c' path with name 'foo' but then the actual IO might for example:
  - read from https://site.io/assets/<path>/<name>.json
  - read from or write to ~/projects/blah/node_modules/.cache/thing/<path>/<name>.json
  - write to ~/projects/blah/build/assets/<path>/<name>.json
- [x] i think we should force all assets to use json form so there is no control for author about concept of file extension etc.
- [x] i addition to the above, i think we should have all file names have an extension that matches the ADT name (not member tag) and name is just a prefix on that, unable to replace the extension.
  - so the pattern would be: `[<custom>].<adt_name>.json`
  - examples:
    - catalog -> 'catalog.json'
    - schema -> 'schema.json'
    - schema with `name: (data) => data.version` -> '1.2.0.schema.json'
    - revision -> 'revision.json'
    - revision with `name: (data) => data.date + '@' + data.schema.version` -> '2025-12-14@1.2.0.revision.json'
- [x] In annotations, we don't need to specify key or relations right now because:
  1. hydratable schema keys is for that purpose -- i can see that in the future this won't be good enough but it is ok for our use case now
  - in the future what i expect is that hydtable will automatically include scalar keys in encoded and treat all objects/arrays as relations and user will be able to tweak that marking while still also specifying what are the 'unique keys' for retrieval purposes
  2. any schema on properties of self or recurisvely downward that are hydratable we will infer to be a relation
- [x] i think annotation schema should be:
  - name func - how to construct the name of the asset
  - ~~path func - how to construct the path of the asset~~
- for schema annotation the values are:
  - unversioned: name: ver

# Questions

- [x] we need to think about the interface for IO to specify the base of the assets IO since i want data types to only know their relative position
  - construtor config + export func overrides
- [x] how does bridge import from memory into index
  - overloaded function
- [x] Let's define the bridge index keying algorithm: i suggest: `<adt-name>___<adt-member-name>[___<uniqueFieldName>@<uniqueFieldValue>][]`
  - yes
- [x] we need a way to get 'ADT Name' because unfortunately right now its weak, all we have really is schema.Union which doesn't bring stronger concept than typescript '|' i guess?
  - review all schema docs for confirming Effect schema limtiatons here
  - idea: ** IF ** we are limited by effect schema, then maybe we can for now use annotations to solve this, an annotation on the union level?? and maybe schema v4 will allow us to improve

  > ~~this has been answered, we came up with a Schema.UnionAdt concept~~ -- after more thinking we realized we can use identifier on Schema.Union for this already

# Claude Iterations

## Current

Unifying Targets and Selections

```
<adt_name>?:
  <member_name>:
    | true -- if no unique keys e.g. catalog
    | { <unique_key>: <unique_key_value> }
```

```
hydratable?: boolean
children?: {
  <relation_name>?: Targets
}
```

## History 4

re bridge import design, i like import overload that defaults to bridge "target" ("source"? we still need a good name for that akin to the import side of index); note that this means the imporrt overload returns an effect by default but when from memory it is simpler, just sync

Answers:

2. yes we'll ship schemas to client for now and then schema v4 should autoatmically reduce bundle size for us
3. i'm ok with two systems but let's briefly try to merge the systems right now
4. we can live with the risk for now
5. yes i assumed we would make it type safe, its just obvious to me it will be / have to be; it is totally unusable without type safety due to lack of autocompleion

## History 3

1. new instance, it knows the schema because constructor was dervied from it!
2. I don't understand the question; the schema is our 'map' and solves all pathing issues; bridge is able to discover ALL the hydratables in a given schema; the bridge interface then allows peek/view over ANY hydratable type;

3.

- i think your quesetion is about this ...:
  - There are ADTs that can be hydratable
  - ADTs can have other ADTs as member struct properties
  - this implies a few things:
    - the possibility of an ADT appearing in MULTIPLE schema locations
    - the possibility of direct or indirect ADT recursion
  - But i see no issue here actually, we know the DOWNSTREAM relations because of the schema, but we do NOT know the UPSTREAM relations, and that is a limitation of our API right now that is fine, user MUST start from the 'top most' place that they need
  - But i do see a new opportunitiy, but not for now, which is that Hydra could track the relations and actually already know for example "adt A can be referenced from locations M,N,O" which would allow a generalized type safe graph feature for example of `... a.parent // type: M,N,O -- but this needs more thinking and not needed now

4. (see 5)
5. yes its a new dsl of this format:

```
<adt_name>?:
  <member_name>:
    | true -- if no unique keys e.g. catalog
    | { <unique_key>: <unique_key_value> }
```

6.

- i think we can have import/export/peek/view

```
bridge.import() // everything is brought over bridge and MERGED into index
bridge.export() // everything in index currently is sent over bridge and MERGED into '...' (if we can "import" into "index" then what do we "export" into?)
bridge.peek() // read maybe-hydrated value of record, maybe because the index read might yield that it was previously hydrated, so, checks index, if miss, imports just it into index, then returns it
bridge.view() // read hydrated value of record, checks index for it + relations recursively, for every miss or still-dehydrated (including self), imports just it into index, thus at the end being able to return the fully hydrated value,
```

The key difference is that import/export are more plumbing operations for infra cases rather than vanilla biz coding situations

7.

- no persistence, that would be circular, since bridge is already basically that

### Claude Asks

Questions About the New API:

1. Bridge Creation Pattern:
   // In catalog/catalog.ts
   export const Bridge = Hydra.Bridge.make(CatalogHydratable)

// In app code
const bridge = Catalog.Bridge.make() // No schema needed?

1. Should Catalog.Bridge.make() create a new instance or return a singleton? If new instance, how does it know the
   schema without passing it?
2. Nested Hydration Problem:
   You raised a good point - if user has a sub-object like schema from catalog.entries.find(...), how do they hydrate
   its relations?

3. Options:
   - A) Bridge tracks all objects and can hydrate from any reference
   - B) User must specify the full path context
   - C) Each hydratable object knows its location in the graph
4. peek/view Query Language:
   The query objects are interesting:
   { catalog: { versioned: true }}
   { revision: { versioned: { date: '2025-12-14', version: '1.2.0' } }}

5. Is this a DSL for selecting specific records? How does it relate to the selection grammar?
6. Export/Import with New API:
   How do export/import fit with peek/view? Something like:
   yield* bridge.export() // Export everything in index
   yield* bridge.import() // Import and populate index
7. Index Persistence:
   Does the index get serialized/saved, or is it rebuilt on each session?

This peek/view pattern with the index is quite powerful - it provides both the incremental loading capability and
maintains type safety. The stateful bridge acting as a repository pattern makes a lot of sense.

## History 2

- Ah, as discussed now, we'll leverage annotation identifier on schema union for adt name
- Given our new adt name/member name pathing system i believe we no longer need to have 'path' option in bridge even, simplify by removing it, we can bring it back later
- Regarding our point about '*' concept for selection, the thing is we need it for import and export, because for example in our vite process during dev and also build, we would want to take a catalog and export ALL of it -- oh wait, actually, by default this is the semantic of Targets... it 'discovers' ALL, its just that we don't have a way right now to mix manual selection with user saying "all under this path" etc. etc. -- so i think we're good here for now! it means our polen code would look like, for example: `yield* catalogBridge.export(catalog)`
- regarding incremental hydration, i agree with ... `yield* catalogBridge.hydrate(catalog, 'entries.revisions', { date: '2025-12-14' })` but would add more nuance points here:
  - imagine user does this: `const schema = catalog.entries.find(_ => _.version === '1.2.0')` and then later wants to do this: `yield* catalogBridge.hydrate(schema, 'revisions', { date: '2024-26-12' })` -- how can they achieve that?

  One idea is that bridge, since its stateful, actually at minimum only needs this at runtime:

  ```ts
  // catalog lib code, catalog/catalog.ts
  export const Bridge = Hydra.Bridge.make(CatalogHydratable)
  ```
  ```ts
  // polen app code
  const bridge = Catalog.Bridge.make()
  // ...
  // bridge .data to access the root
  bridge.index // type: Hydra.Bridge.Index<CatalogSchema>  ---- value: {}
  // bridge api side effects
  // 1. -------------
  {
    yield * bridge.peek({ catalog: { versioned: true }})
    bridge.index // value: { ['catalog___versioned']:  ... CatalogVersionedDehydrated ... }
  }
  // 2. -------------
  {
    yield * bridge.view({ catalog: { versioned: true })
    bridge.index // value: { ['catalog___versioned']:  ... CatalogVersionedHydrated ... }
  }
  // 3. -------------
  {
    yield * bridge.peek({ revision: { versioned: { date: '2025-12-14', version: '1.2.0' } } })
    bridge.index // value: { ['revision___versioned___date@2025-12-14___version@1.2.0']:  ... RevisionVersionedDehydrated ... }
  }
  // ...
  // we still have problem of type safety b/c TS does not track sideeffects
  // for this reason we can have methods return data
  // 1. -------------
  {
    const catalog = yield * bridge.peek({ catalog: { versioned: true }})
    //    ^ type: CatalogVersionedDehydrated
  }
  // 2. -------------
  {
    const catalog = yield * bridge.view({ catalog: { versioned: true })
    //    ^ type: CatalogVersionedHydrated
  }
  // 3. -------------
  {
    const revision = yield * bridge.peek({ revision: { versioned: { date: '2025-12-14', version: '1.2.0' } } })
    //    ^ type: RevisionVersionedDehydrated
  }
  ```

## History 1

1.

- if multiple insances of the same adt need to be stored and the user did not specify a name func then the user can expect them to be reading/writing over each other (and maybe we'll see later that this has even implicates for no-ops, e.g. "oh its already written i'll skip my work" or "oh its alrteady an asset i'll read from there instead" etc.) -- IMO right now this is a user issue and i agree its a foot gun but i accept that.
- re Nested relations that's interesting, i had been thinking of them as flat, but, I'm open to learning about tradeoffs here. my thinking behind flat is that it better supports the concept that each record has a single reference that all instances (locations) of it in the data type can hydrate with -- i think this is important and a great feature, you're proposal seems to lend itself toward record duplication. My answer here shows how the above point about name is crucial and is in the user control.

2.

- identity matching is simple record field matching, if all fields match its a match
- DESIGN INSIGHT: regarding 'What if the data has been updated between hydrations?' -- if you mean hasbeen hydrated, there is an implicit rule but i'll make it more clear that dehydrated records must be subset of hydrated, meaning e.g. no custom field mapping, this means that it is always possible to perform a match of deyhdrated record to its hydrated or dehydrated form.
- DESIGN INSIGHT: re 'partial data conflicts' -- not possible because for now once an asset is hydrated it is immutable
- re 'Memory efficiency:' -- that would be specific to apps and in such cases users would make use of selections for this reason -- keep in mind that memory won't grow much from adding reference pointers everywhere either as the graph grows, so if user controls their selections, in absolute terms they're good, even if there's tonnes of relational pointers among the data that is loaded, each relation loaded shared still one reference to that data in memory, e.g. 1000 pointers, not 1000 copies of the data.

3.

- 'Multiple bases:' i think its interesting to use the ADT as part of the PATH instead of the NAME asset, let's explore this briefly to see the tradeoffs but i suspect this is better -- one thing i thought was cute about the ext system is t hat it kind of indicated for free the 'file type' -- but actually if we really want that then it has to go further (for ADT union cases): `<adt_name>.<adt_member_name>.json` -- this might actually be a good idea, but it also raises the problem that at least right now we do `Reivison` in theory for the union level (which again is not an encoded concept in Effet iiuc), and then `Revision<member name>` for the scehmas of members meaning we would right now end up with e.g. `revision.revision-foo.json` when really want want is `revision.foo.revision.json` -- so i think we need to think about this more, but i like the idea of using the ADT name in the path and/or in the extension. Maybe it actually amkes senses to use both becucase they serve differnet purposes: 1) dirs keep sorting organized to within a domain; 2) extensions provide rigor/self-containment/convention about 'for this file, what data type decode must i run' -- the answer becomes automated (but we just have the question of, in memory, literally, what 'lookup' system is there for those schemas e.g. we need something like `lookup(file.name, dataTypesRegistry).decode(file.text)`)
- re 'Environment detection:' -- i think this wouldn be a GREAT default, automatic
- re 'Caching layer:' -- per part of what i said in 4 below, memory is by definitioin our cache so hydrating what's already available in memory becomes a no-op, aka. a kind of cache; we will need a way to 'flush' this for example in vite development if the user changes their polen schema inputs then we have to recompute ALL OF CATALOG (to keep it simple, for now) so in that case the vite dev memory has to be recreated and a signal has to be sent to client dev too for it to 'hey, flush your memory man' -- the thing is actually, in dev, the actual STRUCTURE of the catalog could change, this goes beyond cache invalidation and is probably requiring instead a total ditching of the existing root reference in favour of a newly created one -- in this sense this has nothing to do with cache busting at the level of the data type/hydrator system actually. i think to keep it simple for now we can say that there is no hydrator level cache busting, instead, a vite signal would cause a wholly new hydrator etc. whtaever instance to be created.

4.

- I was hoping to reuse most of our existing 'targets' system (typings, etc.) to not have to do much work to achieve 'Hydration paths'
- hydrating something that is alreday hdrated should be a no-op (of course respecting the given 'selection' given, e.g. maybe there is SOME overlap but one thing selected for isn't hydrated yet for whatever reason, that means the work is mostly a no-op but still does the diff of it)
- Debugging: I heard effect has excellnt transparent tracing support, so that sounds absolutely ideal for this system -- i just hope i don't have to run a docker jagger image locally ... would be cool if we could map the effect tracing to terminal logs... even if that reduces the ideal UI for traces, for basic debugging in low volume data/traffic (e.g. just me developing alone) it should be ok

5.

- re loading boundaries: too complex for now, future features
- re parallel: yes use max parallel!

6.

- for the null state i would like it if we didn't make adding that in the future harder, i also would like to allow it to be a future iteration, i do think its a valuable sensible feature to have so worth being mindful now of it, if there are simple things we can do now to make it easier later that's great

7.

- I don't think we need to track hydration history since the current data in memory serves that purpose, BUT, i do see value in an index structure in memory for o1 lookups of ANY record to make hydration trivial because hydrator wouldn't know "where to look" in the data type for "hey, did i load this record before" -- but a flat global index would solve that by having a predictable structure to look up records by their unique keys, so that would be a good idea to have, i think that could indeed be a stateful part of the hydrator, but i'm open to other ideas like it being another data structure that is passed raather than an internal state -- i would like to do what is simplest for now, WHERE the index llives is probably easy to change later, it sounds to me right now simplest if we have a stateful hydrator but again please lead to me a simpler soltion if you have one.

8.

the other bit about ADT name with effect schema, IIUC you're saying let's solve this with an annotation .e.g Schema.Union(...).annotations({ adt: { name: '...' } }) -- I am ok with that. Some notes though:

- we'll need a new annotation type for that?
- when given, we'll need to assume that members might have the given name in prefix of their own tag and in that case, for asset extensions for example, it should be ELIDED, e.g. 'adt: Foo, member1: FooMember1' would result in 'foo.member1.json' and not 'foo.fooMember1.json' etc. -- i can see this name mapping get a bit tricky so it will be import for our adt concept to be strongly encoded, i am even wondering if we should have a custom schema thing like `Schema.UnionAdt('name', [schema1,schema2,schema3])` that would actually automate some of this like:
  - add the annotation to the union schema
  - validate that each member has adt name as prefix or fail
  - i did consider if we should enforce that members do NOT have adt name as prefix but IIUC we'll be in trouble with other parts of the lib e.g. match where its just based on _tag and so we risk collisions if ADT members are used in a mixed context :/ -- in short, effect lib doesn't give us support for this pattern generally so i'm thinking each adt member still has a standalone aspect to it but that our hydra lib for example is able to special case working with uion adt for things like the aforementioned asset naming/pathing system

### Questions

Architecture Questions

1. Asset Naming & Organization

You mentioned the pattern [<custom>].<adt_name>.json. I have a few questions:

- Collision handling: What happens when multiple instances of the same ADT type need to be stored? For example, if
  we have multiple revisions, how do we differentiate 2025-12-14@1.2.0.revision.json from
  2025-12-14@2.0.0.revision.json? Should the name function be required to produce unique names?
- Nested relations: When we have deeply nested structures (catalog → entries → revisions), should the path reflect
  this hierarchy? For example:
  - Option A: Flat - /revisions/2025-12-14@1.2.0.revision.json
  - Option B: Nested - /catalog/entries/1.2.0/revisions/2025-12-14.revision.json

2. Hydration Semantics

You mentioned that hydrating a record should hydrate all instances of that record in visible data. This raises some
questions:

- Identity matching: How do we determine if two dehydrated records are "the same"? Just by comparing the key fields?
  What if the data has been updated between hydrations?
- Partial data conflicts: If we hydrate an author record in one context, then later hydrate the same author with
  different data (maybe from a different time period), how do we handle conflicts?
- Memory efficiency: With automatic re-hydration of all instances, could we run into memory issues with large
  datasets? Should there be a way to control this behavior?

3. IO Service Design

For the base path configuration:

- Multiple bases: Should we support different base paths for different ADT types? For example, schemas in one
  location, revisions in another?
- Environment detection: Should the IO service automatically detect the environment (browser vs Node.js) and choose
  appropriate defaults, or should this always be explicit?
- Caching layer: Should the IO service include built-in caching, or should that be a separate concern? How would
  cache invalidation work with incremental hydration?

4. Type Safety & Developer Experience

- Hydration paths: For expressions like catalogHydrator.hydrateRevision(...), should we generate type-safe methods
  for each relation, or use a string-based path like hydrate(catalog, 'entries.revisions', key)?
- Error handling: What should happen if we try to hydrate something that's already hydrated? Or if the requested
  data doesn't exist?
- Debugging: How can we make the hydration process observable for debugging? Should there be events or logging?

5. Performance & Scalability

- Lazy loading boundaries: You mentioned we don't need wildcard support yet. But for large catalogs, would it make
  sense to have pagination or chunking at certain boundaries?
- Parallel loading: Should the bridge support loading multiple relations in parallel? For example:
  yield* catalogHydrator.hydrateMany([
  { path: 'entries.revisions', key: date1 },
  { path: 'entries.revisions', key: date2 }
  ])

6. Future Considerations

You mentioned the null → dehydrated state transition. Should we design the current API with this future enhancement
in mind? For example:

- Reserve certain method names or patterns?
- Structure the data format to support this transition?
- Design the hydration algorithm to be extensible?

7. Bridge API Design

Looking at your examples, I see both factory and direct function approaches. What are your thoughts on:

- Stateful vs Stateless: Should the bridge maintain any state (like hydration history), or be purely functional?
- Method chaining: Would you want to support patterns like:
  yield* bridge
  .select('entries')
  .where(e => e.version === '1.0.0')
  .hydrate('revisions')

These questions should help us nail down the exact requirements before moving to implementation. What are your
thoughts on these areas?
