/// <reference types="vite/client" />

declare module '*.graphql?raw' {
  const content: string
  export default content
}
