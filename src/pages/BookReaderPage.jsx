import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './BookReaderPage.module.css'
import { readingPrefs, saveReadingPrefs } from '../lib/readingProgress'

// ── Full Book Content ──────────────────────────────────────────────────────
const BOOK_CONTENT = {
  1: {
    title: 'Echoes of Freedom',
    subtitle: "Untold Stories from India's Fight for Independence",
    author: 'Ritesh Sharma',
    chapters: [
      {
        title: 'The Silent Conquest of India',
        chapterNum: '01',
        summary: 'The East India Company arrived for trade but slowly gained power through alliances, wars, and manipulation, eventually defeating Indian rulers and establishing control, transforming from merchants into the dominant political authority in India.',
        pages: [
          `The East India Company systematically looted India's wealth over 200 years, causing economic devastation. They used deception, bribery, and military force to establish control, eventually leading to the British colonization of India.\n\nThe whole modern capitalist global system of today is based on this loot. All these things started in the year 1599, when spices were a very high-value commodity. Black pepper had such a strong impact that merchants called it "black gold." It was compared to gold. At that time, Dutch had more control on the spice trade.\n\nIn mid-1599, the Dutch increased five shillings on black pepper. Britishers became very angry about this manipulation. On 24th September 1599, 24 rich merchants gathered in the hall street of the city of London and decided to trade on their own. They convinced 125 shareholders, collected 72,000 pounds and formed a company — "The Governor and Company of Merchants of London, trading into the East Indies."`,
          `After three months, on 31st December 1599, Queen Elizabeth I gave them a royal charter. This approval meant the East India Company could go to different places in the world, buy spices and other commodities at low prices, and sell them back to Europe — essentially a trading license.\n\nThe royal charter was given for 15 years, for the area east of Cape of Good Hope and west of the States of Magellan. Queen also ensured that only East India Company from England would trade there — any other company's goods would be confiscated to prevent internal competition.\n\nQueen gave the Company extraordinary powers: they could print their own money, make their own laws, run courts, give punishments, maintain an army, and claim jurisdiction. The East India Company had only one objective — to make profit for its shareholders, regardless of consequences to others.`,
          `In the year 1608, William Hawkins — a diplomat of the East India Company — was given a ship named Hector. On 24th August 1608, they reached Surat, India for the first time. At that time, the Mughal Empire was at its peak. India was a textile manufacturer — producing 25% of world manufacturing, more than all of Europe combined. India's economy was equivalent to 21 trillion dollars in today's standards.\n\nWilliam Hawkins reached Agra and tried to impress Jahangir, wearing Afghan dress and speaking broken Turkish. But the Mughals considered the Britishers rude and didn't entertain them. Later, on 18th September 1615, official ambassador Sir Thomas Rowe was sent. He spent 3 years convincing Jahangir of mutual trading benefits, finally getting permission to open a factory in Surat with limited trading rights.\n\nEast India Company's ambitions were vast. They convinced the Sultan of Golconda to open a second factory in Machilipatnam in Andhra Pradesh, and a third in Patna in 1620.`,
          `By 1640, they had identified weakness in the Vijayanagara Empire. Without fighting, they convinced the king of the benefits of trade. The king gave them a three-mile fishing village called Madras Patnam. They built Fort St. George there — the area later became Madras.\n\nIn 1662, the King of England, Charles II, married Portuguese Queen Catherine. He received the island of "Bumbye" (today's Mumbai) as dowry. This island was given to East India Company, making Bombay another trading base.\n\nBengal — comprising today's Odisha, Bengal, Bangladesh, and Bihar — was the most prosperous region in the world. Dhaka's textile manufacturing was unrivaled. East India Company always dreamed of trading there. Through William Hedges, they established small-level trade in Bengal, despite Governor Shahista Khan's reluctance.`,
          `When new director Joshia Child came in 1681, he refused to pay increased taxes and threatened to capture Chittagong. He called 19 warships, 200 cannons and 600 soldiers from London and attacked the Mughals — the first direct war by East India Company.\n\nThe Mughals defeated them badly. Factories in Hougli, Patna, Kasim Bazaar, Masuli Patnam and Vishaka Patnam were captured. The Company apologized for years — even a French painting shows them bowing before Aurangzeb. In 1690, they were forgiven after paying 1.5 lakh rupees.\n\nIn 1707, Aurangzeb died and the Mughal Empire rapidly weakened. Back-to-back emperors changed within 10 years. By 1717, Emperor Farooq was so impressed by Company surgeon William Hamilton's treatment of his disease that he issued an order: East India Company would trade in Bengal tax-free. This was called Dastak — a free pass to transfer goods without checking.`,
          `The Battle of Plassey on 23rd June 1757 changed India's history. Siraj Ud-Daulah had captured Calcutta's East India Company factory with 30,000 soldiers. Robert Clive was sent south to fix this.\n\nInstead of direct war, the Company played politics. Mir Zafar — Siraj's army commander — was promised the throne. Jagat Seth funded the entire operation. When war began, Mir Zafar pulled the army back. Rain drenched Siraj's weapons but the British covered theirs. East India Company won.\n\nMir Zafar was made Nawab — not out of loyalty, but because the Company always preferred puppet kings. Through puppet rulers, they changed trade policies and took all revenue. After Battle of Buxar in 1764, the Treaty of Allahabad gave East India Company all Diwani rights — all revenue from Bengal, Bihar, and Odisha.\n\nIn 1770, a drought killed 70 lakh to 1 crore people in Bihar and Bengal. Yet the Company still collected taxes — even from those who had died, demanding it from surviving family members. Bengal, once the world's most prosperous region, was reduced to famine.`,
          `Tipu Sultan of Mysore stood against British expansion. After multiple wars, Tipu was modernizing his army with French weapons. When East India Company finally attacked with Maratha and Hyderabad support, Tipu's children were held hostage. They demanded half his kingdom and 3 crore rupees in fines. Tipu refused and died fighting. The Company took 2 million Euros worth of gold from his treasury.\n\nIn 1803, East India Company took the Mughal capital Delhi. The Maratha Kingdom was then attacked and defeated. The Sikh Empire fell next. In 1847, the Doctrine of Lapse was introduced: if any Indian ruler died without a male heir, his kingdom automatically came under Company control. Kingdoms of Udaipur, Jhansi, and Awadh fell this way.\n\nAccording to Indian economist Utsa Patnaik, East India Company and the British government looted 45 trillion dollars from India's wealth over almost 200 years. The current GDP of Britain is only 3 trillion dollars. India couldn't modernize itself — not a single rupee was left for machinery or technology imports.\n\nIt is shocking that even today, the District Administrative Officer is called a "Collector" — a word from British times, when they collected tax causing hunger. East India Company looted openly, but in a very professional way.`
        ]
      },
      {
        title: 'The End of British Rule',
        chapterNum: '02',
        summary: 'India gained independence through powerful nationwide movements led by Mahatma Gandhi, using non-violent protests against British rule. Events like the Simon Commission protests and mass civil disobedience united the nation, ultimately forcing the British to grant freedom.',
        pages: [
          `By 1837, the East India Company had established direct control over nearly 50% of Indian territory. The remaining regions were governed by princely states under local rulers, but these states functioned under the Company's authority.\n\nTo control everything, East India Company continuously increased their army. They started hiring local Indians — farmers facing hunger joined for security and Rs 7-8 monthly salary. The ratio of Indian to British soldiers was 6:1, with 2,38,000 native soldiers versus 45,000 British.\n\nA British Military officer warned Governor General Dalhousie: "On one hand you're recruiting farmers in the Army, and on the other hand through land reforms you're capturing their lands. If they ever get enraged, it'll be a huge problem."\n\nLord Dalhousie was given responsibility to solve the "indirect rule" problem. In 1848, he introduced the Doctrine of Lapse — if a king has no son, his entire state goes to East India Company. Satara, Jaipur, Sambalpur, Nagpur, Jhansi, and finally Awadh were taken this way.`,
          `In Jhansi, Manikarnika (named Maharani Lakshmi Bai after marriage) had an adopted son. When Maharaja Gangadhar Rao died in 1853, Dalhousie invoked Doctrine of Lapse and gave Rani Lakshmi Bai a pension of Rs 60,000 instead.\n\nBritishers increased missionary activities and promoted Christianity. They passed the Religious Disability Act (1850) — anyone who converts gets full rights to ancestral property, overruling community exile. The Hindu Widow Remarriage Act (1856) and General Service Enlistment Act (1856) further interfered with Hindu traditions. Within a few years, 12 famines spread across India.\n\nThe breaking point came from a cartridge. The new P-53 Enfield rifle used paper cartridges greased with animal fat (cow and pig) to prevent moisture damage. In January 1857 in Dum-Dum near Kolkata, a Brahmin soldier learned from a Khalasi worker that the cartridges were greased with cow and pig fat. The news spread through every regiment — Hindus and Muslims were horrified.`,
          `On 29th March 1857, soldier Mangal Pandey marched in Barrackpore Cantonment urging his friends to rise for their religion. When Lt. Baugh approached, Mangal Pandey shot his horse. A struggle followed. No fellow soldiers obeyed British orders to arrest Pandey. On 8th April 1857, Mangal Pandey was sentenced to death — India's first martyr who attacked the Britishers alone.\n\nThe entire 34th Bengal Native Infantry was suspended. In April, soldiers in Ambala refused cartridges. Lucknow regiment threatened to kill officers if forced to use them. The tension spread everywhere.\n\nOn 24th April 1857, British officer George Michael tried to train 90 Bengal regiment soldiers with new cartridges. 85 out of 90 refused. They were court-martialled in public, their uniforms torn, weapons taken, given 10 years imprisonment. Their friends watched in fury.\n\nOn Sunday, 10th May 1857, while most Britishers were in church, soldiers broke open the prison, freed the 85 soldiers, released other prisoners, killed British officers, took all ammunition, and marched toward Delhi.`,
          `On 11th May 1857, they reached Delhi. Soldiers there joined them. The Great Magazine was looted. British officers fled Delhi. The revolutionaries reached 82-year-old Bahadur Shah Zafar at Red Fort and asked him to lead — promising to restore the Mughal flag over India.\n\nBahadur Shah wrote letters to rulers across India calling them to fight the British together. Real command was with Subedar Bakt Khan, who had served in the British Army for 40 years and arrived from Bareilly.\n\nRevolts erupted across India — Ferozpur, Muzaffarpur, Naushera, UP cities — common people burned British offices, attacked British officers. South India and North-East had less impact. Britishers called 2000 reinforcements from UK under Brigadier General John Nicolson.\n\nOn 25th August 1857, at Najafgarh, revolutionaries fought long but lost. On 21st September 1857, Britishers recaptured Delhi. Bahadur Shah Zafar was sentenced to life imprisonment. His wife Zeenat Mehal was sent with him to Rangoon prison. His sons and grandson were shot.`,
          `Rani Lakshmi Bai had taken control of Jhansi's fort in July 1857. When Britishers arrived on 23rd March 1858, she fought back. Her childhood friend Tatya Tope sent army support. At midnight, Britishers entered the fort. Rani escaped with her son Damodar on her horse Badal, jumping the fort wall.\n\nShe fled to Kalpi, then to Gwalior. On 17th June 1858, in the Battle of Gwalior, over 5000 revolutionaries died. Rani Lakshmi Bai fell in battle. Many British officers praised her extraordinary courage.\n\nThe 1857 revolt ultimately failed due to: no proper unified leadership, everyone fighting separately without coordination, and many state rulers supporting the British for personal benefit.\n\nOn 2nd August 1858, the British Government passed the Government of India Act 1858 in Parliament. East India Company was removed and British Raj — direct Crown rule — began. Doctrine of Lapse was ended. Queen Victoria's proclamation promised religious freedom, equality, and fair treatment. On paper, everything looked good.`,
          `The Indian National Congress was formed on 28th December 1885 at Gokuldas Tejpal Sanskrit College, Mumbai — 72 educated people from across India, including retired British officer A.O. Hume and 69 Indians.\n\nCongress used the PPP model: Prayer, Protest, Petition. Moderate leaders believed Britishers were not bad people, just unaware of Indian problems. However, these moderates achieved little — their rights kept shrinking as new acts were passed.\n\nWhen the British partitioned Bengal in 1905 to divide Hindu and Muslim communities, the Swadeshi Movement began — boycott British goods, use only Indian-made products. People gathered at the Ganga, collectively bathed, and came out singing "Vande Mataram." Even today, politicians wearing Khadi is a legacy of this movement.\n\nIn 1906, All India Muslim League was formed in Dhaka. The same year, Mohammad Ali Jinnah joined Congress. In December 1906, Congress held its Calcutta session. In 1907, Congress split into Naram Dal (moderate) and Garam Dal (extremist) at the Surat Session — chairs and shoes were thrown at each other.`,
          `On 9th January 1915, Gandhi Ji arrived in India from South Africa. His mentor Gopal Krishna Gokhale asked him to first travel all of India, meet people, understand their problems — for two years, Gandhi traveled without any political activity, in third-class trains, wearing common clothes.\n\nIn December 1916, two farmers from Champaran — Raj Kumar Shukla and Sant Raut — met Gandhi at the Congress session. They told him about forced Indigo farming (Tinkathia system) under British planters. On 15th April 1917, Gandhi reached Champaran with his lawyers, going door-to-door recording people's accounts.\n\nDistrict Collector told Gandhi to leave under Section 144. Gandhi refused. On 18th April 1917, summoned to Motihari court, such huge crowds surrounded it that the court released Gandhi. This was the first victory of Satyagrah in India — civil disobedience without violence.\n\nGandhi defined Satyagrah: hold firmly to truth, civil disobedience, passive resistance — mass protest without violence, become fearless. For the first time, common farmers and workers were directly involved in a national movement.`,
          `The Rowlatt Act (18th March 1919) allowed 2-year imprisonment without trial for activists and made possessing anti-British newspapers a criminal offense. Gandhi started Satyagrah against it. Farmers, laborers — all joined for the first time in a national issue.\n\nOn 9th April 1919, Gandhi was arrested. But the Satyagrah continued. Two Congress leaders, Dr. Saifuddin and Dr. Satyapal, were leading protests in Punjab. General Dyer fraudulently arrested them. Angry people decided to gather at Jalianwalla Bagh on 13th April 1919 — Baisakhi day.\n\nGeneral Dyer banned public gatherings but news spread slowly without social media. Over 10,000 people gathered. Dyer blocked the only entrance and exit, and ordered firing. According to British data, 400 died; eyewitnesses said 120 bodies were in the well alone.\n\nOutrage spread across the world. Gandhi withdrew Satyagrah on 18th April 1919. But from here, Britishers' difficult days began. No action was taken against General Dyer — he was praised in House of Lords. People of Britain raised 26,000 pounds for him. India was enraged.\n\nGandhi united Hindu and Muslim communities in the Non-Cooperation Movement. Congress joined. First demand: Swaraj. Second: Punishment for the guilty. Schools, colleges, courts were boycotted. Foreign goods were burned. Nehru, Motilal Nehru, Sardar Patel, Rajendra Prasad — all lawyers left their jobs.\n\nOn 4th February 1922, in Chauri Chaura, Gorakhpur, angry protesters set a police station on fire, killing 22 officers. Gandhi was shocked. On 12th February 1922, he stopped the Non-Cooperation Movement. Britishers sent him to jail for 6 years. The freedom struggle temporarily stalled — but India would never be the same again.`
        ]
      },
      {
        title: 'Partition',
        chapterNum: '03',
        summary: 'The Partition of India in 1947 was the division of British India into two independent nations — India and Pakistan.',
        pages: [
          `In Karachi's Kharadar district, on 25th December 1876, Muhammad Ali Jinnah was born to businessman Jinnabhai Poonja. Jinnah's grandfather had converted from Hinduism (Khoja caste) to Islam. Jinnah studied at Karachi's Christian Missionary Society High School, then went to London to study law. He returned to Karachi in 1896 — the same day learning his father had massive business losses. He moved to Bombay for legal practice.\n\nAt that time, India's total population was around 38 crores — 65% Hindu, 27% Muslim. The north-west and north-east of British India had Muslim majorities: 94% in Khyber Pakhtun, 87% in Baluchistan, 71% in Sindh, 57% in Punjab, 55% in Bengal.\n\nBengal had become the hub of revolutionary activities — famous politicians, lawyers, intellectuals targeting Britishers from there. In 1905, Viceroy Lord Curzon divided Bengal: the Muslim-majority east became "East Bengal" (today's Bangladesh), the rest became "West Bengal." This was a calculated divide-and-rule strategy.`,
          `Against Bengal's partition, the Indian National Congress launched protests. But Muslims of East Bengal — now in majority — were less active in protests. For the first time, discussion arose: "Is Indian National Congress a Hindu party? Muslims are 26% of population but only 6.59% of Congress delegates are Muslim. If Britishers leave and elections happen, Hindus will always win."\n\nCongress maintained one stance: "Religion is your private matter. India will be Secular — every religion, every community will have space. Nationalism and Country are greater than any religion."\n\nJinnah joined Congress in 1906. At that time, Jinnah believed deeply in Secularism, criticized Maulana and Maulvi, and was tagged by Sarojini Naidu as "Ambassador of Hindu-Muslim Unity." But everything was about to change.\n\nIn December 1906, at the Muhammadan Educational Conference in Dhaka, All India Muslim League was formed — to present Muslim perspectives and demand separate representation. First president was Aga Khan. The League immediately demanded a "separate electorate" — seats where only Muslim candidates stand and only Muslims vote.`,
          `In 1909, Muslim League met Lord Minto and Lord Morley in Shimla to demand separate electorates. Britishers easily agreed — creating separate Muslim constituencies in United Province, Bengal, Punjab, Bombay, Madras, and Central Province. This was the Morley-Minto Reform.\n\nJinnah joined Muslim League in 1913 while staying in Congress — saying he wanted to maintain Hindu-Muslim unity by bridging both parties. In December 1916, the Lucknow Pact was signed: Congress and Muslim League agreed to work together for Swaraj (self-rule, not independence), and Congress accepted the separate electorate demand.\n\nHowever, Hindu nationalist leaders Lala Lajpat Rai and Madan Mohan Malviya were unhappy. In 1915, Hindu Maha Sabha was formed to present Hindu perspectives.\n\nAfter World War I, the allied powers dismantling the Ottoman Caliphate angered Muslims worldwide. In India, the Khilafat Movement began. Gandhi saw it as an opportunity — he supported the movement completely, uniting Hindus and Muslims against the British. Congress became stronger; Muslim League was sidelined. Jinnah then resigned from both Congress and Muslim League, calling Gandhi a "dictator," and went to London.`,
          `In 1923, Punjab's Municipal Amendment Act suddenly reduced Hindu seats in Muslim-majority areas. Hindu-Muslim tensions increased. Hindu Maha Sabha demanded more Hindu seats. V.D. Savarkar wrote "Hindutva: Who is a Hindu?" from Andaman's Cellular Jail. Arya Samaj launched Shuddhi Campaign. RSS was formed.\n\nCongress was stuck between Hindu and Muslim community pressures. In 1926, all Congress candidates in Bengal and Punjab were Hindu — angering Muslims. Muslim League started gaining Muslim support.\n\nIn 1930, Muslim League President Muhammad Iqbal announced at the Allahabad session: "We want Punjab, North West Frontier Province, Sindh, and Baluchistan united into one Muslim state." This was the first demand for a separate Muslim state.\n\nAt Cambridge University, Chaudhry Rahmat Ali's pamphlet "Now or Never" introduced the name "PAKISTAN" for the first time. In 1933, Liaqat Ali Khan went to London and reportedly convinced Jinnah to return to India, join Muslim League, and demand a separate Muslim country. In April 1934, a transformed Jinnah came back to India, reorganized Muslim League, and began aggressively pushing the "Two Nation Theory" — that Hindus and Muslims could never live together.`,
          `The Government of India Act, 1935 expanded voting rights to 30-35 million Indians. In 1936 elections across 1585 seats, Congress won 707 seats. Muslim League won only 106 seats. Congress Muslim candidates even defeated Muslim League in Muslim-reserved seats. Congress was clearly the representative of all Indians — Muslim League was devastated.\n\nIn 1939, World War II began. Britishers announced India's participation without asking Indian leadership. Congress demanded: "Promise us independence after the war, then we'll help." Britishers refused. All 707 Congress-led state governments resigned in protest. Muslim League gave unconditional support to the British — hoping for Pakistan as reward.\n\nHindu Maha Sabha also supported Britishers. Congress leadership resigned, half went to jail under Quit India Movement (1942). With Congress down, Hindu Maha Sabha and Muslim League grew powerful, openly fighting each other. Hindu-Muslim riots increased dramatically, pushing India toward partition.\n\nIn March 1940, Muslim League passed the Lahore Resolution — officially demanding a separate Pakistan from Punjab, Sindh, NWFP, Baluchistan, Bengal, and Assam. Congress said India would never be partitioned. Deadlock.`,
          `World War II ended in 1945. Britain was exhausted and under US/UN pressure to decolonize. Labour Party won UK elections; Clement Attlee became PM. On 15th March 1945, he announced Britain would leave India.\n\nBut to whom give power — Congress or Muslim League? In early 1946, elections were held. Results: Congress won 923 of 1585 seats in Hindu areas. Muslim League won 425 of 482 Muslim-reserved seats — 90% of Muslim votes. The election proved Muslim League truly represented India's Muslims.\n\nCabinet Mission arrived on 24th March 1946 to plan India's future. On 16th May 1946, they announced their plan: India would NOT be partitioned. Three provincial groups (A: Hindu-majority states; B & C: Muslim-majority areas) with a weak center. Both Jinnah and Congress initially accepted — Jinnah saw a path to a larger future Pakistan; Congress saw a united India.\n\nBut differences emerged. Congress wanted group membership optional; Jinnah needed it compulsory. Jinnah backed out. Congress started working on the constitution. Muslim League chose a different path.`,
          `On 29th July 1946, Jinnah held a Muslim League meeting and declared: on 16th August 1946, "Direct Action Day" will be observed. Huseyn Shaheed, heading Bengal under Muslim League, removed police that day. Peaceful protest turned into riots — the "Great Calcutta Killing." Thousands died. Riots spread across India for the next year, with 200-300 deaths daily.\n\nCongress couldn't stop the riots — they weren't in power. Britishers wanted to leave quickly. The riots would only stop with partition. With people dying daily, Congress President Kripalani Ji said: "Rather than have a battle, we should let them have their Pakistan." On 19th March 1947, Nehru also accepted partition.\n\nOn 3rd June 1947, Mountbatten published the partition plan: India and Pakistan as two separate nations, both under British Crown as Dominions until their constitutions were framed (India: 1950, Pakistan: 1956). Punjab and Bengal would vote — Hindus and Sikhs chose India, so both provinces were split.\n\nSindh, North West Frontier, Baluchistan, Sylhet, West Punjab, and East Bengal went to Pakistan. The rest stayed with India. Railways, civil services, financial assets, even tables and chairs — everything was divided equally. The independence date was changed from 30th June 1948 to 15th August 1947 — the day Japan had surrendered to Allied forces, a date personal to Mountbatten.`,
          `On 17th August 1947 — two days after independence — Radcliffe's borders were announced. Many people learned overnight that their home was now in a different country. Millions of Hindus and Sikhs migrated from what became Pakistan; millions of Muslims migrated from India.\n\nIn areas with the highest communal tension, the migration turned catastrophic. Trains arrived filled with dead bodies. Women were assaulted. Entire families were massacred on the roads. No vehicles came for most people — they walked in massive columns, attacked from all sides.\n\n10 to 20 lakh people were killed after partition — even after a solution had been found, even after the decision was made. People who survived still wept for their homes decades later, asking to be taken back across the border.\n\nJinnah — who was so firm on this partition — died of tuberculosis just one year later, in September 1948.\n\nOn 26th January 1950, India's constitution was framed and its Dominion status was removed — India became a fully independent Republic. Pakistan's Dominion status was removed on 23rd March 1956.\n\nBut even today, the memory of partition lives on. In the hearts of those who lived through it, and in the stories passed down to their children — the scars of that division have never fully healed. The echoes of that freedom still ring with both triumph and tragedy.`
        ]
      }
    ]
  }
}

// ── Tool types ─────────────────────────────────────────────────────────────
const TOOLS = {
  CURSOR: 'cursor',
  PEN: 'pen',
  HIGHLIGHTER: 'highlighter',
  ERASER: 'eraser',
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: 'rgba(255,230,0,0.35)' },
  { name: 'Green', value: 'rgba(100,220,100,0.35)' },
  { name: 'Pink', value: 'rgba(255,100,180,0.35)' },
  { name: 'Blue', value: 'rgba(100,160,255,0.35)' },
]

const PEN_COLORS = ['#FF9933', '#ffffff', '#f87171', '#a3e635', '#60a5fa']

export default function BookReaderPage({ productId, onBack }) {
  const book = BOOK_CONTENT[productId]
  const [chapter, setChapter] = useState(0)
  const [page, setPage] = useState(0)
  const [fontSize, setFontSize] = useState(() => readingPrefs().fontSize || 17)
  const [lineHeight, setLineHeight] = useState(() => readingPrefs().lineHeight || 1.9)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tool, setTool] = useState(TOOLS.CURSOR)
  const [penColor, setPenColor] = useState(PEN_COLORS[0])
  const [penSize, setPenSize] = useState(3)
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value)
  const [annotations, setAnnotations] = useState({}) // { "ch-pg": [{type, path/range, color}] }
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState([])
  const [theme, setTheme] = useState(() => readingPrefs().theme || 'dark') // dark | sepia | light
  useEffect(() => { saveReadingPrefs({ fontSize, lineHeight, theme }) }, [fontSize, lineHeight, theme])

  const contentRef = useRef(null)
  const svgRef = useRef(null)
  const canvasKey = `${chapter}-${page}`

  // ── Anti-copy / Anti-screenshot / Anti-right-click ──
  useEffect(() => {
    const noContext = e => e.preventDefault()
    document.addEventListener('contextmenu', noContext)
    const noSelect = e => { if (tool !== TOOLS.CURSOR) e.preventDefault() }
    document.addEventListener('selectstart', noSelect)
    const noCopy = e => e.preventDefault()
    document.addEventListener('copy', noCopy)
    document.addEventListener('cut', noCopy)
    const noKeys = e => {
      if (e.key === 'PrintScreen') { e.preventDefault(); navigator.clipboard?.writeText('').catch(() => {}); return }
      if ((e.ctrlKey || e.metaKey) && ['p','s','a','c','u','shift+s'].includes(e.key.toLowerCase())) e.preventDefault()
      if (e.key === 'F12') e.preventDefault()
    }
    document.addEventListener('keydown', noKeys)
    const noDrag = e => e.preventDefault()
    document.addEventListener('dragstart', noDrag)
    return () => {
      document.removeEventListener('contextmenu', noContext)
      document.removeEventListener('selectstart', noSelect)
      document.removeEventListener('copy', noCopy)
      document.removeEventListener('cut', noCopy)
      document.removeEventListener('keydown', noKeys)
      document.removeEventListener('dragstart', noDrag)
    }
  }, [tool])

  if (!book) return (
    <div className={styles.error}>
      <p>Book content not available.</p>
      <button onClick={onBack}>← Back</button>
    </div>
  )

  const chap = book.chapters[chapter]
  const totalPages = chap.pages.length
  const pageText = chap.pages[page]

  // ── SVG Drawing ──
  const getSVGPoint = (e, svg) => {
    const rect = svg.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const handleMouseDown = (e) => {
    if (tool !== TOOLS.PEN && tool !== TOOLS.ERASER) return
    e.preventDefault()
    setIsDrawing(true)
    const pt = getSVGPoint(e, svgRef.current)
    setCurrentPath([pt])
  }

  const handleMouseMove = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const pt = getSVGPoint(e, svgRef.current)
    setCurrentPath(prev => [...prev, pt])
  }

  const handleMouseUp = () => {
    if (!isDrawing || currentPath.length < 2) { setIsDrawing(false); setCurrentPath([]); return }
    const annotation = tool === TOOLS.PEN
      ? { type: 'pen', path: currentPath, color: penColor, size: penSize }
      : { type: 'eraser', path: currentPath, size: penSize * 4 }
    setAnnotations(prev => ({
      ...prev,
      [canvasKey]: [...(prev[canvasKey] || []), annotation]
    }))
    setIsDrawing(false)
    setCurrentPath([])
  }

  const pathToD = (points) => {
    if (points.length < 2) return ''
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`
    return d
  }

  const clearAnnotations = () => setAnnotations(prev => ({ ...prev, [canvasKey]: [] }))

  const goToPage = (newPage, newChap) => {
    setPage(newPage)
    if (newChap !== undefined) setChapter(newChap)
    contentRef.current?.scrollTo(0, 0)
  }

  const prevPage = () => {
    if (page > 0) goToPage(page - 1)
    else if (chapter > 0) {
      const prevChap = chapter - 1
      goToPage(book.chapters[prevChap].pages.length - 1, prevChap)
    }
  }
  const nextPage = () => {
    if (page < totalPages - 1) goToPage(page + 1)
    else if (chapter < book.chapters.length - 1) goToPage(0, chapter + 1)
  }

  const isFirstPage = chapter === 0 && page === 0
  const isLastPage = chapter === book.chapters.length - 1 && page === totalPages - 1

  const themeClass = theme === 'sepia' ? styles.sepia : theme === 'light' ? styles.lightTheme : ''
  const cursorClass = tool === TOOLS.PEN ? styles.cursorPen : tool === TOOLS.HIGHLIGHTER ? styles.cursorHighlight : tool === TOOLS.ERASER ? styles.cursorEraser : ''

  return (
    <div className={`${styles.reader} ${themeClass}`}>
      {/* ── Sidebar ── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <div className={styles.sidebarHeader}>
          <button className={styles.backBtn} onClick={onBack}>← eBooks</button>
          <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(v => !v)} title="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        {sidebarOpen && <>
          <div className={styles.bookMeta}>
            <h2 className={styles.bookTitle}>{book.title}</h2>
            <p className={styles.bookAuthor}>by {book.author}</p>
          </div>

          <nav className={styles.chapNav}>
            {book.chapters.map((c, ci) => (
              <button
                key={ci}
                className={`${styles.chapBtn} ${ci === chapter ? styles.chapActive : ''}`}
                onClick={() => goToPage(0, ci)}
              >
                <span className={styles.chapNumBadge}>{c.chapterNum}</span>
                <div className={styles.chapInfo}>
                  <span className={styles.chapName}>{c.title}</span>
                  <span className={styles.chapPages}>{c.pages.length} pages</span>
                </div>
              </button>
            ))}
          </nav>

          <div className={styles.sidebarSettings}>
            <div className={styles.settingRow}>
              <span>Font Size</span>
              <div className={styles.fontBtns}>
                <button onClick={() => setFontSize(f => Math.max(13, f - 1))}>A−</button>
                <span>{fontSize}px</span>
                <button onClick={() => setFontSize(f => Math.min(26, f + 1))}>A+</button>
              </div>
            </div>
            <div className={styles.settingRow}>
              <span>Line Spacing</span>
              <div className={styles.themeBtns}>
                {[[1.6, 'Tight'], [1.9, 'Normal'], [2.25, 'Relaxed']].map(([v, label]) => (
                  <button key={v} className={lineHeight === v ? styles.themeActive : ''} onClick={() => setLineHeight(v)} style={{ width: 'auto', padding: '0 9px', fontSize: 11 }}>{label}</button>
                ))}
              </div>
            </div>
            <div className={styles.settingRow}>
              <span>Theme</span>
              <div className={styles.themeBtns}>
                <button className={theme === 'dark' ? styles.themeActive : ''} onClick={() => setTheme('dark')}>🌙</button>
                <button className={theme === 'sepia' ? styles.themeActive : ''} onClick={() => setTheme('sepia')}>📜</button>
                <button className={theme === 'light' ? styles.themeActive : ''} onClick={() => setTheme('light')}>☀️</button>
              </div>
            </div>
          </div>

          <div className={styles.secureNote}>🔒 Protected Content — No download, screenshot, or copy allowed.</div>
        </>}
      </aside>

      {/* ── Main ── */}
      <div className={styles.mainArea}>
        {/* Toolbar */}
        <header className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.chapBreadcrumb}>
              <span>{chap.chapterNum}</span>
              <span className={styles.breadcrumbSep}>/</span>
              <span>{chap.title}</span>
            </div>
          </div>
          <div className={styles.toolbarCenter}>
            <div className={styles.toolGroup}>
              <button className={`${styles.toolBtn} ${tool === TOOLS.CURSOR ? styles.toolActive : ''}`} onClick={() => setTool(TOOLS.CURSOR)} title="Cursor">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 0l16 12-7 1.5L9 22z"/></svg>
              </button>
              <button className={`${styles.toolBtn} ${tool === TOOLS.PEN ? styles.toolActive : ''}`} onClick={() => setTool(TOOLS.PEN)} title="Pen">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button className={`${styles.toolBtn} ${tool === TOOLS.HIGHLIGHTER ? styles.toolActive : ''}`} onClick={() => setTool(TOOLS.HIGHLIGHTER)} title="Highlighter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </button>
              <button className={`${styles.toolBtn} ${tool === TOOLS.ERASER ? styles.toolActive : ''}`} onClick={() => setTool(TOOLS.ERASER)} title="Eraser">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 20H7L3 16l14-14 6 6z"/></svg>
              </button>
            </div>

            {tool === TOOLS.PEN && (
              <div className={styles.colorGroup}>
                {PEN_COLORS.map(c => (
                  <button key={c} className={`${styles.colorDot} ${penColor === c ? styles.colorDotActive : ''}`}
                    style={{ background: c }} onClick={() => setPenColor(c)} />
                ))}
                <select className={styles.sizeSelect} value={penSize} onChange={e => setPenSize(Number(e.target.value))}>
                  <option value={1}>Thin</option>
                  <option value={3}>Medium</option>
                  <option value={6}>Thick</option>
                </select>
              </div>
            )}

            {tool === TOOLS.HIGHLIGHTER && (
              <div className={styles.colorGroup}>
                {HIGHLIGHT_COLORS.map(hc => (
                  <button key={hc.value} className={`${styles.colorDot} ${highlightColor === hc.value ? styles.colorDotActive : ''}`}
                    style={{ background: hc.value, border: '2px solid rgba(255,255,255,0.4)' }}
                    onClick={() => setHighlightColor(hc.value)} title={hc.name} />
                ))}
              </div>
            )}

            {(annotations[canvasKey]?.length > 0) && (
              <button className={styles.clearBtn} onClick={clearAnnotations} title="Clear annotations">✕ Clear</button>
            )}
          </div>
          <div className={styles.toolbarRight}>
            <span className={styles.pageIndicator}>
              {page + 1} / {totalPages}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className={`${styles.contentArea} ${cursorClass}`} ref={contentRef}>
          {/* Watermark */}
          <div className={styles.watermarkLayer} aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className={styles.watermark}>The Pagecraft · Protected</span>
            ))}
          </div>

          {/* Page */}
          <div className={styles.pageWrapper}>
            <div className={styles.pageContainer}>
              {/* SVG overlay for pen/eraser */}
              <svg
                ref={svgRef}
                className={styles.annotationSvg}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
              >
                {/* Previous strokes */}
                {(annotations[canvasKey] || []).map((ann, i) => (
                  ann.type === 'pen' ? (
                    <path key={i} d={pathToD(ann.path)} stroke={ann.color} strokeWidth={ann.size}
                      fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                  ) : (
                    <path key={i} d={pathToD(ann.path)} stroke="var(--bg)" strokeWidth={ann.size}
                      fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  )
                ))}
                {/* Current stroke */}
                {isDrawing && currentPath.length > 1 && (
                  tool === TOOLS.PEN
                    ? <path d={pathToD(currentPath)} stroke={penColor} strokeWidth={penSize}
                        fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                    : <path d={pathToD(currentPath)} stroke="var(--bg)" strokeWidth={penSize * 4}
                        fill="none" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>

              {/* Page content */}
              <article className={styles.article} style={{ fontSize, '--reader-lh': lineHeight, pointerEvents: tool === TOOLS.CURSOR ? 'auto' : 'none' }}>
                {page === 0 && (
                  <div className={styles.chapterHeader}>
                    <span className={styles.chapterLabel}>Chapter {chap.chapterNum}</span>
                    <h1 className={styles.chapTitle}>{chap.title}</h1>
                    <p className={styles.chapSummary}>{chap.summary}</p>
                    <div className={styles.divider} />
                  </div>
                )}
                {tool === TOOLS.HIGHLIGHTER ? (
                  <HighlightableText
                    text={pageText}
                    color={highlightColor}
                    annotationsKey={canvasKey}
                    annotations={annotations}
                    setAnnotations={setAnnotations}
                  />
                ) : (
                  pageText.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
                )}
              </article>
            </div>
          </div>

          {/* Page navigation */}
          <div className={styles.pageNav}>
            <button className={styles.navBtn} onClick={prevPage} disabled={isFirstPage}>← Previous</button>
            <div className={styles.pageDotsContainer}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} className={`${styles.pageDot} ${i === page ? styles.pageDotActive : ''}`}
                  onClick={() => goToPage(i)} />
              ))}
            </div>
            <button className={styles.navBtn} onClick={nextPage} disabled={isLastPage}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Highlighter text component ─────────────────────────────────────────────
function HighlightableText({ text, color, annotationsKey, annotations, setAnnotations }) {
  const handleMouseUp = () => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.toString().trim() === '') return
    const range = selection.getRangeAt(0)
    const selectedText = selection.toString()
    if (!selectedText.trim()) return
    const annotation = { type: 'highlight', text: selectedText, color }
    setAnnotations(prev => ({
      ...prev,
      [annotationsKey]: [...(prev[annotationsKey] || []), annotation]
    }))
    selection.removeAllRanges()
  }

  const highlights = (annotations[annotationsKey] || []).filter(a => a.type === 'highlight')
  let processedText = text

  return (
    <div className="highlightable" onMouseUp={handleMouseUp}>
      {text.split('\n\n').map((para, i) => {
        let parts = [{ type: 'text', content: para }]
        highlights.forEach(h => {
          parts = parts.flatMap(part => {
            if (part.type !== 'text') return [part]
            const idx = part.content.indexOf(h.text)
            if (idx === -1) return [part]
            return [
              { type: 'text', content: part.content.slice(0, idx) },
              { type: 'highlight', content: h.text, color: h.color },
              { type: 'text', content: part.content.slice(idx + h.text.length) },
            ]
          })
        })
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.type === 'highlight'
                ? <mark key={j} style={{ background: part.color, borderRadius: 3, padding: '1px 0' }}>{part.content}</mark>
                : <span key={j}>{part.content}</span>
            )}
          </p>
        )
      })}
    </div>
  )
}
