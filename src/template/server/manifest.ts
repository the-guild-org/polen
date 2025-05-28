import type { Vite } from '#dep/vite/index.js'
import { Group, Str } from '@wollybeard/kit'

const getRelevantAsssetsFromManifest = (
  manifest: Vite.Manifest,
): HttpAssetGroupSet => {
  const htmlAssets: HttpAsset[] = []

  for (const manifestChunk of Object.values(manifest)) {
    if (manifestChunk.isEntry) {
      htmlAssets.push({ type: `js`, path: `/${manifestChunk.file}` })
    }
    for (const cssItem of manifestChunk.css ?? []) {
      htmlAssets.push({ type: `css`, path: `/${cssItem}` })
    }
  }

  return Group.by(htmlAssets, `type`)
}

export const injectManifestIntoHtml = (
  html: string,
  manifest: Vite.Manifest,
): string => {
  const assets = getRelevantAsssetsFromManifest(manifest)
  return injectAssetsIntoHtml(html, assets)
}

type HttpAssetGroupSet = Group.by<HttpAsset, `type`>

type HttpAsset =
  | {
    type: `css`
    path: string
  }
  | {
    type: `js`
    path: string
  }

const injectAssetsIntoHtml = (
  html: string,
  assets: HttpAssetGroupSet,
): string => {
  const htmlAssets = Group.map(assets, {
    css: (assets) =>
      assets
        .map((asset) => `<link rel="stylesheet" href="${asset.path}" />`)
        .join(Str.Char.newline),
    js: (assets) =>
      assets
        .map((asset) => `<script type="module" src="${asset.path}"></script>`)
        .join(Str.Char.newline),
  })

  html
    .replace(`</head>`, `${htmlAssets.css}</head>`)
    .replace(`</body>`, `${htmlAssets.js}</body>`)

  return html
}
