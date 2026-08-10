interface ScreenshotAPIOptions {
  url: string
  width?: number
  height?: number
  full_page?: boolean
  wait_for?: number
}

interface ScreenshotAPIResponse {
  screenshot: string
  success: boolean
  error?: string
}

export class ScreenshotAPIClient {
  private apiKey: string
  private apiUrl: string

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || process.env.SCREENSHOTAPI_KEY || ''
    this.apiUrl = apiUrl || process.env.SCREENSHOTAPI_URL || 'https://screenshotapi.com/api/v1/screenshot'

    if (!this.apiKey) {
      throw new Error('SCREENSHOTAPI_KEY is not set')
    }
  }

  async generateScreenshot(
    url: string,
    options: Partial<ScreenshotAPIOptions> = {}
  ): Promise<string> {
    const params = new URLSearchParams({
      token: this.apiKey,
      url,
      width: String(options.width || 1920),
      height: String(options.height || 1080),
      full_page: String(options.full_page || true),
      wait_for: String(options.wait_for || 2000),
    })

    try {
      const response = await fetch(`${this.apiUrl}?${params.toString()}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ScreenshotAPI error: ${response.status} - ${errorText}`)
      }

      const data: ScreenshotAPIResponse = await response.json()

      if (!data.success || !data.screenshot) {
        throw new Error(data.error || 'Failed to generate screenshot')
      }

      return data.screenshot
    } catch (error) {
      console.error('Error generating screenshot:', error)
      throw error
    }
  }

  async downloadAndStoreScreenshot(
    screenshotUrl: string,
    supabaseClient: any,
    bucketName: string = 'screenshots',
    fileName?: string
  ): Promise<string> {
    // Download the screenshot
    const imageResponse = await fetch(screenshotUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download screenshot')
    }

    const imageBlob = await imageResponse.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate filename if not provided
    const finalFileName = fileName || `screenshot-${Date.now()}.png`

    // Upload to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(bucketName)
      .upload(finalFileName, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (error) {
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`)
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseClient.storage.from(bucketName).getPublicUrl(finalFileName)

    return publicUrl
  }
}

export function createScreenshotAPIClient(apiKey?: string, apiUrl?: string) {
  return new ScreenshotAPIClient(apiKey, apiUrl)
}

