/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'dcmjs' {
  export namespace data {
    export class DicomMessage {
      static readFile(buffer: Uint8Array): { dict: any }
    }

    export class DicomMetaDictionary {
      static naturalizeDataset(dataset: any): any
    }
  }

  const dcmjs: {
    data: typeof data
  }

  export default dcmjs
}
