/** Plain-text documents bundled as strings (see `loader` in scripts/build.mjs). */
declare module '*.md' {
  const text: string
  export default text
}
