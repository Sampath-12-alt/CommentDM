export interface ReelConfig {
  trigger_keyword: string
  dm_message: string
  comment_reply: string
  active: boolean
}

export interface ReelConfigStore {
  reels: Record<string, ReelConfig>
  default: ReelConfig
}
