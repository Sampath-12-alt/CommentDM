export interface ReelConfigUpdate {
  trigger_keyword: string
  dm_message: string
  comment_reply: string
  active: boolean
}

export interface TestMessageRequest {
  comment_id: string
  message: string
}

export interface ReelItem {
  id: string
  thumbnail_url?: string
  permalink?: string
  caption?: string
  config: ReelConfigUpdate
}
