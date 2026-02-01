/* eslint-disable @typescript-eslint/no-explicit-any */

declare module 'cornerstone-wado-image-loader' {
  export const external: {
    cornerstone: any
    dicomParser: any
  }

  export const webWorkerManager: {
    initialize: (config: any) => void
  }

  export const wadouri: {
    fileManager: {
      add: (file: File) => string
      remove: (imageId: string) => void
      get: (imageId: string) => File | undefined
    }
  }

  const cornerstoneWADOImageLoader: {
    external: typeof external
    webWorkerManager: typeof webWorkerManager
    wadouri: typeof wadouri
  }

  export default cornerstoneWADOImageLoader
}
