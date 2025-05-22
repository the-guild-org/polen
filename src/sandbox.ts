import { AppleTouchIcon } from '#lib/apple-touch-icon/index.js'

const paths = [`/apple-touch-icon.png`, `/apple-touch-icon-precomposed.png`]

for (const path of paths) {
  console.log(path, AppleTouchIcon.fileNamePattern.test(path))
}
