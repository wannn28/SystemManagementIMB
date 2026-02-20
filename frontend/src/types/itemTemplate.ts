export interface ItemTemplate {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateItemTemplateRequest {
  name: string;
}
