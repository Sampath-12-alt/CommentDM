export interface InstagramMediaItem {
  id: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  caption?: string
}

export interface InstagramMediaResponse {
  data: InstagramMediaItem[]
}
