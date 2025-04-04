export const create = () => {
  const state: { lines: string[] } = {
    lines: [],
  }
  const builder = (line: string) => {
    state.lines.push(line)
  }
  builder.state = state
  builder.render = () => state.lines.join(`\n`)
  return builder
}
