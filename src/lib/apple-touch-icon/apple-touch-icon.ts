export const fileNames = [
  `apple-touch-icon.png`,
  `apple-touch-icon-precomposed.png`,
]

/**
 * @see https://mathiasbynens.be/notes/touch-icons
 * @see https://stackoverflow.com/questions/12480497/why-am-i-getting-error-for-apple-touch-icon-precomposed-png
 */
export const fileNamePattern = /apple-touch-icon(?<size>-\d+x\d+)?(?<precomposed>-precomposed)?\.png/
