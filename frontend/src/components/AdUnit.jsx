import { useEffect, useRef } from 'react'

export default function AdUnit({ slot, format = 'auto', className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    try {
      if (ref.current && ref.current.dataset.adStatus) return
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {}
  }, [])

  return (
    <ins
      ref={ref}
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client="ca-pub-9358218806831110"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  )
}
