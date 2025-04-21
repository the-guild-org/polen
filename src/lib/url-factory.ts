export namespace URLFactory {
  export type URLFactory = (path: string) => URL

  export const create = (baesUrl: URL): URLFactory => {
    return path => {
      return new URL(path, baesUrl)
    }
  }
}
