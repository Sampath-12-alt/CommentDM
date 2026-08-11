export interface WebhookPayload {
  object?: string
  entry?: WebhookEntry[]
}

export interface WebhookEntry {
  id?: string
  changes?: WebhookChange[]
}

export interface WebhookChange {
  field?: string
  value?: CommentChangeValue
}

export interface CommentChangeValue {
  id?: string
  text?: string
  media?: { id?: string }
  from?: { id?: string }
}
