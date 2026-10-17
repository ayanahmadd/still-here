import { COMFORT, isStopSignal, validConversation } from '../../../lib/garden';
import { gardenResponseFormat, gardenSystemPrompt } from '../../../lib/garden-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  return Response.json({ available: Boolean(process.env.OPENAI_API_KEY?.trim()) }, { headers });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || (request.headers.get('origin') && request.headers.get('origin') !== url.origin)) {
    return Response.json({ error: '此原型的云端对话仅支持本机访问。' }, { status: 403, headers });
  }
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ error: '请发送文字内容。' }, { status: 415, headers });
  let body;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error('Missing body');
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 80000) { await reader.cancel(); return Response.json({ error: '这段内容有些长，请分开讲。' }, { status: 413, headers }); }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return Response.json({ error: '刚才的内容没有读取成功。' }, { status: 400, headers }); }
  if (!validConversation(body) || (body as { cloudConsent?: boolean }).cloudConsent !== true) {
    return Response.json({ error: '请先同意云端处理，并确认本次讲述。' }, { status: 400, headers });
  }
  const last = body.entries[body.entries.length - 1];
  if (last.speaker === 'patient' && isStopSignal(last.text)) return Response.json({ message: COMFORT, action: 'pause' }, { headers });
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return Response.json({ error: '云端 AI 尚未连接。可以继续使用本地规则演示。', code: 'not_configured' }, { status: 503, headers });

  const controller = new AbortController();
  const abort = () => controller.abort();
  request.signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 30000);
  try {
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-terra';
    const result = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model, store: false, max_output_tokens: 1600,
        ...(model === 'gpt-5.6-terra' ? { reasoning: { effort: 'none' } } : {}),
        instructions: gardenSystemPrompt, text: { format: gardenResponseFormat },
        input: [{ role: 'user', content: JSON.stringify({ entries: body.entries.map(({ id, speaker, text, name, consent }) => ({ id, speaker, text, name, consent })) }) }],
      }),
    });
    if (!result.ok) throw new Error('Provider unavailable');
    const data = await result.json();
    const raw = (data.output || []).filter((item: { type: string }) => item.type === 'message')
      .flatMap((item: { content: { type: string; text?: string }[] }) => item.content || [])
      .filter((part: { type: string }) => part.type === 'output_text').map((part: { text: string }) => part.text).join('');
    const reply = JSON.parse(raw);
    if (data.status === 'incomplete' || typeof reply.message !== 'string' || !reply.message.trim()
      || reply.message.length > 180 || !['continue', 'pause'].includes(reply.action)
      || (reply.message.match(/[?？]/g) || []).length > 1
      || /你还记得吗|你记错|考考你|答对了|改善记忆|治疗/.test(reply.message)) throw new Error('Invalid reply');
    // Never allow a model-requested pause to contain another question.
    if (reply.action === 'pause') return Response.json({ message: COMFORT, action: 'pause' }, { headers });
    return Response.json({ message: reply.message.trim(), action: 'continue' }, { headers });
  } catch {
    return Response.json({ error: '暂时没有连上。刚才的话还在，我们可以稍后再试。' }, { status: 502, headers });
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}
