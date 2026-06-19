export type Role = 'admin' | 'manager' | 'member'

export type UserProfile = {
  id: string
  email: string
  full_name: string
  role: Role
  avatar_url?: string
  created_at: string
}

export type Client = {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: 'active' | 'passive'
  created_at: string
}

export type Project = {
  id: string
  name: string
  client_id: string
  client?: Client
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress: number
  deadline?: string
  created_at: string
}

export type Task = {
  id: string
  title: string
  project_id: string
  project?: Project
  assigned_to?: string
  assignee?: UserProfile
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'normal' | 'high' | 'critical'
  due_date?: string
  completed_at?: string
  created_at: string
}

export type Content = {
  id: string
  title: string
  client_id: string
  client?: Client
  type: 'post' | 'story' | 'blog' | 'ad' | 'other'
  status: 'draft' | 'pending' | 'approved' | 'revision' | 'published'
  assigned_to?: string
  assignee?: UserProfile
  publish_date?: string
  created_at: string
}

export type Activity = {
  id: string
  user_id: string
  user?: UserProfile
  action: string
  entity_type: string
  entity_id: string
  created_at: string
}
