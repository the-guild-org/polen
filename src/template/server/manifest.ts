import { assetUrl } from '#api/utils/asset-url/index'
import type { Vite } from '#dep/vite/index'
import { Group, Str } from '@wollybeard/kit'

export const injectManifestIntoHtml = (
  html: string,
  manifest: Vite.Manifest,
  basePath: string,
): string => {
  const assets = getRelevantAsssetsFromManifest(manifest, basePath)
  return injectAssetsIntoHtml(html, assets)
}

const getRelevantAsssetsFromManifest = (
  manifest: Vite.Manifest,
  basePath: string,
): HttpAssetGroupSet => {
  const htmlAssets: HttpAsset[] = []

  for (const manifestChunk of Object.values(manifest)) {
    if (manifestChunk.isEntry) {
      htmlAssets.push({ type: `js`, path: assetUrl(manifestChunk.file, basePath) })
    }
    for (const cssItem of manifestChunk.css ?? []) {
      htmlAssets.push({ type: `css`, path: assetUrl(cssItem, basePath) })
    }
  }

  return Group.by(htmlAssets, `type`)
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

  return html
    .replace(`</head>`, `${htmlAssets.css ?? ``}</head>`)
    .replace(`</body>`, `${htmlAssets.js ?? ``}</body>`)
}
