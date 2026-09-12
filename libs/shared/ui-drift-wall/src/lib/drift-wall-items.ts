export interface DriftWallItem {
  image: string;
  title?: string;
  href?: string;
}

const encodeSvg = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim().replace(/\s+/g, ' '))}`;

export const DEFAULT_ITEMS: DriftWallItem[] = [
  // 1. Analytics & Revenue Intelligence
  {
    title: 'Analytics Platform',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0c0d14"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#232538" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="74" y="12" width="120" height="12" rx="6" fill="#1e2033"/>
        <text x="82" y="21" fill="#71717a" font-family="sans-serif" font-size="8">invento.ai/analytics</text>
        <rect x="20" y="42" width="168" height="52" rx="8" fill="#141624" stroke="#272a42"/>
        <text x="32" y="60" fill="#a1a1aa" font-family="sans-serif" font-size="9" font-weight="500">Gross Revenue</text>
        <text x="32" y="82" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">$148,290</text>
        <rect x="124" y="68" width="52" height="18" rx="9" fill="#15803d" fill-opacity="0.2"/>
        <text x="133" y="80" fill="#4ade80" font-family="sans-serif" font-size="9" font-weight="600">+34.8%</text>
        <rect x="212" y="42" width="168" height="52" rx="8" fill="#141624" stroke="#272a42"/>
        <text x="224" y="60" fill="#a1a1aa" font-family="sans-serif" font-size="9" font-weight="500">Active Conversions</text>
        <text x="224" y="82" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">4,812</text>
        <rect x="316" y="68" width="52" height="18" rx="9" fill="#7c3aed" fill-opacity="0.2"/>
        <text x="326" y="80" fill="#c084fc" font-family="sans-serif" font-size="9" font-weight="600">+19.2%</text>
        <rect x="20" y="106" width="360" height="138" rx="10" fill="#131525" stroke="#262940"/>
        <path d="M36 210 Q 80 160, 130 180 T 220 140 T 310 160 T 364 120 L 364 228 L 36 228 Z" fill="url(#g1)" opacity="0.4"/>
        <path d="M36 210 Q 80 160, 130 180 T 220 140 T 310 160 T 364 120" stroke="#818cf8" stroke-width="2.5" fill="none"/>
        <circle cx="364" cy="120" r="4.5" fill="#a5b4fc" stroke="#6366f1" stroke-width="2"/>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#818cf8"/>
            <stop offset="100%" stop-color="#818cf8" stop-opacity="0"/>
          </linearGradient>
        </defs>
      </svg>
    `),
  },

  // 2. CRM & Customer Pipeline
  {
    title: 'CRM Platform',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0b0e14"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#202433" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="42" width="112" height="202" rx="8" fill="#121622" stroke="#252a3d"/>
        <text x="30" y="60" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="600">Qualified Leads (8)</text>
        <rect x="28" y="72" width="96" height="54" rx="6" fill="#181d2d" stroke="#333b54"/>
        <rect x="36" y="82" width="58" height="6" rx="3" fill="#cbd5e1"/>
        <rect x="36" y="94" width="40" height="5" rx="2.5" fill="#64748b"/>
        <circle cx="108" cy="112" r="8" fill="#3b82f6"/>
        <rect x="28" y="134" width="96" height="54" rx="6" fill="#181d2d" stroke="#333b54"/>
        <rect x="36" y="144" width="64" height="6" rx="3" fill="#cbd5e1"/>
        <circle cx="108" cy="174" r="8" fill="#8b5cf6"/>
        <rect x="144" y="42" width="112" height="202" rx="8" fill="#121622" stroke="#252a3d"/>
        <text x="154" y="60" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="600">Negotiation (5)</text>
        <rect x="152" y="72" width="96" height="64" rx="6" fill="#181d2d" stroke="#333b54"/>
        <rect x="160" y="82" width="68" height="6" rx="3" fill="#f8fafc"/>
        <rect x="160" y="94" width="48" height="12" rx="6" fill="#0284c7" fill-opacity="0.2"/>
        <text x="168" y="103" fill="#38bdf8" font-family="sans-serif" font-size="8">$42,000</text>
        <rect x="268" y="42" width="112" height="202" rx="8" fill="#121622" stroke="#252a3d"/>
        <text x="278" y="60" fill="#4ade80" font-family="sans-serif" font-size="10" font-weight="600">Closed Won (12)</text>
        <rect x="276" y="72" width="96" height="54" rx="6" fill="#142820" stroke="#1b4d36"/>
        <rect x="284" y="82" width="60" height="6" rx="3" fill="#86efac"/>
        <text x="284" y="104" fill="#22c55e" font-family="sans-serif" font-size="10" font-weight="700">+$125,000</text>
      </svg>
    `),
  },

  // 3. AI SaaS & Prompt Generation Studio
  {
    title: 'AI SaaS',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0d0d16"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#28223d" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="42" width="360" height="42" rx="10" fill="#161426" stroke="#4338ca"/>
        <circle cx="42" cy="63" r="10" fill="#6366f1"/>
        <path d="M42 58 L44 63 L49 63 L45 66 L47 71 L42 68 L37 71 L39 66 L35 63 L40 63 Z" fill="#ffffff"/>
        <text x="62" y="67" fill="#e0e7ff" font-family="sans-serif" font-size="10" font-weight="500">Design a modern streetwear brand with dark aesthetic...</text>
        <rect x="312" y="48" width="60" height="30" rx="8" fill="#4f46e5"/>
        <text x="325" y="67" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="600">Build</text>
        <rect x="20" y="98" width="172" height="146" rx="10" fill="#151324" stroke="#2d2847"/>
        <rect x="32" y="112" width="148" height="72" rx="6" fill="#1f1b38"/>
        <rect x="32" y="194" width="90" height="8" rx="4" fill="#a5b4fc"/>
        <rect x="32" y="208" width="50" height="6" rx="3" fill="#6366f1"/>
        <rect x="140" y="202" width="40" height="18" rx="5" fill="#7c3aed"/>
        <text x="148" y="215" fill="#ffffff" font-family="sans-serif" font-size="8" font-weight="600">$180</text>
        <rect x="208" y="98" width="172" height="146" rx="10" fill="#151324" stroke="#2d2847"/>
        <rect x="220" y="112" width="148" height="72" rx="6" fill="#1f1b38"/>
        <rect x="220" y="194" width="80" height="8" rx="4" fill="#a5b4fc"/>
        <rect x="220" y="208" width="44" height="6" rx="3" fill="#6366f1"/>
        <rect x="328" y="202" width="40" height="18" rx="5" fill="#7c3aed"/>
        <text x="336" y="215" fill="#ffffff" font-family="sans-serif" font-size="8" font-weight="600">$240</text>
      </svg>
    `),
  },

  // 4. Fintech Digital Banking & Card
  {
    title: 'Fintech Website',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#090d16"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#1e293b" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="210" height="126" rx="12" fill="url(#cardGrad)" stroke="#38bdf8" stroke-opacity="0.3"/>
        <circle cx="48" cy="72" r="12" fill="#38bdf8" fill-opacity="0.4"/>
        <circle cx="64" cy="72" r="12" fill="#818cf8" fill-opacity="0.4"/>
        <text x="36" y="116" fill="#e2e8f0" font-family="monospace" font-size="12" font-weight="600">•••• 9842</text>
        <text x="36" y="142" fill="#94a3b8" font-family="sans-serif" font-size="9">INVENTO BLACK</text>
        <text x="170" y="142" fill="#e2e8f0" font-family="sans-serif" font-size="9">12/28</text>
        <rect x="246" y="44" width="134" height="200" rx="10" fill="#111827" stroke="#1f2937"/>
        <text x="258" y="66" fill="#9ca3af" font-family="sans-serif" font-size="10" font-weight="600">Transactions</text>
        <rect x="256" y="80" width="114" height="34" rx="6" fill="#1f2937"/>
        <text x="264" y="96" fill="#e5e7eb" font-family="sans-serif" font-size="8">Stripe Payout</text>
        <text x="264" y="107" fill="#4ade80" font-family="sans-serif" font-size="8" font-weight="600">+$2,450.00</text>
        <rect x="256" y="122" width="114" height="34" rx="6" fill="#1f2937"/>
        <text x="264" y="138" fill="#e5e7eb" font-family="sans-serif" font-size="8">AWS Cloud</text>
        <text x="264" y="149" fill="#f87171" font-family="sans-serif" font-size="8" font-weight="600">-$184.20</text>
        <rect x="20" y="184" width="210" height="60" rx="10" fill="#111827" stroke="#1f2937"/>
        <text x="32" y="206" fill="#9ca3af" font-family="sans-serif" font-size="9">Total Balance</text>
        <text x="32" y="230" fill="#38bdf8" font-family="sans-serif" font-size="18" font-weight="700">$94,820.50</text>
        <defs>
          <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e1b4b"/>
          </linearGradient>
        </defs>
      </svg>
    `),
  },

  // 5. Restaurant & Dining Storefront
  {
    title: 'Restaurant Website',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#140f0c"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#36221a" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="42" width="360" height="88" rx="10" fill="#241712" stroke="#482d23"/>
        <circle cx="68" cy="86" r="28" fill="#d97706" fill-opacity="0.3"/>
        <text x="110" y="78" fill="#fed7aa" font-family="sans-serif" font-size="15" font-weight="700">Artisan Bistro & Bar</text>
        <text x="110" y="98" fill="#ea580c" font-family="sans-serif" font-size="10" font-weight="500">Farm-to-table cuisine crafted fresh daily</text>
        <rect x="20" y="142" width="112" height="102" rx="8" fill="#1c130f" stroke="#3b241b"/>
        <circle cx="76" cy="178" r="20" fill="#78350f"/>
        <text x="32" y="216" fill="#ffedd5" font-family="sans-serif" font-size="9" font-weight="600">Truffle Tagliatelle</text>
        <text x="32" y="232" fill="#f59e0b" font-family="sans-serif" font-size="10" font-weight="700">$34.00</text>
        <rect x="144" y="142" width="112" height="102" rx="8" fill="#1c130f" stroke="#3b241b"/>
        <circle cx="200" cy="178" r="20" fill="#78350f"/>
        <text x="156" y="216" fill="#ffedd5" font-family="sans-serif" font-size="9" font-weight="600">Wagyu Ribeye</text>
        <text x="156" y="232" fill="#f59e0b" font-family="sans-serif" font-size="10" font-weight="700">$68.00</text>
        <rect x="268" y="142" width="112" height="102" rx="8" fill="#1c130f" stroke="#3b241b"/>
        <circle cx="324" cy="178" r="20" fill="#78350f"/>
        <text x="280" y="216" fill="#ffedd5" font-family="sans-serif" font-size="9" font-weight="600">Yuzu Cheesecake</text>
        <text x="280" y="232" fill="#f59e0b" font-family="sans-serif" font-size="10" font-weight="700">$18.00</text>
      </svg>
    `),
  },

  // 6. Food Delivery Landing
  {
    title: 'Food Delivery',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0d1117"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#21262d" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="64" rx="10" fill="#161b22" stroke="#30363d"/>
        <rect x="34" y="60" width="32" height="32" rx="16" fill="#10b981"/>
        <text x="80" y="68" fill="#f0f6fc" font-family="sans-serif" font-size="12" font-weight="700">Order Dispatched</text>
        <text x="80" y="86" fill="#8b949e" font-family="sans-serif" font-size="9">Driver is arriving in 12 mins • Live GPS</text>
        <rect x="20" y="120" width="360" height="124" rx="10" fill="#161b22" stroke="#30363d"/>
        <path d="M40 210 Q 120 150, 200 180 T 360 140" stroke="#10b981" stroke-width="3" stroke-dasharray="6 4" fill="none"/>
        <circle cx="40" cy="210" r="6" fill="#3b82f6"/>
        <circle cx="260" cy="160" r="8" fill="#10b981"/>
        <circle cx="360" cy="140" r="6" fill="#ef4444"/>
      </svg>
    `),
  },

  // 7. Business Intelligence CRM
  {
    title: 'Business CRM',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0f111a"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#25293d" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="80" height="200" rx="8" fill="#161a29"/>
        <rect x="30" y="60" width="60" height="10" rx="5" fill="#3b82f6"/>
        <rect x="30" y="80" width="48" height="8" rx="4" fill="#334155"/>
        <rect x="30" y="98" width="52" height="8" rx="4" fill="#334155"/>
        <rect x="30" y="116" width="44" height="8" rx="4" fill="#334155"/>
        <rect x="114" y="44" width="266" height="48" rx="8" fill="#161a29" stroke="#282d45"/>
        <text x="128" y="72" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="600">Enterprise Accounts</text>
        <rect x="114" y="104" width="266" height="140" rx="8" fill="#161a29" stroke="#282d45"/>
        <rect x="126" y="120" width="242" height="24" rx="4" fill="#1f2438"/>
        <rect x="126" y="152" width="242" height="24" rx="4" fill="#1f2438"/>
        <rect x="126" y="184" width="242" height="24" rx="4" fill="#1f2438"/>
        <rect x="126" y="216" width="242" height="20" rx="4" fill="#1f2438"/>
      </svg>
    `),
  },

  // 8. E-Commerce Storefront
  {
    title: 'E-commerce Store',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#121217"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#2b2b36" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="42" width="172" height="202" rx="10" fill="#1a1a24" stroke="#36364a"/>
        <rect x="32" y="54" width="148" height="106" rx="8" fill="#272738"/>
        <circle cx="106" cy="107" r="32" fill="#6366f1" fill-opacity="0.2"/>
        <text x="32" y="182" fill="#f4f4f5" font-family="sans-serif" font-size="12" font-weight="700">AeroGlide Runner</text>
        <text x="32" y="200" fill="#71717a" font-family="sans-serif" font-size="9">Ultralight cushioning</text>
        <text x="32" y="226" fill="#a855f7" font-family="sans-serif" font-size="14" font-weight="700">$219</text>
        <rect x="208" y="42" width="172" height="202" rx="10" fill="#1a1a24" stroke="#36364a"/>
        <rect x="220" y="54" width="148" height="106" rx="8" fill="#272738"/>
        <circle cx="294" cy="107" r="32" fill="#ec4899" fill-opacity="0.2"/>
        <text x="220" y="182" fill="#f4f4f5" font-family="sans-serif" font-size="12" font-weight="700">Chronos Apex 44</text>
        <text x="220" y="200" fill="#71717a" font-family="sans-serif" font-size="9">Sapphire crystal face</text>
        <text x="220" y="226" fill="#ec4899" font-family="sans-serif" font-size="14" font-weight="700">$480</text>
      </svg>
    `),
  },

  // 9. SaaS Cloud Platform
  {
    title: 'SaaS Website',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0a0f1d"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#1e2d4d" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="42" width="360" height="74" rx="10" fill="#131c33" stroke="#25375c"/>
        <text x="36" y="70" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="600">INVENTO CLOUD RUNTIME</text>
        <text x="36" y="96" fill="#f0f9ff" font-family="sans-serif" font-size="16" font-weight="700">Global Edge Compute</text>
        <rect x="20" y="128" width="112" height="116" rx="8" fill="#111a30" stroke="#233559"/>
        <text x="30" y="152" fill="#94a3b8" font-family="sans-serif" font-size="9">Edge Regions</text>
        <text x="30" y="180" fill="#38bdf8" font-family="sans-serif" font-size="20" font-weight="700">320+</text>
        <rect x="144" y="128" width="112" height="116" rx="8" fill="#111a30" stroke="#233559"/>
        <text x="154" y="152" fill="#94a3b8" font-family="sans-serif" font-size="9">P99 Latency</text>
        <text x="154" y="180" fill="#4ade80" font-family="sans-serif" font-size="20" font-weight="700">12ms</text>
        <rect x="268" y="128" width="112" height="116" rx="8" fill="#111a30" stroke="#233559"/>
        <text x="278" y="152" fill="#94a3b8" font-family="sans-serif" font-size="9">Uptime SLA</text>
        <text x="278" y="180" fill="#a78bfa" font-family="sans-serif" font-size="20" font-weight="700">99.99%</text>
      </svg>
    `),
  },

  // 10. AI Neural Platform
  {
    title: 'AI Platform',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0d0e17"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#262842" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="200" rx="10" fill="#151726" stroke="#2e314f"/>
        <circle cx="200" cy="144" r="54" fill="#7c3aed" fill-opacity="0.15" stroke="#8b5cf6" stroke-width="2"/>
        <circle cx="200" cy="144" r="32" fill="#6366f1" fill-opacity="0.3"/>
        <circle cx="140" cy="94" r="6" fill="#38bdf8"/>
        <circle cx="260" cy="94" r="6" fill="#c084fc"/>
        <circle cx="140" cy="194" r="6" fill="#f43f5e"/>
        <circle cx="260" cy="194" r="6" fill="#4ade80"/>
        <line x1="140" y1="94" x2="200" y2="144" stroke="#6366f1" stroke-width="1.5"/>
        <line x1="260" y1="94" x2="200" y2="144" stroke="#8b5cf6" stroke-width="1.5"/>
        <line x1="140" y1="194" x2="200" y2="144" stroke="#ec4899" stroke-width="1.5"/>
        <line x1="260" y1="194" x2="200" y2="144" stroke="#22c55e" stroke-width="1.5"/>
        <text x="144" y="228" fill="#c4b5fd" font-family="sans-serif" font-size="10" font-weight="600">Deep Neural Inference</text>
      </svg>
    `),
  },

  // 11. Finance Platform
  {
    title: 'Finance Platform',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0b1313"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#183636" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="70" rx="10" fill="#122424" stroke="#1d4747"/>
        <text x="36" y="70" fill="#5eead4" font-family="sans-serif" font-size="11" font-weight="600">PORTFOLIO VALUATION</text>
        <text x="36" y="98" fill="#ffffff" font-family="sans-serif" font-size="20" font-weight="700">$1,420,890.00</text>
        <rect x="20" y="126" width="172" height="118" rx="8" fill="#122424" stroke="#1d4747"/>
        <text x="32" y="148" fill="#99f6e4" font-family="sans-serif" font-size="10" font-weight="600">Yield Farming APY</text>
        <text x="32" y="180" fill="#2dd4bf" font-family="sans-serif" font-size="22" font-weight="700">18.4%</text>
        <rect x="208" y="126" width="172" height="118" rx="8" fill="#122424" stroke="#1d4747"/>
        <text x="220" y="148" fill="#99f6e4" font-family="sans-serif" font-size="10" font-weight="600">Treasury Staked</text>
        <text x="220" y="180" fill="#2dd4bf" font-family="sans-serif" font-size="22" font-weight="700">$840,000</text>
      </svg>
    `),
  },

  // 12. Fintech Product Checkout
  {
    title: 'Fintech Product',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#11131c"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#252b3d" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="50" y="44" width="300" height="200" rx="10" fill="#181c2b" stroke="#363e59"/>
        <rect x="74" y="66" width="120" height="10" rx="5" fill="#cbd5e1"/>
        <rect x="74" y="90" width="252" height="34" rx="6" fill="#242a3d"/>
        <text x="86" y="111" fill="#94a3b8" font-family="sans-serif" font-size="10">john.doe@company.com</text>
        <rect x="74" y="136" width="252" height="34" rx="6" fill="#242a3d"/>
        <text x="86" y="157" fill="#94a3b8" font-family="sans-serif" font-size="10">4242 •••• •••• 4242</text>
        <rect x="74" y="184" width="252" height="36" rx="8" fill="#6366f1"/>
        <text x="174" y="206" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="700">Pay $380.00</text>
      </svg>
    `),
  },

  // 13. AI Product Generator
  {
    title: 'AI Product',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0f0c17"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#2c1d3d" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="172" height="96" rx="8" fill="#1b1429" stroke="#3d2b5c"/>
        <rect x="208" y="44" width="172" height="96" rx="8" fill="#1b1429" stroke="#3d2b5c"/>
        <rect x="20" y="148" width="172" height="96" rx="8" fill="#1b1429" stroke="#3d2b5c"/>
        <rect x="208" y="148" width="172" height="96" rx="8" fill="#1b1429" stroke="#3d2b5c"/>
        <circle cx="106" cy="92" r="24" fill="#a855f7" fill-opacity="0.3"/>
        <circle cx="294" cy="92" r="24" fill="#ec4899" fill-opacity="0.3"/>
        <circle cx="106" cy="196" r="24" fill="#3b82f6" fill-opacity="0.3"/>
        <circle cx="294" cy="196" r="24" fill="#10b981" fill-opacity="0.3"/>
      </svg>
    `),
  },

  // 14. Payment Gateway Platform
  {
    title: 'Payment Platform',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0c111a"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#1f2d42" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="200" rx="10" fill="#111926" stroke="#25354e"/>
        <text x="36" y="74" fill="#38bdf8" font-family="monospace" font-size="11">invento.checkout.init({</text>
        <text x="56" y="98" fill="#e2e8f0" font-family="monospace" font-size="11">amount: 24900,</text>
        <text x="56" y="122" fill="#e2e8f0" font-family="monospace" font-size="11">currency: 'USD',</text>
        <text x="56" y="146" fill="#e2e8f0" font-family="monospace" font-size="11">customer: 'cus_8942',</text>
        <text x="56" y="170" fill="#4ade80" font-family="monospace" font-size="11">ai_fraud_protection: true</text>
        <text x="36" y="194" fill="#38bdf8" font-family="monospace" font-size="11">});</text>
        <rect x="36" y="208" width="112" height="24" rx="6" fill="#0284c7"/>
        <text x="48" y="224" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="600">200 OK • 18ms</text>
      </svg>
    `),
  },

  // 15. Food & Bakery
  {
    title: 'Food & Dining',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#17120e"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#3d2a1f" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="200" rx="10" fill="#241a14" stroke="#4a3427"/>
        <circle cx="80" cy="144" r="44" fill="#f59e0b" fill-opacity="0.25"/>
        <text x="144" y="112" fill="#fef3c7" font-family="sans-serif" font-size="16" font-weight="700">Artisan Roast Coffee</text>
        <text x="144" y="136" fill="#d97706" font-family="sans-serif" font-size="11">Single origin Ethiopian Yirgacheffe</text>
        <rect x="144" y="160" width="84" height="28" rx="6" fill="#d97706"/>
        <text x="156" y="178" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="700">$22.50</text>
      </svg>
    `),
  },

  // 16. Financial Analytics Pro
  {
    title: 'Financial Analytics',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0c1214"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#1d343b" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="200" rx="10" fill="#132024" stroke="#25434d"/>
        <rect x="44" y="150" width="28" height="74" rx="4" fill="#06b6d4"/>
        <rect x="94" y="120" width="28" height="104" rx="4" fill="#06b6d4"/>
        <rect x="144" y="170" width="28" height="54" rx="4" fill="#0891b2"/>
        <rect x="194" y="90" width="28" height="134" rx="4" fill="#22d3ee"/>
        <rect x="244" y="130" width="28" height="94" rx="4" fill="#06b6d4"/>
        <rect x="294" y="70" width="28" height="154" rx="4" fill="#38bdf8"/>
        <rect x="344" y="50" width="28" height="174" rx="4" fill="#4ade80"/>
      </svg>
    `),
  },

  // 17. Business Intelligence Command Center
  {
    title: 'Business Intelligence',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#111019"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#2b263d" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="172" height="94" rx="8" fill="#181624" stroke="#36304d"/>
        <text x="32" y="66" fill="#a1a1aa" font-family="sans-serif" font-size="9">ARR</text>
        <text x="32" y="92" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">$2.4M</text>
        <rect x="208" y="44" width="172" height="94" rx="8" fill="#181624" stroke="#36304d"/>
        <text x="220" y="66" fill="#a1a1aa" font-family="sans-serif" font-size="9">MRR Growth</text>
        <text x="220" y="92" fill="#4ade80" font-family="sans-serif" font-size="16" font-weight="700">+42.6%</text>
        <rect x="20" y="150" width="172" height="94" rx="8" fill="#181624" stroke="#36304d"/>
        <text x="32" y="172" fill="#a1a1aa" font-family="sans-serif" font-size="9">Net Retention</text>
        <text x="32" y="198" fill="#818cf8" font-family="sans-serif" font-size="16" font-weight="700">138%</text>
        <rect x="208" y="150" width="172" height="94" rx="8" fill="#181624" stroke="#36304d"/>
        <text x="220" y="172" fill="#a1a1aa" font-family="sans-serif" font-size="9">Churn Rate</text>
        <text x="220" y="198" fill="#f43f5e" font-family="sans-serif" font-size="16" font-weight="700">0.42%</text>
      </svg>
    `),
  },

  // 18. Modern Fashion Shopping Platform
  {
    title: 'Shopping Platform',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0f0f12"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#26262e" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="200" rx="10" fill="#17171c" stroke="#33333d"/>
        <rect x="36" y="60" width="140" height="168" rx="8" fill="#22222a"/>
        <circle cx="106" cy="120" r="36" fill="#a855f7" fill-opacity="0.2"/>
        <text x="196" y="86" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">Cyber Oversized Hoodie</text>
        <text x="196" y="108" fill="#a1a1aa" font-family="sans-serif" font-size="10">Heavyweight 480 GSM Cotton</text>
        <text x="196" y="148" fill="#a855f7" font-family="sans-serif" font-size="18" font-weight="700">$160.00</text>
        <rect x="196" y="174" width="140" height="36" rx="8" fill="#7c3aed"/>
        <text x="236" y="196" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="700">Add to Cart</text>
      </svg>
    `),
  },

  // 19. Express Logistics Delivery
  {
    title: 'Food Delivery',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0d1414"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#203838" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="200" rx="10" fill="#142424" stroke="#2b4747"/>
        <circle cx="70" cy="100" r="24" fill="#10b981" fill-opacity="0.3"/>
        <circle cx="330" cy="180" r="24" fill="#06b6d4" fill-opacity="0.3"/>
        <path d="M70 100 C 150 50, 240 230, 330 180" stroke="#10b981" stroke-width="3" stroke-dasharray="8 6" fill="none"/>
        <circle cx="200" cy="140" r="10" fill="#f59e0b"/>
        <text x="144" y="210" fill="#ecfdf5" font-family="sans-serif" font-size="12" font-weight="600">On Schedule • 99.4% On-Time</text>
      </svg>
    `),
  },

  // 20. Product Design Showcase
  {
    title: 'Product Website',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#140f1a"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#382247" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="200" rx="10" fill="#1f1629" stroke="#472b5c"/>
        <circle cx="200" cy="120" r="48" fill="#d946ef" fill-opacity="0.25"/>
        <text x="134" y="196" fill="#fdf4ff" font-family="sans-serif" font-size="14" font-weight="700">Studio Pro Sound</text>
        <text x="148" y="216" fill="#e879f9" font-family="sans-serif" font-size="10">Active Noise Cancelling</text>
      </svg>
    `),
  },

  // 21. Neo-Banking Digital Card
  {
    title: 'Digital Banking',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0a1017"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#193047" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="30" y="44" width="340" height="200" rx="12" fill="#102033" stroke="#22456e"/>
        <text x="54" y="80" fill="#67e8f9" font-family="sans-serif" font-size="12" font-weight="600">INVENTO VAULT</text>
        <text x="54" y="112" fill="#ffffff" font-family="sans-serif" font-size="24" font-weight="700">$348,200.00</text>
        <rect x="54" y="140" width="100" height="32" rx="8" fill="#0284c7"/>
        <text x="74" y="160" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="600">Transfer</text>
        <rect x="166" y="140" width="100" height="32" rx="8" fill="#1e293b"/>
        <text x="194" y="160" fill="#94a3b8" font-family="sans-serif" font-size="10" font-weight="600">Invest</text>
      </svg>
    `),
  },

  // 22. AI Automated Logistics
  {
    title: 'Automation Platform',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0d1017"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#212c40" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="100" height="60" rx="8" fill="#172236" stroke="#2d436b"/>
        <text x="32" y="78" fill="#93c5fd" font-family="sans-serif" font-size="9" font-weight="600">Webhook Received</text>
        <rect x="150" y="44" width="100" height="60" rx="8" fill="#172236" stroke="#2d436b"/>
        <text x="162" y="78" fill="#c084fc" font-family="sans-serif" font-size="9" font-weight="600">Generate Store</text>
        <rect x="280" y="44" width="100" height="60" rx="8" fill="#172236" stroke="#2d436b"/>
        <text x="292" y="78" fill="#4ade80" font-family="sans-serif" font-size="9" font-weight="600">Deploy CDN</text>
        <line x1="120" y1="74" x2="150" y2="74" stroke="#60a5fa" stroke-width="2"/>
        <line x1="250" y1="74" x2="280" y2="74" stroke="#c084fc" stroke-width="2"/>
        <rect x="20" y="126" width="360" height="118" rx="8" fill="#141c2d" stroke="#273959"/>
        <text x="36" y="160" fill="#e2e8f0" font-family="monospace" font-size="10">> Execution complete in 240ms</text>
        <text x="36" y="184" fill="#4ade80" font-family="monospace" font-size="10">> 0 errors, 100% test coverage verified</text>
      </svg>
    `),
  },

  // 23. Mobile Wallet & Quick Pay
  {
    title: 'Finance App',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0c1017"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#202a3d" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="120" y="44" width="160" height="200" rx="18" fill="#151e2e" stroke="#2f4163"/>
        <circle cx="200" cy="110" r="28" fill="#3b82f6" fill-opacity="0.3"/>
        <text x="146" y="164" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="700">Quick Transfer</text>
        <text x="156" y="182" fill="#93c5fd" font-family="sans-serif" font-size="10">Tap to Pay NFC</text>
        <rect x="140" y="198" width="120" height="28" rx="8" fill="#2563eb"/>
        <text x="174" y="216" fill="#ffffff" font-family="sans-serif" font-size="9" font-weight="600">Confirm</text>
      </svg>
    `),
  },

  // 24. Sales Management Studio
  {
    title: 'Sales Management',
    image: encodeSvg(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 264" fill="none">
        <rect width="400" height="264" rx="14" fill="#0f0f18"/>
        <rect x="1" y="1" width="398" height="262" rx="13" stroke="#2c2c42" stroke-width="1.5"/>
        <circle cx="22" cy="18" r="4.5" fill="#f43f5e" opacity="0.8"/>
        <circle cx="36" cy="18" r="4.5" fill="#eab308" opacity="0.8"/>
        <circle cx="50" cy="18" r="4.5" fill="#22c55e" opacity="0.8"/>
        <rect x="20" y="44" width="360" height="70" rx="8" fill="#191929" stroke="#373757"/>
        <text x="36" y="70" fill="#a5b4fc" font-family="sans-serif" font-size="10" font-weight="600">INVENTO SALES PIPELINE</text>
        <text x="36" y="96" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="700">Q3 Targets Reached: 142%</text>
        <rect x="20" y="126" width="360" height="118" rx="8" fill="#191929" stroke="#373757"/>
        <rect x="36" y="146" width="328" height="16" rx="8" fill="#26263d"/>
        <rect x="36" y="146" width="248" height="16" rx="8" fill="#818cf8"/>
        <text x="36" y="190" fill="#e0e7ff" font-family="sans-serif" font-size="11">Automated fulfillment running across 14 stores</text>
      </svg>
    `),
  },
];
