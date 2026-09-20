// The logo ships as a data URL through esbuild's `.svg` loader.
declare module '*.svg' {
  const url: string;
  export default url;
}
