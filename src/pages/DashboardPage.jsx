import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import styles from './DashboardPage.module.css'

// ── helpers ──────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10)
const todayLabel = () => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

const MOODS = ['😞','😕','😐','🙂','😄']
const MOOD_LABELS = ['Terrible','Bad','Okay','Good','Great']

// ── Ring component ────────────────────────────────────
function Ring({ value, max, color, size = 80, stroke = 8, label, unit }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const progress = Math.min(value / max, 1)
  const offset = circ * (1 - progress)
  return (
    <div className={styles.ringWrap}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-4)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className={styles.ringLabel}>
        <strong style={{ color }}>{value}</strong>
        <span>{unit}</span>
      </div>
      {label && <p className={styles.ringTitle}>{label}</p>}
    </div>
  )
}

// ── Bar ───────────────────────────────────────────────
function Bar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className={styles.barTrack}>
      <div className={styles.barFill} style={{ width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
    </div>
  )
}

// All available books metadata (for matching against purchases)
const ALL_BOOKS = {
  1: { id: 1, title: 'Echoes of Freedom', author: 'Ritesh Sharma', image: '/echoes-of-freedom.jpg' },
  2: { id: 2, title: 'The Real Bihar', author: 'Ritesh Sharma', image: '/real-bihar-1.jpg' },
  3: { id: 3, title: 'Nature Never Lies!', author: 'Ritesh Sharma', image: '/nature-never-lies-1.jpg' },
}

// ── Main Dashboard ────────────────────────────────────
export default function DashboardPage({ user, onReadBook }) {
  const dt = today()

  // Purchased books state — fetched from Supabase
  const [purchasedBooks, setPurchasedBooks] = useState([])
  const [booksLoading, setBooksLoading] = useState(false)

  // Health state
  const [health, setHealth] = useState(() => load(`health_${dt}`, {
    water: 0, sleep: 0, exercise: 0, calories: 0, steps: 0, mood: -1
  }))

  // Study state
  const [subjects, setSubjects] = useState(() => load('subjects', [
    { id: 1, name: 'Reading', color: '#a3e635', hours: 0, goal: 2 },
    { id: 2, name: 'Writing', color: '#a78bfa', hours: 0, goal: 1.5 },
    { id: 3, name: 'Research', color: '#60a5fa', hours: 0, goal: 1 },
  ]))
  const [notes, setNotes] = useState(() => load('notes', []))
  const [noteInput, setNoteInput] = useState('')
  const [noteSubject, setNoteSubject] = useState('')
  const [studyGoal, setStudyGoal] = useState(() => load('study_goal', 5))

  // Pomodoro
  const [pomSecs, setPomSecs] = useState(25 * 60)
  const [pomRunning, setPomRunning] = useState(false)
  const [pomMode, setPomMode] = useState('work') // work | break
  const pomRef = useRef(null)

  // New subject
  const [newSubName, setNewSubName] = useState('')
  const [newSubGoal, setNewSubGoal] = useState(1)
  const [showNewSub, setShowNewSub] = useState(false)
  const [activeTab, setActiveTab] = useState('health')


  // Fetch purchased books from Supabase — only if user is logged in
  useEffect(() => {
    if (!user) { setPurchasedBooks([]); return }
    setBooksLoading(true)
    supabase
      .from('purchases')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .then(({ data, error }) => {
        setBooksLoading(false)
        if (error || !data) return
        const books = data
          .map(row => ALL_BOOKS[row.product_id])
          .filter(Boolean)
        setPurchasedBooks(books)
      })
  }, [user])

  // Persist
  useEffect(() => { save(`health_${dt}`, health) }, [health, dt])
  useEffect(() => { save('subjects', subjects) }, [subjects])
  useEffect(() => { save('notes', notes) }, [notes])
  useEffect(() => { save('study_goal', studyGoal) }, [studyGoal])

  // Pomodoro timer
  useEffect(() => {
    if (pomRunning) {
      pomRef.current = setInterval(() => {
        setPomSecs(s => {
          if (s <= 1) {
            setPomRunning(false)
            setPomMode(m => m === 'work' ? 'break' : 'work')
            return m => m === 'work' ? 5 * 60 : 25 * 60
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(pomRef.current)
    }
    return () => clearInterval(pomRef.current)
  }, [pomRunning])

  const pomMins = String(Math.floor(pomSecs / 60)).padStart(2, '0')
  const pomSec2 = String(pomSecs % 60).padStart(2, '0')

  const totalStudyHours = subjects.reduce((a, s) => a + s.hours, 0)

  const updateHealth = (key, val) => setHealth(h => ({ ...h, [key]: val }))

  const addSubjectHours = (id, delta) => {
    setSubjects(prev => prev.map(s => s.id === id
      ? { ...s, hours: Math.max(0, Math.round((s.hours + delta) * 10) / 10) }
      : s
    ))
  }

  const addNote = () => {
    if (!noteInput.trim()) return
    setNotes(prev => [{
      id: Date.now(), text: noteInput.trim(),
      subject: noteSubject, date: dt,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }, ...prev])
    setNoteInput('')
  }

  const addSubject = () => {
    if (!newSubName.trim()) return
    const colors = ['#f87171','#fb923c','#fbbf24','#a3e635','#34d399','#2dd4bf','#60a5fa','#a78bfa','#f472b6']
    setSubjects(prev => [...prev, {
      id: Date.now(), name: newSubName.trim(),
      color: colors[prev.length % colors.length],
      hours: 0, goal: newSubGoal
    }])
    setNewSubName(''); setNewSubGoal(1); setShowNewSub(false)
  }

  const resetPomodoro = () => {
    setPomRunning(false)
    setPomSecs(pomMode === 'work' ? 25 * 60 : 5 * 60)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Personal Dashboard</h1>
          <p className={styles.subtitle}>{todayLabel()}</p>
        </div>
        <div className={styles.headerRight}>
          {user && (
            <div className={styles.userBadge}>
              <span className={styles.userDot} />
              {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
            </div>
          )}
        </div>
      </div>


      {/* My Books — only shown to logged-in users with actual purchases */}
      {user && (
        <div className={styles.myBooks}>
          <h2 className={styles.myBooksTitle}>📚 My Books</h2>
          {booksLoading && (
            <p className={styles.booksLoading}>Loading your library...</p>
          )}
          {!booksLoading && purchasedBooks.length === 0 && (
            <div className={styles.noBooksMsg}>
              <span>🛒</span>
              <p>You haven't purchased any books yet. <a href="/ebooks" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/ebooks'); window.dispatchEvent(new PopStateEvent('popstate')) }}>Browse eBooks →</a></p>
            </div>
          )}
          {!booksLoading && purchasedBooks.length > 0 && (
            <div className={styles.myBooksList}>
              {purchasedBooks.map(book => (
                <div key={book.id} className={styles.myBookCard}>
                  <img src={book.image} alt={book.title} className={styles.myBookImg} />
                  <div className={styles.myBookInfo}>
                    <p className={styles.myBookName}>{book.title}</p>
                    <p className={styles.myBookAuthor}>by {book.author}</p>
                  </div>
                  <button className={styles.readBtn} onClick={() => onReadBook?.(book.id)}>
                    📖 Read Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      <div className={styles.summaryRow}>
        <div className={styles.summaryCard} style={{ '--accent-color': 'var(--blue)' }}>
          <span className={styles.summaryIcon}>💧</span>
          <div>
            <p className={styles.summaryVal}>{health.water}<span>/{8} glasses</span></p>
            <p className={styles.summaryLbl}>Water Today</p>
          </div>
          <Bar value={health.water} max={8} color="var(--blue)" />
        </div>
        <div className={styles.summaryCard} style={{ '--accent-color': 'var(--purple)' }}>
          <span className={styles.summaryIcon}>🌙</span>
          <div>
            <p className={styles.summaryVal}>{health.sleep}<span>/8 hrs</span></p>
            <p className={styles.summaryLbl}>Sleep</p>
          </div>
          <Bar value={health.sleep} max={8} color="var(--purple)" />
        </div>
        <div className={styles.summaryCard} style={{ '--accent-color': 'var(--green)' }}>
          <span className={styles.summaryIcon}>📚</span>
          <div>
            <p className={styles.summaryVal}>{totalStudyHours.toFixed(1)}<span>/{studyGoal} hrs</span></p>
            <p className={styles.summaryLbl}>Study Hours</p>
          </div>
          <Bar value={totalStudyHours} max={studyGoal} color="var(--green)" />
        </div>
        <div className={styles.summaryCard} style={{ '--accent-color': 'var(--orange)' }}>
          <span className={styles.summaryIcon}>🔥</span>
          <div>
            <p className={styles.summaryVal}>{health.calories}<span>/2000 kcal</span></p>
            <p className={styles.summaryLbl}>Calories</p>
          </div>
          <Bar value={health.calories} max={2000} color="var(--orange)" />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['health','study','notes'].map(t => (
          <button key={t} className={`${styles.tab} ${activeTab===t ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t)}>
            {t === 'health' ? '❤️ Health' : t === 'study' ? '📖 Study' : '📝 Notes'}
          </button>
        ))}
      </div>

      {/* HEALTH TAB */}
      {activeTab === 'health' && (
        <div className={styles.tabContent}>
          <div className={styles.healthGrid}>

            {/* Water */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}>💧</span>
                <h3>Water Intake</h3>
              </div>
              <Ring value={health.water} max={8} color="var(--blue)" size={100} stroke={10} label="glasses" unit="gl" />
              <div className={styles.stepper}>
                <button onClick={() => updateHealth('water', Math.max(0, health.water - 1))}>−</button>
                <span>{health.water} / 8</span>
                <button onClick={() => updateHealth('water', Math.min(20, health.water + 1))}>+</button>
              </div>
              <div className={styles.quickBtns}>
                {[1,2,3].map(n => (
                  <button key={n} className={styles.quickBtn}
                    onClick={() => updateHealth('water', Math.min(20, health.water + n))}>+{n}</button>
                ))}
              </div>
            </div>

            {/* Sleep */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}>🌙</span>
                <h3>Sleep</h3>
              </div>
              <Ring value={health.sleep} max={8} color="var(--purple)" size={100} stroke={10} label="hours" unit="hr" />
              <div className={styles.stepper}>
                <button onClick={() => updateHealth('sleep', Math.max(0, health.sleep - 0.5))}>−</button>
                <span>{health.sleep}h / 8h</span>
                <button onClick={() => updateHealth('sleep', Math.min(12, health.sleep + 0.5))}>+</button>
              </div>
              <div className={styles.quickBtns}>
                {[6,7,8].map(n => (
                  <button key={n} className={styles.quickBtn}
                    onClick={() => updateHealth('sleep', n)}>{n}h</button>
                ))}
              </div>
            </div>

            {/* Exercise */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}>🏃</span>
                <h3>Exercise</h3>
              </div>
              <Ring value={health.exercise} max={60} color="var(--green)" size={100} stroke={10} label="minutes" unit="min" />
              <div className={styles.stepper}>
                <button onClick={() => updateHealth('exercise', Math.max(0, health.exercise - 5))}>−</button>
                <span>{health.exercise} / 60 min</span>
                <button onClick={() => updateHealth('exercise', Math.min(300, health.exercise + 5))}>+</button>
              </div>
              <div className={styles.quickBtns}>
                {[15,30,45].map(n => (
                  <button key={n} className={styles.quickBtn}
                    onClick={() => updateHealth('exercise', n)}>{n}m</button>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}>👟</span>
                <h3>Steps</h3>
              </div>
              <Ring value={Math.min(health.steps, 10000)} max={10000} color="var(--teal)" size={100} stroke={10} label="steps" unit="st" />
              <div className={styles.stepper}>
                <button onClick={() => updateHealth('steps', Math.max(0, health.steps - 500))}>−</button>
                <span>{health.steps.toLocaleString()}</span>
                <button onClick={() => updateHealth('steps', health.steps + 500)}>+</button>
              </div>
              <div className={styles.quickBtns}>
                {[1000,2500,5000].map(n => (
                  <button key={n} className={styles.quickBtn}
                    onClick={() => updateHealth('steps', health.steps + n)}>+{(n/1000).toFixed(n===1000?0:1)}k</button>
                ))}
              </div>
            </div>

            {/* Calories */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}>🔥</span>
                <h3>Calories</h3>
              </div>
              <Ring value={Math.min(health.calories, 2000)} max={2000} color="var(--orange)" size={100} stroke={10} label="kcal" unit="kc" />
              <div className={styles.stepper}>
                <button onClick={() => updateHealth('calories', Math.max(0, health.calories - 100))}>−</button>
                <span>{health.calories} / 2000</span>
                <button onClick={() => updateHealth('calories', health.calories + 100)}>+</button>
              </div>
              <div className={styles.quickBtns}>
                {[200,400,600].map(n => (
                  <button key={n} className={styles.quickBtn}
                    onClick={() => updateHealth('calories', health.calories + n)}>+{n}</button>
                ))}
              </div>
            </div>

            {/* Mood */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}>😊</span>
                <h3>Mood</h3>
              </div>
              <div className={styles.moodGrid}>
                {MOODS.map((m, i) => (
                  <button key={i}
                    className={`${styles.moodBtn} ${health.mood === i ? styles.moodActive : ''}`}
                    onClick={() => updateHealth('mood', i)}
                    title={MOOD_LABELS[i]}
                  >
                    <span>{m}</span>
                    <span className={styles.moodLbl}>{MOOD_LABELS[i]}</span>
                  </button>
                ))}
              </div>
              {health.mood >= 0 && (
                <p className={styles.moodSelected}>
                  Today you feel <strong>{MOOD_LABELS[health.mood]}</strong> {MOODS[health.mood]}
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* STUDY TAB */}
      {activeTab === 'study' && (
        <div className={styles.tabContent}>
          <div className={styles.studyLayout}>

            {/* Left — subjects + pomodoro */}
            <div className={styles.studyLeft}>
              {/* Daily goal */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardIcon}>🎯</span>
                  <h3>Daily Study Goal</h3>
                </div>
                <div className={styles.goalRow}>
                  <Ring value={totalStudyHours} max={studyGoal} color="var(--green)" size={110} stroke={11} unit="hr" />
                  <div className={styles.goalInfo}>
                    <p className={styles.goalBig}>{totalStudyHours.toFixed(1)} <span>/ {studyGoal}h</span></p>
                    <p className={styles.goalSub}>{((totalStudyHours/studyGoal)*100).toFixed(0)}% complete</p>
                    <div className={styles.stepper} style={{ marginTop: 12 }}>
                      <button onClick={() => setStudyGoal(g => Math.max(1, g - 0.5))}>−</button>
                      <span>Goal: {studyGoal}h</span>
                      <button onClick={() => setStudyGoal(g => Math.min(16, g + 0.5))}>+</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pomodoro */}
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={styles.cardIcon}>{pomMode==='work'?'⏱️':'☕'}</span>
                  <h3>Pomodoro — {pomMode === 'work' ? 'Focus' : 'Break'}</h3>
                </div>
                <div className={styles.pomTimer}>{pomMins}:{pomSec2}</div>
                <div className={styles.pomBtns}>
                  <button className={`${styles.pomBtn} ${styles.pomBtnPrimary}`}
                    onClick={() => setPomRunning(r => !r)}>
                    {pomRunning ? '⏸ Pause' : '▶ Start'}
                  </button>
                  <button className={styles.pomBtn} onClick={resetPomodoro}>↺ Reset</button>
                  <button className={styles.pomBtn}
                    onClick={() => { setPomRunning(false); setPomMode(m => { const next = m==='work'?'break':'work'; setPomSecs(next==='work'?25*60:5*60); return next }) }}>
                    Skip
                  </button>
                </div>
                <Bar value={pomMode==='work'?25*60-pomSecs:5*60-pomSecs} max={pomMode==='work'?25*60:5*60} color="var(--gold)" />
              </div>
            </div>

            {/* Right — subjects */}
            <div className={styles.studyRight}>
              <div className={styles.card} style={{ height: '100%' }}>
                <div className={styles.cardHead} style={{ marginBottom: 20 }}>
                  <span className={styles.cardIcon}>📚</span>
                  <h3>Subjects</h3>
                  <button className={styles.addSubBtn} onClick={() => setShowNewSub(s => !s)}>+ Add</button>
                </div>

                {showNewSub && (
                  <div className={styles.newSubForm}>
                    <input placeholder="Subject name" value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addSubject()} />
                    <div className={styles.newSubRow}>
                      <label>Goal (hrs):</label>
                      <input type="number" min="0.5" max="12" step="0.5" value={newSubGoal}
                        onChange={e => setNewSubGoal(+e.target.value)} style={{ width: 70 }} />
                      <button className={styles.addSubSave} onClick={addSubject}>Save</button>
                    </div>
                  </div>
                )}

                <div className={styles.subjectList}>
                  {subjects.map(sub => (
                    <div key={sub.id} className={styles.subjectItem}>
                      <div className={styles.subjectDot} style={{ background: sub.color }} />
                      <div className={styles.subjectInfo}>
                        <div className={styles.subjectNameRow}>
                          <span className={styles.subjectName}>{sub.name}</span>
                          <span className={styles.subjectHours} style={{ color: sub.color }}>
                            {sub.hours.toFixed(1)}h / {sub.goal}h
                          </span>
                        </div>
                        <Bar value={sub.hours} max={sub.goal} color={sub.color} />
                      </div>
                      <div className={styles.subjectCtrl}>
                        <button onClick={() => addSubjectHours(sub.id, -0.5)}>−</button>
                        <button onClick={() => addSubjectHours(sub.id, 0.5)}>+</button>
                      </div>
                      <button className={styles.subjectDel}
                        onClick={() => setSubjects(prev => prev.filter(s => s.id !== sub.id))}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTES TAB */}
      {activeTab === 'notes' && (
        <div className={styles.tabContent}>
          <div className={styles.notesLayout}>
            {/* Input */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardIcon}>✍️</span>
                <h3>Add Note</h3>
              </div>
              <div className={styles.noteForm}>
                <select value={noteSubject} onChange={e => setNoteSubject(e.target.value)} className={styles.noteSelect}>
                  <option value="">— Subject (optional) —</option>
                  {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <textarea
                  placeholder="Write your note, idea, or reminder here..."
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  className={styles.noteTextarea}
                  rows={4}
                />
                <button className={styles.noteAddBtn} onClick={addNote}>Save Note</button>
              </div>
            </div>

            {/* Notes list */}
            <div className={styles.notesList}>
              {notes.length === 0 && (
                <div className={styles.emptyNotes}>
                  <span>📝</span>
                  <p>No notes yet — add your first one!</p>
                </div>
              )}
              {notes.map(n => (
                <div key={n.id} className={styles.noteCard}>
                  <div className={styles.noteCardHead}>
                    {n.subject && (
                      <span className={styles.noteTag}
                        style={{ background: subjects.find(s=>s.name===n.subject)?.color + '22', color: subjects.find(s=>s.name===n.subject)?.color || 'var(--gold)' }}>
                        {n.subject}
                      </span>
                    )}
                    <span className={styles.noteTime}>{n.date} · {n.time}</span>
                    <button className={styles.noteDel} onClick={() => setNotes(prev => prev.filter(x => x.id !== n.id))}>✕</button>
                  </div>
                  <p className={styles.noteText}>{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
