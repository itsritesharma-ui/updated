import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './ContactPage.module.css'

const CATEGORIES = [['payment', 'Payment'], ['book_access', 'Book access'], ['technical', 'Technical issue'], ['account', 'Account'], ['refund', 'Refund'], ['other', 'Other']]
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', waiting_customer: 'Waiting for Customer', resolved: 'Resolved', closed: 'Closed' }

export default function ContactPage({ user, onAuthOpen }) {
  const profileName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
  const [name, setName] = useState(profileName)
  const [email, setEmail] = useState(user?.email || '')
  const [category, setCategory] = useState('technical')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [relatedOrder, setRelatedOrder] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [tickets, setTickets] = useState([])
  const [replyText, setReplyText] = useState({})
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const fileInputRef = useRef(null)
  const openTickets = useMemo(() => tickets.filter(ticket => !['resolved', 'closed'].includes(ticket.status)).length, [tickets])

  const fetchTickets = async () => {
    if (!user) return setTickets([])
    const { data, error } = await supabase.from('support_tickets').select('*,support_messages(*)').eq('user_id', user.id).order('updated_at', { ascending: false })
    if (!error) setTickets((data || []).map(ticket => ({ ...ticket, support_messages: [...(ticket.support_messages || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) })))
    else setNotice(error.message || 'Could not load your support tickets.')
  }

  useEffect(() => {
    setEmail(user?.email || '')
    if (profileName) setName(profileName)
    fetchTickets()
  }, [user?.id, user?.email])

  const notify = async (event, ticketId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      await fetch('/api/support-notify', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ event, ticketId }) })
    } catch { /* Ticket saving does not depend on optional email delivery. */ }
  }

  const uploadAttachment = async (ticketId, file) => {
    if (!file) return []
    if (file.size > 5 * 1024 * 1024) throw new Error('Attachment must be 5 MB or smaller.')
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const path = `${user.id}/${ticketId}/${Date.now()}-${safeName}`
    const { error } = await supabase.storage.from('support-attachments').upload(path, file, { upsert: false })
    if (error) throw error
    return [{ path, name: file.name, type: file.type, size: file.size }]
  }

  const openAttachment = async file => {
    const { data, error } = await supabase.storage.from('support-attachments').createSignedUrl(file.path, 120)
    if (error || !data?.signedUrl) return setNotice(error?.message || 'Could not open this attachment.')
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const markTicketRead = async ticket => {
    if (!ticket.customer_unread_count) return
    const { error } = await supabase.rpc('customer_mark_support_tickets_read', { target_ticket: ticket.id })
    if (!error) setTickets(current => current.map(item => item.id === ticket.id ? { ...item, customer_unread_count: 0 } : item))
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!user) return onAuthOpen?.()
    setBusy(true); setNotice('')
    try {
      const { data: ticket, error } = await supabase.rpc('create_support_ticket', {
        ticket_customer_name: name.trim(),
        ticket_customer_email: email.trim(),
        ticket_category: category,
        ticket_subject: subject.trim(),
        ticket_related_order: relatedOrder.trim() || null,
        initial_body: message.trim(),
      })
      if (error) throw error
      let attachmentWarning = ''
      if (attachment) {
        try {
          const attachments = await uploadAttachment(ticket.id, attachment)
          const { error: attachmentError } = await supabase.rpc('customer_reply_to_support_ticket', {
            target_ticket: ticket.id,
            reply_body: `Attachment added: ${attachment.name}`,
            reply_attachments: attachments,
          })
          if (attachmentError) throw attachmentError
        } catch (uploadError) {
          attachmentWarning = ` The ticket was saved, but the attachment failed: ${uploadError.message}`
        }
      }
      await notify('ticket_created', ticket.id)
      setSubject(''); setMessage(''); setRelatedOrder(''); setAttachment(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setNotice(`Ticket #${ticket.ticket_number} created successfully.${attachmentWarning}`)
      await fetchTickets()
    } catch (error) { setNotice(error.message || 'Could not create the ticket.') }
    finally { setBusy(false) }
  }

  const sendReply = async ticket => {
    const body = (replyText[ticket.id] || '').trim()
    if (!body || !user) return
    setBusy(true)
    const { error } = await supabase.rpc('customer_reply_to_support_ticket', { target_ticket: ticket.id, reply_body: body })
    if (!error) {
      setReplyText(current => ({ ...current, [ticket.id]: '' }))
      await notify('customer_reply', ticket.id)
      await fetchTickets()
    } else setNotice(error.message)
    setBusy(false)
  }

  return (
    <section className={styles.wrap}><div className={styles.inner}>
      <div className={styles.label}><span className={styles.line} /><span className={styles.labelText}>Help Centre</span><span className={styles.line} /></div>
      <h1 className={styles.title}>Contact &amp; Support</h1>
      <p className={styles.sub}>Create a support ticket for payments, book access, account or reader issues. Every reply stays together in one secure conversation.</p>
      {!user ? <div className={styles.signInCard}><h2>Sign in to contact support</h2><p>Your account lets us connect the ticket to your books and orders.</p><button type="button" className={styles.submitBtn} onClick={onAuthOpen}>Sign In / Create Account</button></div> : <>
        <div className={styles.supportSummary}><span><b>{tickets.length}</b> Total Tickets</span><span><b>{openTickets}</b> Active</span><span><b>{tickets.length - openTickets}</b> Resolved/Closed</span></div>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formHead}><div><p>NEW SUPPORT TICKET</p><h2>Tell us what happened</h2></div><span>Signed in as {user.email}</span></div>
          <div className={styles.twoFields}><div className={styles.field}><label htmlFor="support-name">Your Name</label><input id="support-name" required value={name} onChange={e => setName(e.target.value)} /></div><div className={styles.field}><label htmlFor="support-email">Account Email</label><input id="support-email" type="email" required readOnly value={email} /></div></div>
          <div className={styles.twoFields}><div className={styles.field}><label htmlFor="support-category">Category</label><select id="support-category" value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className={styles.field}><label htmlFor="support-order">Related Order ID (optional)</label><input id="support-order" value={relatedOrder} onChange={e => setRelatedOrder(e.target.value)} placeholder="Order or transaction reference" /></div></div>
          <div className={styles.field}><label htmlFor="support-subject">Subject</label><input id="support-subject" required maxLength={140} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Short summary of the issue" /></div>
          <div className={styles.field}><label htmlFor="support-message">Message</label><textarea id="support-message" required rows={6} value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe what happened and what you expected..." /></div>
          <div className={styles.field}><label htmlFor="support-file">Screenshot or file (optional, max 5 MB)</label><input ref={fileInputRef} id="support-file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e => setAttachment(e.target.files?.[0] || null)} /></div>
          <button disabled={busy} type="submit" className={styles.submitBtn}>{busy ? 'Creating Ticket…' : 'Create Support Ticket'}</button>{notice && <p className={styles.sentNote}>{notice}</p>}
        </form>
        <section className={styles.ticketSection}>
          <div className={styles.ticketTitle}><div><p>YOUR CONVERSATIONS</p><h2>Support Tickets</h2></div><button type="button" onClick={fetchTickets}>Refresh</button></div>
          {tickets.length === 0 ? <div className={styles.empty}>No tickets yet. Your new requests will appear here.</div> : tickets.map(ticket => <details className={styles.ticket} key={ticket.id} onToggle={event => { if (event.currentTarget.open) markTicketRead(ticket) }}>
            <summary><span><b>#{ticket.ticket_number} · {ticket.subject}</b><small>{CATEGORIES.find(item => item[0] === ticket.category)?.[1] || ticket.category} · {new Date(ticket.created_at).toLocaleDateString('en-IN')}</small></span><span className={styles.ticketBadges}>{Number(ticket.customer_unread_count || 0) > 0 && <strong>{ticket.customer_unread_count} new</strong>}<i data-status={ticket.status}>{STATUS_LABELS[ticket.status] || ticket.status}</i></span></summary>
            <div className={styles.thread}>{(ticket.support_messages || []).map(item => <article className={`${styles.message} ${item.sender_role === 'admin' ? styles.adminMessage : styles.customerMessage}`} key={item.id}><header><b>{item.sender_role === 'admin' ? 'ThePageCraft Support' : 'You'}</b><time>{new Date(item.created_at).toLocaleString('en-IN')}</time></header><p>{item.body}</p>{(item.attachments || []).map(file => <button type="button" className={styles.attachment} key={file.path} onClick={() => openAttachment(file)}>Open attachment: {file.name}</button>)}</article>)}{!['resolved', 'closed'].includes(ticket.status) && <div className={styles.replyBox}><textarea value={replyText[ticket.id] || ''} onChange={e => setReplyText(current => ({ ...current, [ticket.id]: e.target.value }))} placeholder="Write a reply..." /><button disabled={busy} type="button" onClick={() => sendReply(ticket)}>Send Reply</button></div>}</div>
          </details>)}
        </section>
      </>}
      <div className={styles.altCard}><p className={styles.altLabel}>Prefer email directly?</p><a href="mailto:itsritesharma261@gmail.com" className={styles.altEmail}>itsritesharma261@gmail.com</a><p className={styles.altResponse}>Usually responds within 24–48 hours</p></div>
      <div className={styles.ownerCard}><p className={styles.ownerLabel}>THEPAGECRAFT ONLY</p><a href="/tpc-owner-261/index.html" className={styles.ownerLink} aria-label="ThePageCraft private access"><span className={styles.ownerMark}>TPC</span><span className={styles.ownerText}>Private access</span><span className={styles.ownerArrow}>↗</span></a></div>
    </div></section>
  )
}
