import styles from './IndependenceBanner.module.css'

export default function IndependenceBanner({ onNavigate }) {
  return (
    <div className={styles.strip}>
      <div className={styles.tricolor}>
        <span className={styles.saffron} />
        <span className={styles.white}>
          <span className={styles.chakra}>☸</span>
        </span>
        <span className={styles.green} />
        <span className={styles.sheen} />
      </div>
      <a
        href="/ebooks"
        onClick={e => { e.preventDefault(); onNavigate?.('/ebooks') }}
        className={styles.msg}
      >
        <span className={styles.msgText}>
          🇮🇳 Happy Independence Day — Flat <strong>45% OFF</strong> on all books · Use code <strong>AZADI45</strong>
        </span>
        <span className={styles.msgSub}>Celebrating 79 years of freedom — Jai Hind!</span>
        <span className={styles.arrow}>→</span>
      </a>
    </div>
  )
}
