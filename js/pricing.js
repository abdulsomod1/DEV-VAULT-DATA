// Renders pricing cards on index.html from data_plans table.
// Requires authenticated access? We keep data_plans selectable for authenticated.
// If unauthenticated, show empty state with skeleton.

// Using dynamic import so the file can be parsed even if browser is still loading as classic script.
let supabase;

async function ensureSupabase(){
  if (supabase) return supabase;
  const m = await import('./supabaseClient.js');
  supabase = m.supabase;
  return supabase;
}




document.addEventListener('DOMContentLoaded', async () => {
  const root = document.querySelector('#pricingContainer');
  const tabs = Array.from(document.querySelectorAll('.tabBtn[data-network]'));

  if (!root || !tabs.length) return;

  const networkLabel = {
    MTN: 'MTN',
    AIRTEL: 'Airtel',
    GLO: 'GLO'
  };

  const placeholders = [1,2,3].map(i => ({
    size_gb: 0,
    duration_days: 0,
    price: 0,
    popular: false,
    id: i
  }));

  function fmtNaira(n) {
    try {
      return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(n));
    } catch { return `₦${Number(n)}`; }
  }

  function phoneToPlanGrid(plans) {
    // plans are size_gb/duration_days combos; just render as cards
    return plans;
  }

  function setLoading(on) {
    if (on) {
      root.innerHTML = `
        ${placeholders.map(p => `
          <div class="card" style="min-height: 220px">
            <div class="skeleton skeleton--line" style="width: 60%"></div>
            <div class="skeleton skeleton--line" style="width: 90%"></div>
            <div class="divider"></div>
            <div class="skeleton skeleton--line" style="width: 55%"></div>
            <div class="skeleton skeleton--line" style="width: 70%"></div>
          </div>
        `).join('')}
      `;
    } else {
      // no-op
    }
  }

  function makePlanCard(plan) {
    const network = plan.network;
    const size = plan.size_gb;
    const dur = plan.duration_days;
    const durationLabel = dur === 7 ? '7 Days' : `${dur} Days`;

    const popularBadge = plan.popular ? `<span class="popBadge">Popular</span>` : '';

    // IMPORTANT: buy action later in js/app.js; keep button for now.
    return `
      <div class="card glass">
        <div class="pricingCardTop">
          <div style="display:flex; gap:12px; align-items:flex-start">
            <div class="networkLogo" title="${network}">${network.slice(0,1)}</div>
            <div>
              <div style="font-weight:950; letter-spacing:-.02em;">${networkLabel[network]} ${size}GB</div>
              <div style="color: var(--muted); font-size:13px; margin-top:4px">${durationLabel}</div>
            </div>
          </div>
          ${popularBadge}
        </div>

        <div class="divider"></div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:12px">
          <div>
            <div style="font-size:30px; font-weight:1000">${fmtNaira(plan.price)}</div>
            <div style="color: var(--muted); font-size:12px; margin-top:2px">Valid for ${durationLabel}</div>
          </div>
          <button class="btn btn--small btn--primary" type="button" data-buy-network="${network}" data-buy-size="${size}" data-buy-duration="${dur}" data-buy-plan-id="${plan.id}">Buy</button>
        </div>
      </div>
    `;
  }

  async function load(network) {
    setLoading(true);
    try {
      // Prefer authenticated listing.
      const { data: plans, error } = await supabase
        .from('data_plans')
        .select('id,network,size_gb,duration_days,price,popular')
        .eq('network', network)
        .in('size_gb', [1,2,3,5,10,15,20])
        .order('size_gb', { ascending: true });

      if (error) throw error;
      if (!plans || !plans.length) {
        const diag = window.__SUPABASE_DIAGNOSTICS__;
        const hasEnv = !!(diag && diag.hasUrl && diag.hasAnonKey);
        const envHint = hasEnv
          ? ''
          : `<div style="margin-top:8px; color: var(--muted)">Supabase env missing (SUPABASE_URL / SUPABASE_ANON_KEY). Pricing will not load.</div>`;

        root.innerHTML = `
          <div class="emptyState">No plans found in Supabase yet. Add rows to <strong>data_plans</strong>.</div>
          ${envHint}
        `;
        return;
      }



      // Group ordering: show 1GB 7/30 first style not required.
      const grouped = plans.sort((a,b) => a.size_gb - b.size_gb || a.duration_days - b.duration_days);
      root.innerHTML = `<div class="plansGrid">${grouped.map(makePlanCard).join('')}</div>`;

    } catch (e) {
      root.innerHTML = `<div class="emptyState">Unable to load pricing. Check Supabase env keys + RLS policy for data_plans.</div>`;
      console.error(e);
    }
  }

  function setActive(network) {
    tabs.forEach(t => t.classList.toggle('is-active', t.dataset.network === network));
  }

  tabs.forEach(t => {
    t.addEventListener('click', () => {
      const network = t.dataset.network;
      setActive(network);
      load(network);
    });
  });

  // initial
  const initial = tabs.find(t => t.classList.contains('is-active'))?.dataset.network || 'MTN';
  load(initial);
});



