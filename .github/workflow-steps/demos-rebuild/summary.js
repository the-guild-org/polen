// @ts-check

/**
 * Generate rebuild summary
 *
 * @param {import('../async-function').AsyncFunctionArguments} args
 * @param {{
 *   versionsToBuild: string,
 *   distTags: string,
 *   dryRun?: string
 * }} inputs
 */
export default async ({ core }, inputs) => {
  const versions = JSON.parse(inputs.versionsToBuild);
  const distTags = JSON.parse(inputs.distTags);
  const dryRun = inputs.dryRun === "true";

  let summary = "# Demos Rebuild Summary\n\n";

  if (dryRun) {
    summary += "**🔍 DRY RUN MODE**\n\n";
  }

  summary += "## Versions\n";
  if (versions.length > 0) {
    summary += versions.map((v) => `- ${v}`).join("\n");
  } else {
    summary += "No versions to rebuild\n";
  }

  summary += "\n\n## Dist Tags\n";
  if (Object.keys(distTags).length > 0) {
    for (const [tag, version] of Object.entries(distTags)) {
      summary += `- ${tag} → ${version}\n`;
    }
  } else {
    summary += "No dist-tags to rebuild\n";
  }

  await core.summary.addRaw(summary).write();
};
