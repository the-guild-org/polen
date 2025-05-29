import type { PageBranchContent, PageBranchSegment, PageTree } from './page.js'

export interface LintResult {
  warnings: Warning[]
  fixed: PageTree
}

type Warning = WarningOfConflictingIndexAndExact

export const lint = (tree: PageTree): LintResult => {
  const warnings: Warning[] = []
  let fixed = tree

  for (const linter of linters) {
    const result = linter(tree)
    fixed = result.fixed
    warnings.push(...result.warnings)
  }

  return {
    warnings,
    fixed,
  }
}

const removeConflictsBetweenIndexAndExact = (branches: PageTree): LintResult => {
  const warnings: Warning[] = []

  const fixed = branches.map(branch => {
    const conflictingBranch = branch.type === `PageBranchContent`
      && branch.branches.find(subBranch =>
        subBranch !== branch
        && subBranch.type === `PageBranchContent`
        && subBranch.route.path === branch.route.path
      ) as PageBranchContent | undefined

    // if (!conflictingBranch) {
    //   return removeConflictsBetweenIndexAndExact(branch.branches)
    // }

    if (conflictingBranch) {
      if (!conflictingBranch.route.isIndex) {
        throw new Error(
          `Internal error: conflicting sub branch and is not an index. Unexpected case.`,
        )
      }

      warnings.push({
        type: `WarningOfConflictingIndexAndExact`,
        index: conflictingBranch,
        exact: branch as PageBranchContent,
      })
      /**
       * Fix by converting page branch content into a page branch segment.
       * The content will come from the index file.
       */
      branch = {
        type: `PageBranchSegment`,
        route: {
          type: `PageSegmentRoute`,
          path: branch.route.path, // Public path of the segment
          pathExplicit: branch.route.path, // Explicit path of the segment is its public path
          segments: branch.route.segments, // Segments of the public path
        },
        branches: branch.branches,
      } satisfies PageBranchSegment
    }

    const branchesResult = removeConflictsBetweenIndexAndExact(branch.branches)

    warnings.push(...branchesResult.warnings)

    return {
      ...branch,
      branches: branchesResult.fixed,
    }
  })

  return {
    warnings,
    fixed,
  }
}

const linters = [
  removeConflictsBetweenIndexAndExact,
]

interface WarningOfConflictingIndexAndExact {
  type: `WarningOfConflictingIndexAndExact`
  index: PageBranchContent
  exact: PageBranchContent
}
