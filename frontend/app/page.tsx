import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Pill, ShoppingCart, Package, Store, Network, Brain, BarChart3, Menu, X, ChevronRight, Star, ArrowUpRight, CheckCircle, TrendingUp, Users, ClipboardList } from "lucide-react";

const features = [
  { icon: ShoppingCart, title: "Caisse intelligente", desc: "Point de vente rapide avec scan code-barres et gestion des remises" },
  { icon: Package, title: "Gestion des stocks", desc: "Inventaire, alertes rupture, mouvements et réapprovisionnement" },
  { icon: Store, title: "Boutique en ligne", desc: "Vendez en ligne avec votre propre URL et gérez les commandes" },
  { icon: Network, title: "Réseau inter-pharmacies", desc: "Trouvez des médicaments chez vos confrères en temps réel" },
  { icon: Brain, title: "Assistant IA", desc: "PharmIA, votre assistant pharmacie intelligent powered by Claude" },
  { icon: BarChart3, title: "Rapports & Analyses", desc: "Tableaux de bord, export PDF/CSV et analytics avancés" },
];

const plans = [
  {
    name: "Gratuit", price: "0 FCFA", period: "/mois",
    desc: "Fonctionnalités de base",
    features: ["Caisse intelligente", "Gestion stocks de base", "Rapports simples", "Support email"],
    cta: "Commencer gratuitement", href: "/register", popular: false,
  },
  {
    name: "Pro", price: "29 900 FCFA", period: "/mois",
    desc: "Tout + IA + boutique en ligne",
    features: ["Tout du plan Gratuit", "Assistant IA PharmIA", "Boutique en ligne", "Réseau inter-pharmacies", "Export PDF/CSV", "Support prioritaire"],
    cta: "Essayer 14 jours gratuit", href: "/register", popular: true,
  },
  {
    name: "Enterprise", price: "Sur devis", period: "",
    desc: "Personnalisé + API",
    features: ["Tout du plan Pro", "API dédiée", "Hébergement privé", "Formation équipe", "SLA garanti", "Support 24/7"],
    cta: "Contactez-nous", href: "mailto:layedevops@gmail.com", popular: false,
  },
];

const testimonials = [
  { name: "Dr. Fatou Diallo", role: "Pharmacienne, Dakar", initial: "FD", text: "PharmaCloud a révolutionné ma pharmacie. La caisse et les stocks sont maintenant gérés en un clic." },
  { name: "Mamadou Ndiaye", role: "Propriétaire, Thiès", initial: "MN", text: "Le réseau inter-pharmacies nous sauve quand un médicament manque. Indispensable !" },
  { name: "Aïssatou Ba", role: "Pharmacienne, Saint-Louis", initial: "AB", text: "L'assistant IA répond aux questions des clients même en dehors des heures d'ouverture." },
];

function AnimatedCounter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || counted.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const duration = 2000, steps = 60;
        const increment = end / steps;
        let current = 0;
        const timer = setInterval(() => { current += increment; if (current >= end) { setCount(end); clearInterval(timer); } else setCount(Math.floor(current)); }, duration / steps);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const scrollTo = (id: string) => { setMobileMenu(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pharma-600 to-pharma-400 text-white shadow-lg">
              <Pill size={18} />
            </div>
            <span className="text-lg font-bold text-gray-900">PharmaCloud</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollTo("features")} className="text-sm font-medium text-gray-600 transition hover:text-pharma-600">Fonctionnalités</button>
            <button onClick={() => scrollTo("stats")} className="text-sm font-medium text-gray-600 transition hover:text-pharma-600">Statistiques</button>
            <button onClick={() => scrollTo("pricing")} className="text-sm font-medium text-gray-600 transition hover:text-pharma-600">Tarifs</button>
            <Link href="/login" className="text-sm font-medium text-gray-600 transition hover:text-pharma-600">Connexion</Link>
            <Link href="/register" className="rounded-xl bg-pharma-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-pharma-700 hover:shadow-lg hover:shadow-pharma-600/25">Commencer</Link>
          </nav>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 md:hidden" aria-label="Menu">
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenu && (
          <div className="border-t border-gray-100 bg-white px-4 py-6 md:hidden">
            <div className="flex flex-col gap-4">
              <button onClick={() => scrollTo("features")} className="text-sm font-medium text-gray-600">Fonctionnalités</button>
              <button onClick={() => scrollTo("stats")} className="text-sm font-medium text-gray-600">Statistiques</button>
              <button onClick={() => scrollTo("pricing")} className="text-sm font-medium text-gray-600">Tarifs</button>
              <Link href="/login" className="text-sm font-medium text-gray-600">Connexion</Link>
              <Link href="/register" className="rounded-xl bg-pharma-600 px-5 py-2.5 text-center text-sm font-semibold text-white">Commencer</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-0 sm:pt-32">
        <div className="absolute inset-0 bg-gradient-to-br from-pharma-600 via-pharma-500 to-cyan-500 opacity-5" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-pharma-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-pharma-50 px-4 py-1.5 text-sm font-medium text-pharma-700">
              <Star size={14} className="fill-pharma-500 text-pharma-500" />
              +100 pharmacies nous font confiance
            </div>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pharma-600 to-pharma-400 text-white shadow-2xl shadow-pharma-600/30 animate-pulse">
              <Pill size={28} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              PharmaCloud{" "}
              <span className="bg-gradient-to-r from-pharma-600 to-cyan-500 bg-clip-text text-transparent">— L&apos;ERP Intelligent</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl">pour les Pharmacies Africaines</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Gérez votre pharmacie en toute simplicité : vente, stock, commandes, réseau inter-pharmacies et IA
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="group inline-flex items-center gap-2 rounded-xl bg-pharma-600 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-pharma-700 hover:shadow-xl hover:shadow-pharma-600/30">
                Commencer gratuitement <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <button onClick={() => scrollTo("features")} className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-8 py-3.5 text-base font-semibold text-gray-700 transition-all hover:border-pharma-600 hover:text-pharma-600">
                Voir la démo <ArrowUpRight size={18} />
              </button>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto rounded-md bg-white px-4 py-1 text-xs text-gray-400 shadow-sm border">PharmaCloud — Caisse</div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-6">
                <div className="col-span-2 space-y-4">
                  <div className="flex gap-3">
                    <div className="h-10 flex-1 rounded-lg bg-gray-100" />
                    <div className="h-10 w-24 rounded-lg bg-gray-100" />
                  </div>
                  <div className="space-y-2">
                    {[80, 60, 70, 45].map((w, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                        <div className="h-3 w-3 rounded-full bg-pharma-200" />
                        <div className="h-3 flex-1 rounded bg-gray-200" style={{ width: `${w}%` }} />
                        <div className="h-3 w-16 rounded bg-gray-200" />
                        <div className="h-6 w-12 rounded bg-pharma-100" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="h-4 w-20 rounded bg-gray-200 mx-auto" />
                  <div className="space-y-2">
                    {[60, 80, 40].map((w, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-3 w-16 rounded bg-gray-200" />
                        <div className="h-3 w-12 rounded bg-gray-200" />
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="h-4 w-24 rounded bg-pharma-200 mx-auto" />
                  </div>
                  <div className="h-10 rounded-lg bg-gradient-to-r from-pharma-500 to-pharma-600" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-8 text-sm text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Interface intuitive</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Temps réel</span>
              <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> Multi-appareils</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full bg-pharma-50 px-4 py-1.5 text-sm font-medium text-pharma-700">Fonctionnalités</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">Tout ce qu&apos;il faut pour votre pharmacie</h2>
            <p className="mt-4 text-lg text-gray-600">Une solution complète pour digitaliser et optimiser votre officine</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:border-pharma-100 hover:shadow-xl hover:shadow-pharma-600/5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pharma-50 to-pharma-100 text-pharma-600 transition-colors group-hover:from-pharma-500 group-hover:to-pharma-600 group-hover:text-white">
                  <f.icon size={22} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="rounded-full bg-pharma-50 px-4 py-1.5 text-sm font-medium text-pharma-700">Application mobile</span>
              <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">Gérez votre pharmacie <br/>où que vous soyez</h2>
              <p className="mt-4 text-lg text-gray-600">Accédez à toutes les fonctionnalités depuis votre smartphone ou tablette. Suivez vos ventes, stocks et commandes en temps réel.</p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: TrendingUp, label: "Ventes en direct", color: "text-green-600 bg-green-100" },
                  { icon: Package, label: "Alertes stock", color: "text-amber-600 bg-amber-100" },
                  { icon: Users, label: "Gestion équipe", color: "text-blue-600 bg-blue-100" },
                  { icon: ClipboardList, label: "Rapports", color: "text-violet-600 bg-violet-100" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
                    <div className={`${s.color} rounded-lg p-2`}><s.icon size={18} /></div>
                    <span className="text-sm font-medium text-gray-900">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-72">
              <div className="rounded-[2rem] border-4 border-gray-800 bg-white p-3 shadow-2xl">
                <div className="rounded-2xl bg-gradient-to-br from-pharma-50 to-pharma-100 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-5 rounded-full bg-pharma-500" />
                    <div className="text-xs font-semibold text-pharma-700">PharmaCloud</div>
                    <div className="h-5 w-5 rounded-full bg-gray-200" />
                  </div>
                  <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
                    <div className="text-xs text-gray-400">Ventes du jour</div>
                    <div className="text-xl font-bold text-gray-900">245 500 FCFA</div>
                    <div className="mt-1 flex gap-1">
                      {[30, 55, 40, 70, 45, 60].map((h, i) => (
                        <div key={i} className="h-8 flex-1 rounded-sm bg-gradient-to-t from-pharma-500 to-pharma-300" style={{ height: `${h}%`, marginTop: `${100 - h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm">
                        <div className="h-6 w-6 rounded-full bg-pharma-200" />
                        <div className="flex-1">
                          <div className="h-2 w-20 rounded bg-gray-200" />
                          <div className="mt-1 h-2 w-12 rounded bg-gray-100" />
                        </div>
                        <div className="text-xs font-medium text-pharma-600">12 500</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="bg-gradient-to-br from-pharma-600 via-pharma-500 to-cyan-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: 100, suffix: "+", label: "Pharmacies", sub: "et en pleine croissance" },
              { value: 10000, suffix: "+", label: "Produits", sub: "référencés sur la plateforme" },
              { value: 999, suffix: "%", label: "Uptime", sub: "disponibilité garantie" },
              { value: 4, suffix: " pays", label: "Sénégal & Afrique", sub: "présence continentale" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-bold text-white sm:text-5xl">
                  {s.suffix === "%" || s.suffix === "+" ? <><AnimatedCounter end={s.value} />{s.suffix}</> : <><AnimatedCounter end={s.value} suffix={s.suffix} /></>}
                </div>
                <div className="mt-2 text-lg font-semibold text-white/90">{s.label}</div>
                <div className="mt-1 text-sm text-pharma-200">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Ce que disent les pharmaciens</h2>
            <p className="mt-4 text-lg text-gray-600">Ils utilisent PharmaCloud au quotidien</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pharma-500 to-pharma-600 text-sm font-bold text-white">{t.initial}</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full bg-pharma-50 px-4 py-1.5 text-sm font-medium text-pharma-700">Tarifs</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">Des tarifs adaptés à votre taille</h2>
            <p className="mt-4 text-lg text-gray-600">Du petit pharmacien au réseau national</p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border-2 p-8 transition-all hover:-translate-y-1 ${
                plan.popular ? "border-pharma-500 bg-white shadow-2xl shadow-pharma-600/10" : "border-gray-100 bg-white shadow-sm hover:shadow-lg"
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pharma-600 to-cyan-500 px-4 py-1 text-xs font-semibold text-white shadow-lg">
                    Le plus populaire
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm text-gray-500">{plan.period}</span>}
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-pharma-100 text-pharma-600">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                  plan.popular ? "bg-pharma-600 text-white hover:bg-pharma-700 hover:shadow-xl hover:shadow-pharma-600/25" : "border-2 border-gray-200 text-gray-700 hover:border-pharma-600 hover:text-pharma-600"
                }`}>
                  {plan.cta} <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pharma-600 via-pharma-500 to-cyan-600 px-8 py-16 text-center sm:px-16">
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <h2 className="relative text-3xl font-bold text-white sm:text-4xl">Prêt à digitaliser votre pharmacie ?</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-pharma-100">Rejoignez +100 pharmaciens qui utilisent déjà PharmaCloud au quotidien</p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-pharma-700 transition-all hover:bg-pharma-50 hover:shadow-xl">
                Commencer gratuitement <ChevronRight size={18} />
              </Link>
              <Link href="mailto:layedevops@gmail.com" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10">
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-pharma-600 to-pharma-400 text-white shadow-lg">
            <Pill size={22} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Développé par Abdoulaye Sow</h3>
          <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2"><span>📞 +221 77 662 14 10 / +221 70 837 21 27</span></div>
            <div className="flex items-center gap-2">
              <span>📧</span>
              <a href="mailto:layedevops@gmail.com" className="text-pharma-600 hover:underline">layedevops@gmail.com</a>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link href="/login" className="hover:text-pharma-600">Connexion</Link>
            <span>·</span>
            <Link href="/register" className="hover:text-pharma-600">Inscription</Link>
          </div>
          <div className="mt-6 border-t border-gray-200 pt-6 text-xs text-gray-400">
            © 2026 PharmaCloud. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
