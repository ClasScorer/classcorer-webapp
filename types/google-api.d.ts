declare global {
  interface Window {
    gapi: {
      load: (api: string, callback: () => void) => void
      client: {
        init: (config: {
          apiKey: string
          clientId: string
          discoveryDocs: string[]
          scope: string
        }) => Promise<void>
        slides: {
          presentations: {
            get: (params: { presentationId: string }) => Promise<{
              result: {
                slides: Array<{
                  objectId: string
                  [key: string]: any
                }>
              }
            }>
          }
        }
      }
    }
  }
} 