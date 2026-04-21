"use client"

import { useEffect } from "react"

const PORTAL_URL = "/login"
const REGISTER_URL = "/register"

export default function LandingPage() {
  useEffect(() => {
    const slides = document.querySelectorAll<HTMLElement>(".screen-slide")
    const tabs = document.querySelectorAll<HTMLElement>(".browser-tab")
    const urlBar = document.getElementById("browser-url-bar")

    function showSlide(idx: number) {
      slides.forEach((s, i) => s.classList.toggle("active", i === idx))
      tabs.forEach((t, i) => t.classList.toggle("active", i === idx))
      if (urlBar && slides[idx]) {
        urlBar.textContent = (slides[idx] as HTMLElement).dataset.url || ""
      }
    }

    tabs.forEach((tab, i) => tab.addEventListener("click", () => showSlide(i)))

    let autoIdx = 0
    const interval = setInterval(() => {
      autoIdx = (autoIdx + 1) % slides.length
      showSlide(autoIdx)
    }, 3000)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible")
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12 }
    )

    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el))

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [])

  return (
    <div className="landing-page">
      {/* NAV */}
      <nav>
        <div className="nav-logo">
          <img src="/logo.svg" alt="GlowSuite CRM" height="36" />
        </div>
        <div className="nav-links">
          <a href="#problema">El problema</a>
          <a href="#features">Funciones</a>
          <a href="#como">Cómo funciona</a>
          <a href="#precios">Precios</a>
        </div>
        <a href={PORTAL_URL} className="btn-nav">
          Entrar a GlowSuite CRM
        </a>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-badge">CRM para consultoras de belleza independientes</div>
            <h1>
              Tu negocio organizado,
              <br />
              <em>en un solo lugar.</em>
            </h1>
            <p className="hero-sub">
              GlowSuite CRM elimina el caos de manejar tu consultora desde mil maneras distintas. Seguimientos,
              cobros y clientas — todo en un solo lugar, sin complicaciones.
            </p>
            <div className="hero-actions">
              <a href={PORTAL_URL} className="btn-primary">
                Entrar a GlowSuite CRM
              </a>
              <a href="#como" className="btn-ghost">
                Ver cómo funciona
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div>
              <div className="browser-wrap">
                <div className="browser-bar">
                  <div className="browser-dots">
                    <div className="browser-dot" style={{ background: "#FF5F57" }} />
                    <div className="browser-dot" style={{ background: "#FFBD2E" }} />
                    <div className="browser-dot" style={{ background: "#28C840" }} />
                  </div>
                  <div className="browser-url" id="browser-url-bar">
                    glowsuitecrm.com/dashboard
                  </div>
                </div>
                <div className="browser-screen">
                  <div className="screen-slide active" data-url="glowsuitecrm.com/dashboard">
                    <img src="/screenshots/dashboard.png" alt="Dashboard" />
                  </div>
                  <div className="screen-slide" data-url="glowsuitecrm.com/ventas">
                    <img src="/screenshots/ventas.png" alt="Ventas" />
                  </div>
                  <div className="screen-slide" data-url="glowsuitecrm.com/metricas">
                    <img src="/screenshots/metricas.png" alt="Métricas" />
                  </div>
                  <div className="screen-slide" data-url="glowsuitecrm.com/seguimientos">
                    <img src="/screenshots/seguimientos.png" alt="Seguimientos" />
                  </div>
                  <div className="screen-slide" data-url="glowsuitecrm.com/clientes">
                    <img src="/screenshots/perfil-clienta.png" alt="Perfil clienta" />
                  </div>
                </div>
              </div>
              <div className="browser-tabs">
                <div className="browser-tab active" data-slide="0">Dashboard</div>
                <div className="browser-tab" data-slide="1">Ventas</div>
                <div className="browser-tab" data-slide="2">Métricas</div>
                <div className="browser-tab" data-slide="3">Seguimientos</div>
                <div className="browser-tab" data-slide="4">Clientas</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <section className="problema" id="problema">
        <div className="section-inner">
          <div className="section-label fade-up">El problema real</div>
          <h2 className="section-title fade-up fade-up-delay-1">
            Antes de GlowSuite CRM,
            <br />
            ¿cómo manejabas todo esto?
          </h2>
          <div className="problema-grid">
            <div className="problema-list">
              <div className="problema-item fade-up">
                <div className="problema-icon">📋</div>
                <div>
                  <h4>Clientes regadas en libretas y WhatsApp</h4>
                  <p>
                    Nombres en un papel, números en otro chat, historiales perdidos. Nunca sabes
                    quién compró qué ni cuándo.
                  </p>
                </div>
              </div>
              <div className="problema-item fade-up fade-up-delay-1">
                <div className="problema-icon">⏰</div>
                <div>
                  <h4>Olvidas a quién dar seguimiento</h4>
                  <p>
                    Tienes intención de escribirle, pero el día pasa y la clienta potencial también. El
                    olvido te cuesta ventas todos los días.
                  </p>
                </div>
              </div>
              <div className="problema-item fade-up fade-up-delay-2">
                <div className="problema-icon">💸</div>
                <div>
                  <h4>No sabes quién te debe dinero</h4>
                  <p>
                    Cobros mezclados, montos que no recuerdas, y la incomodidad de perseguir a cada
                    una manualmente por días.
                  </p>
                </div>
              </div>
            </div>
            <div className="problema-after fade-up fade-up-delay-1">
              <h3>Con GlowSuite CRM, todo cambia</h3>
              {[
                "Todas tus clientas en un solo lugar, con su historial completo",
                "El sistema te dice exactamente a quién contactar hoy",
                "Cobros pendientes visibles de un vistazo, con mensaje ya listo",
                "Si sabes usar WhatsApp, sabes usar GlowSuite CRM",
                "Accede desde cualquier dispositivo, sin instalar nada",
              ].map((text) => (
                <div className="after-item" key={text}>
                  <div className="after-check">
                    <svg viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="section-inner">
          <div className="section-label fade-up">Lo que hace GlowSuite CRM</div>
          <h2 className="section-title fade-up fade-up-delay-1">
            Cinco herramientas.
            <br />
            Un solo lugar.
          </h2>
          <p className="section-sub fade-up fade-up-delay-2">
            Todo lo que necesitas para manejar tu consultora sin caos, sin libretas, y sin perder ni
            una venta.
          </p>
          <div className="features-grid">
            <div className="feature-card fade-up">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              <h3>Sistema 2+2+2 de seguimientos</h3>
              <p>
                Nunca más olvides a quién contactar. El sistema te recuerda automáticamente a los 2
                días, 2 semanas y 2 meses después de cada venta.
              </p>
            </div>
            <div className="feature-card fade-up fade-up-delay-1">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <h3>Cobros pendientes al instante</h3>
              <p>
                Ves exactamente quién te debe, cuánto, y desde hace cuántos días — con el mensaje de
                cobro ya redactado y listo para enviar.
              </p>
            </div>
            <div className="feature-card fade-up fade-up-delay-2">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </div>
              <h3>Gestión de clientas</h3>
              <p>
                Prospectos separadas de clientas activas. Historial completo de cada una —
                productos, compras, conversaciones pasadas.
              </p>
            </div>
            <div className="feature-card fade-up fade-up-delay-1">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <path d="M8 21h8M12 17v4" />
                </svg>
              </div>
              <h3>Todo desde un solo lugar</h3>
              <p>
                Una plataforma web que funciona desde cualquier dispositivo. Sin instalar nada, sin
                configuraciones complicadas. Abre el navegador y empieza.
              </p>
            </div>
            <div className="feature-card fade-up fade-up-delay-2">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>Adiós al caos disperso</h3>
              <p>
                Todo lo que antes estaba en libretas, papelitos, Excel y chats de WhatsApp —
                centralizado, ordenado y siempre a mano.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="como" id="como">
        <div className="section-inner">
          <div className="section-label fade-up">Así de simple</div>
          <h2 className="section-title fade-up fade-up-delay-1">
            Empiezas en minutos,
            <br />
            no en horas.
          </h2>
          <p className="section-sub fade-up fade-up-delay-2">
            Si sabes usar WhatsApp, sabes usar GlowSuite CRM. Sin tutoriales largos. Sin curva de
            aprendizaje.
          </p>
          <div className="steps">
            <div className="step fade-up">
              <div className="step-num">1</div>
              <h3>Crea tu cuenta</h3>
              <p>
                Entra al portal, regístrate con tu correo en menos de 2 minutos. Sin tarjeta de
                crédito para empezar.
              </p>
            </div>
            <div className="step fade-up fade-up-delay-1">
              <div className="step-num">2</div>
              <h3>Agrega tus clientas</h3>
              <p>
                Copia los contactos que ya tienes en tu cel o WhatsApp. Toma menos de lo que crees
                organizar lo que ya tienes.
              </p>
            </div>
            <div className="step fade-up fade-up-delay-2">
              <div className="step-num">3</div>
              <h3>El sistema trabaja por ti</h3>
              <p>
                Cada día, GlowSuite CRM te dice a quién escribirle, qué cobrar y cómo va tu negocio. Tú
                solo das el siguiente paso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EQUIPO */}
      <section id="equipo">
        <div className="section-inner" style={{ textAlign: "center" }}>
          <div className="section-label fade-up">El equipo</div>
          <h2 className="section-title fade-up fade-up-delay-1" style={{ margin: "0 auto" }}>
            Construido por emprendedores,
            <br />
            para emprendedoras.
          </h2>
          <p
            className="section-sub fade-up fade-up-delay-2"
            style={{ margin: "14px auto 56px" }}
          >
            Las personas detrás de GlowSuite CRM entienden el negocio porque lo viven.
          </p>
          <div className="equipo-grid">
            {[
              { photo: "/screenshots/angel-brito.jpg", name: "Angel Brito", role: "CEO & Fundador" },
              { photo: "/screenshots/luisa-ramirez.jpg", name: "Luisa Ramírez", role: "Co-fundadora & Embajadora Comercial" },
              { photo: "/screenshots/esmeiry-carmona.PNG", name: "Esmeiry Carmona", role: "Directora de Operaciones" },
            ].map((member) => (
              <div
                className="feature-card fade-up"
                key={member.name}
                style={{ textAlign: "center", padding: "32px 24px" }}
              >
                <img
                  src={member.photo}
                  alt={member.name}
                  className="equipo-avatar"
                  style={{ objectFit: "cover" }}
                />
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>
                  {member.name}
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  {member.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios">
        <div className="section-inner">
          <div className="section-label fade-up">Planes</div>
          <h2 className="section-title fade-up fade-up-delay-1">
            Transparente desde el principio.
          </h2>
          <p className="section-sub fade-up fade-up-delay-2">
            Elige el plan que va con tu momento. Sin contratos. Cancelas cuando quieras.
          </p>
          <div className="precios-grid">
            {/* Free */}
            <div className="precio-card fade-up">
              <div className="precio-plan">Free</div>
              <div className="precio-amount">
                <span className="precio-currency">$</span>0
              </div>
              <div className="precio-sub">/ mes · RD$0</div>
              <div className="precio-divider" />
              <div className="precio-features">
                <div className="precio-feature">Dashboard básico</div>
                <div className="precio-feature">Hasta 20 clientes</div>
                <div className="precio-feature">Ventas (pago completo)</div>
                <div className="precio-feature">Seguimientos 2+2+2</div>
                <div className="precio-feature precio-feature-disabled">Sin crédito</div>
                <div className="precio-feature precio-feature-disabled">Sin métricas</div>
                <div className="precio-feature precio-feature-disabled">Sin cuentas x cobrar</div>
              </div>
              <a href={REGISTER_URL} className="btn-precio btn-precio-outline">
                Empezar gratis
              </a>
            </div>
            {/* Basic */}
            <div className="precio-card featured fade-up fade-up-delay-1">
              <div className="popular-badge">Más popular</div>
              <div className="precio-plan">Basic</div>
              <div className="precio-amount">
                <span className="precio-currency">$</span>9
              </div>
              <div className="precio-sub">/ mes · ≈ RD$540/mes</div>
              <div className="precio-divider" />
              <div className="precio-features">
                <div className="precio-feature">Todo lo de Free</div>
                <div className="precio-feature">Clientes ilimitados</div>
                <div className="precio-feature">Ventas a crédito</div>
                <div className="precio-feature">Cuentas por cobrar</div>
                <div className="precio-feature">Dashboard completo + metas</div>
                <div className="precio-feature">Reporte de ganancias</div>
                <div className="precio-feature precio-feature-disabled">Sin métricas avanzadas</div>
              </div>
              <span className="btn-precio btn-precio-white" style={{ opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" }}>
                Disponible próximamente
              </span>
            </div>
            {/* Pro */}
            <div className="precio-card fade-up fade-up-delay-2">
              <div className="precio-plan">Pro</div>
              <div className="precio-amount">
                <span className="precio-currency">$</span>19
              </div>
              <div className="precio-sub">/ mes · ≈ RD$1,140/mes</div>
              <div className="precio-divider" />
              <div className="precio-features">
                <div className="precio-feature">Todo lo de Basic</div>
                <div className="precio-feature">Métricas avanzadas</div>
                <div className="precio-feature">WhatsApp masivo</div>
                <div className="precio-feature">Link de registro</div>
                <div className="precio-feature">Agenda</div>
                <div className="precio-feature" style={{ opacity: 0.55, fontStyle: "italic" }}>
                  Próximamente
                </div>
              </div>
              <span className="btn-precio btn-precio-outline" style={{ opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" }}>
                Disponible próximamente
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-final">
        <h2 className="fade-up">
          Tu negocio merece
          <br />
          un sistema que trabaje contigo.
        </h2>
        <p className="fade-up fade-up-delay-1">
          Empieza gratis hoy. Sin complicaciones, sin tarjeta de crédito, sin tiempo que perder.
        </p>
        <a href={PORTAL_URL} className="btn-primary fade-up fade-up-delay-2">
          Entrar a GlowSuite
        </a>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">
          <img src="/logo.svg" alt="GlowSuite CRM" height="28" />
        </div>
        <div className="footer-copy">© 2026 GlowSuite CRM · Hecho con ♥ para consultoras de RD</div>
      </footer>
    </div>
  )
}
