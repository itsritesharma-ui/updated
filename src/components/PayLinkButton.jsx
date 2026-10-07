// Per-book payment link (set in Admin > Books > "Payment link"). Renders nothing if the book has none.
export default function PayLinkButton({ product, large = false }) {
  if (!product?.paymentLink || product.status === 'coming_soon') return null
  return (
    <a
      href={product.paymentLink}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: 'linear-gradient(135deg,#FFB74D,#FF9933)', color: '#1a1308', fontWeight: 800,
        borderRadius: large ? 10 : 8, padding: large ? '12px 20px' : '8px 14px', fontSize: large ? 13 : 12,
        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
      }}
    >
      Buy Now ₹{product.price} ↗
    </a>
  )
}
