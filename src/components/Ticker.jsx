import styles from './Ticker.module.css'

const items = [
  "📖 The Real Bihar — Coming Soon",
  "🌿 Nature Never Lies — Coming Soon",
  "⭐ Echoes of Freedom — Available Now on Amazon",
  "✨ New Titles Launching Soon by Ritesh Sharma",
  "📚 India's History, Politics & Nature — All in One Place",
]

export default function Ticker() {
  const doubled = [...items, ...items, ...items]
  return (
    <div className={styles.bar}>
      <div className={styles.track}>
        {doubled.map((item, i) => (
          <span key={i} className={styles.item}>
            {item}
            <span className={styles.dot}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}
