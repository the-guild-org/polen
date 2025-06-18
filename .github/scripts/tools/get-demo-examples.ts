#!/usr/bin/env node
// CLI wrapper for getDemoExamples

import { getDemoExamples } from '../../lib/demos/utils/get-demo-examples.ts'

// If run directly as CLI, output space-separated list
if (import.meta.url === `file://${process.argv[1]}`) {
  const examples = await getDemoExamples()
  console.log(examples.join(' '))
}
