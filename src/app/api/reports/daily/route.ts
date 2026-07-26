import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const CHECKLIST_ITEMS = [
  'Trello güncellendi',
  'Bekleyen revizyonlar ilgili kişiye iletildi',
  'Müşteriye gönderilecek dosyalar hazır',
  'Yarınki çekim/teslim kontrol edildi',
  'Caner ile fatura/tahsilat senkron yapıldı',
  'Emir\'e günlük özet iletildi',
]

const STATUS_LABEL: Record<string, string> = {
  todo: 'Yapılacak', in_progress: 'Devam Ediyor', review: 'İncelemede', done: 'Tamamlandı',
}

export async function GET(req: NextRequest) {
  try {
    // Yetki: sadece admin
    const sessionClient = await createClient()
    const { data: { user } } = await sessionClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await sessionClient.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const dateParam = req.nextUrl.searchParams.get('date')
    const date = dateParam || new Date().toISOString().slice(0, 10)
    const dayStart = `${date}T00:00:00.000Z`
    const dayEnd = `${date}T23:59:59.999Z`

    const sb = createServiceRoleClient()

    const [
      profilesRes, tasksCreatedRes, tasksCompletedRes, activitiesRes,
      contentsRes, approvalsRes, timeLogsRes, loginsRes, checklistRes,
      templatesRes, smsRes, sharesRes, clientsRes,
    ] = await Promise.all([
      sb.from('profiles').select('id, full_name, role').order('full_name'),
      sb.from('tasks').select('id, title, created_by, client_id, template_id, created_at').gte('created_at', dayStart).lte('created_at', dayEnd),
      sb.from('tasks').select('id, title, assigned_to, client_id, completed_at').gte('completed_at', dayStart).lte('completed_at', dayEnd),
      sb.from('activities').select('user_id, action, entity_type, entity_title, created_at').gte('created_at', dayStart).lte('created_at', dayEnd).order('created_at'),
      sb.from('contents').select('id, title, status, assigned_to, created_at').gte('created_at', dayStart).lte('created_at', dayEnd),
      sb.from('approvals').select('id, title, status, requested_by, created_at').gte('created_at', dayStart).lte('created_at', dayEnd),
      sb.from('time_logs').select('user_id, task_id, started_at, ended_at, duration_min').gte('started_at', dayStart).lte('started_at', dayEnd),
      sb.from('user_login_logs').select('user_id, email, action, created_at').gte('created_at', dayStart).lte('created_at', dayEnd).order('created_at'),
      sb.from('daily_checklist').select('user_id, items, updated_at').eq('date', date),
      sb.from('task_templates').select('id, title, assigned_to').eq('is_active', true),
      sb.from('automation_logs').select('id, status, created_at').gte('created_at', dayStart).lte('created_at', dayEnd),
      sb.from('shares').select('id, title, created_at').gte('created_at', dayStart).lte('created_at', dayEnd),
      sb.from('clients').select('id, name'),
    ])

    const profiles = profilesRes.data || []
    const profileMap: Record<string, any> = {}
    profiles.forEach(p => { profileMap[p.id] = p })

    const clientMap: Record<string, string> = {}
    ;(clientsRes.data || []).forEach((c: any) => { clientMap[c.id] = c.name })

    const tasksCreated = tasksCreatedRes.data || []
    const tasksCompleted = tasksCompletedRes.data || []
    const activities = activitiesRes.data || []
    const contents = contentsRes.data || []
    const approvals = approvalsRes.data || []
    const timeLogs = timeLogsRes.data || []
    const logins = loginsRes.data || []
    const checklists = checklistRes.data || []
    const templates = templatesRes.data || []
    const templateIds = new Set(templates.map((t: any) => t.id))

    // Kullanıcı bazlı rapor
    const users = profiles.map((p: any) => {
      const myTasksCreated = tasksCreated.filter((t: any) => t.created_by === p.id)
        .map((t: any) => ({ title: t.title, client: t.client_id ? clientMap[t.client_id] : null, from_template: !!t.template_id }))

      const myTasksCompleted = tasksCompleted.filter((t: any) => t.assigned_to === p.id)
        .map((t: any) => ({ title: t.title, client: t.client_id ? clientMap[t.client_id] : null, at: t.completed_at }))

      const myTransitions = activities.filter((a: any) =>
        a.user_id === p.id && a.entity_type === 'tasks' && typeof a.action === 'string' && a.action.startsWith('status_changed:')
      ).map((a: any) => {
        const [, transition] = a.action.split(':')
        const [from, to] = (transition || '').split('->')
        return { title: a.entity_title, from: STATUS_LABEL[from] || from, to: STATUS_LABEL[to] || to, at: a.created_at }
      })

      const myOtherActivities = activities.filter((a: any) =>
        a.user_id === p.id && !(a.entity_type === 'tasks' && typeof a.action === 'string' && a.action.startsWith('status_changed:'))
      ).map((a: any) => ({ action: a.action, entity_type: a.entity_type, title: a.entity_title, at: a.created_at }))

      const myMinutes = timeLogs.filter((l: any) => l.user_id === p.id)
        .reduce((sum: number, l: any) => sum + (l.duration_min || 0), 0)

      const myLogins = logins.filter((l: any) => l.user_id === p.id && l.action === 'login')
        .map((l: any) => l.created_at)

      const myApprovalsRequested = approvals.filter((a: any) => a.requested_by === p.id)
        .map((a: any) => ({ title: a.title, status: a.status }))

      const myChecklist = checklists.find((c: any) => c.user_id === p.id)

      const hasActivity = myTasksCreated.length || myTasksCompleted.length || myTransitions.length ||
        myOtherActivities.length || myMinutes > 0 || myLogins.length || myApprovalsRequested.length || myChecklist

      return {
        id: p.id, full_name: p.full_name, role: p.role,
        active_today: !!hasActivity,
        logins: myLogins,
        tasks_created: myTasksCreated,
        tasks_completed: myTasksCompleted,
        stage_transitions: myTransitions,
        other_activities: myOtherActivities,
        time_spent_minutes: myMinutes,
        approvals_requested: myApprovalsRequested,
        checklist: myChecklist ? {
          done: Object.values(myChecklist.items || {}).filter(Boolean).length,
          total: CHECKLIST_ITEMS.length,
          items: myChecklist.items,
        } : null,
      }
    })

    // Bugün uygulanan haftalık şablonlar
    const templatesApplied = templates
      .map((t: any) => {
        const count = tasksCreated.filter((tk: any) => tk.template_id === t.id).length
        return { title: t.title, assigned_to: profileMap[t.assigned_to]?.full_name || null, applied: count > 0, count }
      })
      .filter((t: any) => t.applied)

    const templatesNotApplied = templates
      .filter((t: any) => !tasksCreated.some((tk: any) => tk.template_id === t.id))
      .map((t: any) => ({ title: t.title, assigned_to: profileMap[t.assigned_to]?.full_name || null }))

    const summary = {
      date,
      active_users: users.filter(u => u.active_today).length,
      total_users: profiles.length,
      logins_count: logins.filter((l: any) => l.action === 'login').length,
      tasks_created: tasksCreated.length,
      tasks_completed: tasksCompleted.length,
      contents_created: contents.length,
      approvals_opened: approvals.length,
      approvals_decided: approvals.filter((a: any) => a.status !== 'pending').length,
      sms_sent: (smsRes.data || []).filter((s: any) => s.status === 'success').length,
      sms_failed: (smsRes.data || []).filter((s: any) => s.status === 'failed').length,
      shares_added: (sharesRes.data || []).length,
      checklist_completed_by: checklists.filter((c: any) =>
        Object.values(c.items || {}).filter(Boolean).length === CHECKLIST_ITEMS.length
      ).length,
    }

    return NextResponse.json({
      date,
      generated_at: new Date().toISOString(),
      summary,
      users: users.filter(u => u.active_today || u.role === 'admin' || u.role === 'manager'),
      templates_applied: templatesApplied,
      templates_not_applied: templatesNotApplied,
      checklist_items: CHECKLIST_ITEMS,
    })
  } catch (e: any) {
    console.error('Daily report error:', e?.message)
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
