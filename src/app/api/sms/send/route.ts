import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { phone, message, logId } = await req.json()
    const sb = await createClient()
    const { data: settings } = await sb.from('system_settings').select('key,value').in('key', ['netgsm_username','netgsm_password','netgsm_header'])
    const cfg: Record<string,string> = {}
    settings?.forEach((s: any) => { cfg[s.key] = s.value })
    if (!cfg.netgsm_username || !cfg.netgsm_password) return NextResponse.json({ error: 'Netgsm ayarları eksik' }, { status: 400 })
    const cleanPhone = (phone||'').replace(/\s/g,'').replace(/^\+90/,'').replace(/^0/,'')
    if (!cleanPhone) return NextResponse.json({ error: 'Telefon numarası eksik' }, { status: 400 })
    const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${cfg.netgsm_username}&password=${cfg.netgsm_password}&gsmno=${cleanPhone}&message=${encodeURIComponent(message)}&msgheader=${cfg.netgsm_header||'DAYDREAM'}&dil=TR`
    const res = await fetch(url)
    const text = await res.text()
    const success = text.startsWith('00') || text.startsWith('01')
    if (logId) await sb.from('automation_logs').update({ status: success ? 'success' : 'failed', response: text }).eq('id', logId)
    return NextResponse.json({ success, response: text })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
