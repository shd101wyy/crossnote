

interface CodeChunkData {
  /**
   * id of the code chunk
   */
  id: string,
  /**
   * code content of the code chunk
   */
  code: string,
  /**
   * code chunk options
   */
  options: object,
  /**
   * result after running code chunk
   */
  plainResult: string,

  /**
   * result after formatting according to options['output'] format
   */
  result: string,
  /**
   * whether is running the code chunk or not
   */
  running: boolean,
  /**
   * previous code chunk
   */
  prev: string,
  /**
   * next code chunk
   */
  next: string,
}

interface Heading {
  content:string,
  level:number,
  id:string
}