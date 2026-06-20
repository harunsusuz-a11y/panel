import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sb = await createClient()
    const { data: settings } = await sb.from('system_settings').select('key,value').in('key',['netgsm_username','netgsm_password','netgsm_header'])
    const cfg: Record<string,string> = {}
    settings?.forEach((s: any) => { cfg[s.key] = s.value })
    if (!cfg.netgsm_username) return NextResponse.json({ skipped: true })
    const { data: logs } = await sb.from('automation_logs').select('*').eq('status','queued').limit(10)
    if (!logs?.length) return NextResponse.json({ processed: 0 })
    let sent = 0
    for (const log of logs) {
      const payload = log.payload as any
      const phone = payload?.phone; const message = payload?.message
      if (!phone || !message) { await sb.from('automation_logs').update({status:'failed',response:'No phone/message'}).eq('id',log.id); continue }
      const cleanPhone = phone.replace(/\s/g,'').replace(/^\+90/,'').replace(/^0/,'')
      const url = `https://api.netgsm.com.tr/sms/send/get/?usercode=${cfg.netgsm_username}&password=${cfg.netgsm_password}&gsmno=${cleanPhone}&message=${encodeURIComponent(message)}&msgheader=${cfg.netgsm_header||'DAYDREAM'}&dil=TR`
      try {
        const res = await fetch(url); const text = await res.text()
        await sb.from('automation_logs').update({status:text.startsWith('00')||text.startsWith('01')?'success':'failed',response:text}).eq('id',log.id)
        if (text.startsWith('00')||text.startsWith('01')) sent++
      } catch(e:any) { await sb.from('automation_logs').update({status:'failed',response:e.message}).eq('id',log.id) }
    }
    return NextResponse.json({ processed: logs.length, sent })
  } catch(err:any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
