// Smart chunking that considers route complexity
export function chunkByWeight<T>(
  items: T[],
  targetChunks: number,
  getWeight: (item: T) => number = () => 1,
): T[][] {
  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0)
  const targetWeight = totalWeight / targetChunks

  const chunks: T[][] = []
  let currentChunk: T[] = []
  let currentWeight = 0

  for (const item of items) {
    const weight = getWeight(item)
    if (currentWeight + weight > targetWeight && currentChunk.length > 0) {
      chunks.push(currentChunk)
      currentChunk = []
      currentWeight = 0
    }
    currentChunk.push(item)
    currentWeight += weight
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk)
  }

  return chunks
}
