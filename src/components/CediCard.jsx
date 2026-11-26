import { useState } from 'react';

export default function CediCard({ holderName, formattedBalance, last4 = '1234' }) {
  const [flipped, setFlipped] = useState(false);
  const toggle = () => setFlipped((f) => !f);

  return (
    <div
      className="cedi-flip"
      role="button"
      tabIndex={0}
      aria-label="Cedi card, tap to flip"
      onClick={toggle}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle()}
    >
      <div className={`cedi-flip-inner ${flipped ? 'is-flipped' : ''}`}>
        {/* FRONT */}
        <div className="cedi-face cedi-front">
          <div className="cedi-row">
            <div className="cedi-chip" />
            <span className="cedi-brand">CEDI CARD</span>
            <svg className="cedi-logo" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z" />
              <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z" />
              <path fill="#ff3d00" d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48C20.376,15.05,18,19.245,18,24z" />
            </svg>
          </div>

          <div className="cedi-number-row">
            <span className="cedi-number">•••• •••• •••• {last4}</span>
            <svg className="cedi-nfc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M8 6c3 3.5 3 8.5 0 12" />
              <path d="M12 4c4.5 5 4.5 11 0 16" />
              <path d="M16 2c6 6.5 6 13.5 0 20" />
            </svg>
          </div>

          <div className="cedi-row cedi-bottom">
            <div>
              <div className="cedi-label">CARD HOLDER</div>
              <div className="cedi-name">{holderName}</div>
            </div>
            <div className="cedi-balance-wrap">
              <div className="cedi-label">BALANCE</div>
              <div className="cedi-balance">{formattedBalance}</div>
            </div>
          </div>
        </div>

        {/* BACK */}
       <div className="cedi-face cedi-back">
  {/* magnetic strip */}
  <div style={{ position: 'absolute', top: '9%', left: 0, right: 0, height: '16%', background: 'repeating-linear-gradient(45deg, #3d3d3d, #3d3d3d 10px, #262626 10px, #262626 20px)' }} />
  {/* signature strip */}
  <div style={{ position: 'absolute', top: '36%', left: '5%', width: '55%', height: '12%', background: '#fff', borderRadius: 3 }} />
  {/* security code */}
  <div style={{ position: 'absolute', top: '36%', left: '66%', width: '28%', height: '12%', background: '#fff', color: '#000', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>***</div>
  {/* footer text */}
  <p style={{ position: 'absolute', bottom: '8%', left: '5%', right: '5%', margin: 0, textAlign: 'left', fontSize: '2.6cqw', opacity: 0.6 }}>
    Cedi Tracker • For personal use only
  </p>
</div>
      </div>
    </div>
  );
}