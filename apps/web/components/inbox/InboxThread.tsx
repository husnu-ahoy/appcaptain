'use client'

import Image from 'next/image'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowLeft, ArrowUp, Loader2, PanelRightClose, PanelRightOpen } from 'lucide-react'
import type { GuestConversationDTO, GuestMessageDTO } from '@ahoy/shared'
import { fetchConversation, sendConversationMessage } from '@/lib/api'
import { bookingStatus, formatRangeShort } from '@/lib/bookingDisplay'
import HostAvatar from '@/components/listing/HostAvatar'
import type { BoatInfo } from './InboxDetails'

const POLL_MS = 15_000
const MAX_LEN = 2000
const GROUP_GAP_MS = 5 * 60_000

type Item =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'msg'; key: string; m: GuestMessageDTO; first: boolean; last: boolean }

function dayLabel(d: Date): string {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Bugün'
  if (d.toDateString() === yesterday.toDateString()) return 'Dün'
  return d.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(d.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  })
}

const clock = (iso: string) => new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

/** Gün ayraçları ve aynı kişiden art arda gelen mesaj grupları. */
function buildItems(messages: GuestMessageDTO[]): Item[] {
  const items: Item[] = []
  let lastDay = ''
  messages.forEach((m, i) => {
    const at = new Date(m.createdAt)
    const day = at.toDateString()
    if (day !== lastDay) {
      items.push({ kind: 'day', key: `d-${day}`, label: dayLabel(at) })
      lastDay = day
    }
    const prev = messages[i - 1]
    const next = messages[i + 1]
    const joins = (a?: GuestMessageDTO, b?: GuestMessageDTO) =>
      !!a &&
      !!b &&
      a.senderType === b.senderType &&
      new Date(a.createdAt).toDateString() === new Date(b.createdAt).toDateString() &&
      Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < GROUP_GAP_MS
    items.push({ kind: 'msg', key: m.id, m, first: !joins(prev, m), last: !joins(m, next) })
  })
  return items
}

interface Props {
  conversationId: string
  conversation: GuestConversationDTO | null
  boat: BoatInfo | null | undefined
  coverPhoto: string | null
  detailsOpen: boolean
  onToggleDetails: () => void
  onBack: () => void
  /** Mesaj gönderilince listeyi tazele. */
  onActivity: () => void
}

export default function InboxThread({
  conversationId,
  conversation,
  boat,
  coverPhoto,
  detailsOpen,
  onToggleDetails,
  onBack,
  onActivity,
}: Props) {
  const [data, setData] = useState<{ conversation: GuestConversationDTO; messages: GuestMessageDTO[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    try {
      setData(await fetchConversation(conversationId))
      setError(null)
    } catch (e) {
      setError(e instanceof Error && e.message !== 'AUTH' ? e.message : 'Konuşma açılamadı. Sayfayı yenileyip tekrar dene.')
    }
  }, [conversationId])

  useEffect(() => {
    void load()
    const t = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(t)
  }, [load])

  const messages = data?.messages
  const items = useMemo(() => buildItems(messages ?? []), [messages])

  // Yeni mesaj gelince en alta in.
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages?.length])

  const resize = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  const send = async () => {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setSendError(null)
    try {
      const msg = await sendConversationMessage(conversationId, content)
      setText('')
      requestAnimationFrame(resize)
      setData(d => (d ? { ...d, messages: [...d.messages, msg] } : d))
      onActivity()
    } catch (e) {
      setSendError(e instanceof Error && e.message !== 'AUTH' ? e.message : 'Mesaj gönderilemedi. Lütfen tekrar dene.')
    } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Dokunmatik klavyede Enter yeni satırdır; masaüstünde gönderir (Shift+Enter yeni satır).
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    e.preventDefault()
    void send()
  }

  const conv = conversation ?? data?.conversation ?? null
  const ref = conv?.booking ?? null
  const status = ref ? bookingStatus(ref.status) : null
  const owner = boat?.owner ?? null
  const title = conv?.boat?.name ?? boat?.model.title ?? 'Konuşma'
  const subtitle = [
    owner?.name ? `Kaptan: ${owner.name}` : null,
    status && ref ? `${status.label} · ${formatRangeShort(ref.startDate, ref.endDate)}` : 'Rezervasyon öncesi soru',
  ]
    .filter(Boolean)
    .join(' · ')
  const awaitingReply = !!messages && messages.length > 0 && messages.every(m => m.senderType !== 'CAPTAIN')

  return (
    <div className="sh-ibt">
      <header className="sh-ibt-head">
        <button type="button" className="sh-ib-icon sh-ibt-back" onClick={onBack} aria-label="Konuşmalara dön">
          <ArrowLeft size={20} />
        </button>
        <span className="sh-ibt-ava" aria-hidden="true">
          {owner ? (
            <HostAvatar name={owner.name ?? title} src={owner.avatarUrl} size={44} />
          ) : coverPhoto ? (
            <span className="sh-ibt-photo">
              <Image src={coverPhoto} alt="" fill sizes="44px" />
            </span>
          ) : (
            <HostAvatar name={title} src={null} size={44} />
          )}
        </span>
        <span className="sh-ibt-title">
          <b>{title}</b>
          <small>{subtitle}</small>
        </span>
        <button
          type="button"
          className={`sh-ibt-details${detailsOpen ? ' is-on' : ''}`}
          onClick={onToggleDetails}
          aria-pressed={detailsOpen}
          aria-label={detailsOpen ? 'Detayları gizle' : 'Detayları göster'}
        >
          {detailsOpen ? <PanelRightClose size={18} strokeWidth={1.8} aria-hidden="true" /> : <PanelRightOpen size={18} strokeWidth={1.8} aria-hidden="true" />}
          <span>Detaylar</span>
        </button>
      </header>

      <div className="sh-ibt-scroll" ref={scrollRef}>
        <div className="sh-ibt-msgs" aria-live="polite">
          {error && !data && <p className="sh-ib-alert">{error}</p>}
          {!data && !error && (
            <p className="sh-ibt-loading">
              <Loader2 size={18} className="sh-auth-spin" aria-hidden="true" /> Yükleniyor…
            </p>
          )}
          {data && data.messages.length === 0 && (
            <p className="sh-ibt-sys">Henüz mesaj yok. Kaptana sorunu yazarak konuşmayı başlatabilirsin.</p>
          )}
          {items.map(it => {
            if (it.kind === 'day') {
              return (
                <div key={it.key} className="sh-ibt-day">
                  <span>{it.label}</span>
                </div>
              )
            }
            const { m } = it
            if (m.senderType === 'SYSTEM') {
              return (
                <p key={it.key} className="sh-ibt-sys">
                  {m.content}
                </p>
              )
            }
            const mine = m.senderType === 'GUEST'
            return (
              <div key={it.key} className={`sh-ibt-msg ${mine ? 'is-me' : 'is-them'}${it.first ? ' is-first' : ''}${it.last ? ' is-last' : ''}`}>
                {!mine && <span className="sh-ibt-msg-ava">{it.first && <HostAvatar name={m.senderName} src={owner?.avatarUrl ?? null} size={32} />}</span>}
                <div className="sh-ibt-msg-body">
                  {!mine && it.first && <span className="sh-ibt-msg-name">{m.senderName}</span>}
                  <p className="sh-ibt-bubble">{m.content}</p>
                  {it.last && <time dateTime={m.createdAt}>{clock(m.createdAt)}</time>}
                </div>
              </div>
            )
          })}
          {awaitingReply && <p className="sh-ibt-sys">Mesajın kaptana iletildi. Yanıt geldiğinde burada görünecek.</p>}
        </div>
      </div>

      <form
        className="sh-ibt-compose"
        onSubmit={e => {
          e.preventDefault()
          void send()
        }}
      >
        {sendError && (
          <p className="sh-ib-alert" role="alert">
            {sendError}
          </p>
        )}
        <div className="sh-ibt-box">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => {
              setText(e.target.value.slice(0, MAX_LEN))
              resize()
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Mesaj yaz"
            aria-label="Mesaj yaz"
          />
          <button type="submit" className="sh-ibt-send" disabled={!text.trim() || sending} aria-label="Gönder">
            {sending ? <Loader2 size={18} className="sh-auth-spin" /> : <ArrowUp size={19} strokeWidth={2.4} />}
          </button>
        </div>
        {text.length > MAX_LEN - 200 && <small className="sh-ibt-count">{MAX_LEN - text.length} karakter kaldı</small>}
      </form>
    </div>
  )
}
