import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos de uso",
  description: "Condiciones de uso de GlowSuite CRM: registro, planes, propiedad intelectual y política de no afiliación con empresas de venta directa.",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.glowsuitecrm.com/terminos",
  },
}

export default function TerminosPage() {
  return (
    <div className="landing-page">
      <nav>
        <a href="/" className="nav-logo">
          <img src="/logo.svg" alt="GlowSuite CRM" height="32" />
        </a>
        <a href="/" className="btn-nav">← Volver al inicio</a>
      </nav>

      <section style={{ paddingTop: "140px", paddingBottom: "48px" }}>
        <div className="section-inner">
          <div className="section-label">Legal</div>
          <h1 className="section-title">Términos de Uso</h1>
          <p className="section-sub">
            Última actualización: abril 2026. Al usar GlowSuite CRM aceptas estos términos en su totalidad.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: "0", paddingBottom: "100px", background: "var(--bg-alt)" }}>
        <div className="section-inner" style={{ maxWidth: "760px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

            {[
              {
                num: "00",
                title: "Independencia y no afiliación",
                content: (
                  <>
                    <p>GlowSuite CRM es un software de gestión de negocio independiente. No estamos afiliados, asociados, autorizados, patrocinados ni respaldados por Mary Kay Inc., Yanbal International, Avon Products, Natura &amp;Co, Herbalife Ltd. ni por ninguna otra empresa de venta directa o multinivel.</p>
                    <p style={{ marginTop: "12px" }}>El uso de nombres de marcas de terceros en esta plataforma tiene únicamente fines descriptivos e identificativos (nominative fair use). GlowSuite CRM no reclama ninguna asociación oficial con dichas marcas.</p>
                    <p style={{ marginTop: "12px" }}>El contrato comercial entre el usuario y su empresa de venta directa es responsabilidad exclusiva del usuario. GlowSuite CRM no asume responsabilidad por el cumplimiento o incumplimiento de dicho contrato.</p>
                  </>
                ),
              },
              {
                num: "01",
                title: "Objeto del servicio",
                content: (
                  <>
                    <p>GlowSuite CRM es una plataforma de gestión comercial diseñada para vendedoras independientes en la República Dominicana. Permite administrar clientes, registrar ventas, gestionar cobros y automatizar seguimientos post-venta.</p>
                    <p style={{ marginTop: "12px" }}>El servicio se presta a través de la plataforma web accesible en <strong>glowsuitecrm.com</strong>.</p>
                  </>
                ),
              },
              {
                num: "02",
                title: "Aceptación de los términos",
                content: (
                  <p>Al registrarte o usar GlowSuite CRM, confirmas que has leído, comprendido y aceptas estos Términos de Uso. Si no estás de acuerdo, debes abstenerte de usar la plataforma. El uso continuado del servicio después de cualquier modificación implica la aceptación de los nuevos términos.</p>
                ),
              },
              {
                num: "03",
                title: "Registro y cuenta de usuario",
                content: (
                  <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "20px" }}>
                    <li>Debes proporcionar información veraz, completa y actualizada al registrarte.</li>
                    <li>Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades realizadas desde tu cuenta.</li>
                    <li>Está prohibido compartir credenciales de acceso con terceros no autorizados.</li>
                    <li>Si sospechas que tu cuenta ha sido comprometida, debes notificarnos de inmediato a <strong>hola@glowsuitecrm.com</strong>.</li>
                    <li>Cada cuenta corresponde a una persona o negocio individual.</li>
                  </ul>
                ),
              },
              {
                num: "04",
                title: "Uso aceptable",
                content: (
                  <>
                    <p>Queda estrictamente prohibido usar GlowSuite CRM para:</p>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "20px", marginTop: "12px" }}>
                      <li>Actividades ilícitas o contrarias a las leyes dominicanas.</li>
                      <li>Distribuir spam, malware o contenido fraudulento.</li>
                      <li>Suplantar la identidad de terceros.</li>
                      <li>Intentar acceder sin autorización a sistemas, datos o cuentas ajenas.</li>
                      <li>Realizar ingeniería inversa o modificar el código de la plataforma.</li>
                      <li>Revender o sublicenciar el acceso a la plataforma sin autorización expresa.</li>
                    </ul>
                  </>
                ),
              },
              {
                num: "05",
                title: "Propiedad intelectual",
                content: (
                  <p>Todo el contenido de GlowSuite CRM — incluyendo diseño, código, textos, logotipos y funcionalidades — es propiedad exclusiva de GlowSuite CRM y está protegido por las leyes dominicanas e internacionales de propiedad intelectual. Queda prohibida su reproducción o distribución sin autorización escrita. Los datos ingresados por el usuario (clientes, ventas, etc.) son de su propiedad y no serán utilizados con fines ajenos al servicio.</p>
                ),
              },
              {
                num: "06",
                title: "Planes y pagos",
                content: (
                  <>
                    <p>GlowSuite CRM ofrece distintos planes de suscripción (Free, Basic, Pro). Los planes de pago se facturan mensualmente según las tarifas vigentes. La asignación de planes es gestionada por el operador.</p>
                    <p style={{ marginTop: "12px" }}>GlowSuite CRM se reserva el derecho de modificar los precios con previo aviso de 30 días.</p>
                  </>
                ),
              },
              {
                num: "07",
                title: "Suspensión y terminación",
                content: (
                  <p>GlowSuite CRM puede suspender o cancelar tu cuenta si viola estos términos, sin previo aviso y sin responsabilidad. Puedes solicitar la cancelación de tu cuenta en cualquier momento escribiendo a <strong>hola@glowsuitecrm.com</strong>. Tras la cancelación, tus datos serán conservados por 30 días antes de ser eliminados definitivamente, salvo obligación legal en contrario.</p>
                ),
              },
              {
                num: "08",
                title: "Suscripciones y reembolsos",
                content: (
                  <>
                    <p>GlowSuite CRM ofrece un período de prueba gratuito de 30 días antes del primer cobro. Durante ese período puedes cancelar en cualquier momento sin costo alguno.</p>
                    <p style={{ marginTop: "12px" }}>Una vez iniciado el primer cobro de un plan de pago (Basic o Pro), ofrecemos reembolso completo si lo solicitas dentro de los 7 días calendario siguientes a esa primera transacción. Pasado ese plazo, los pagos realizados no son reembolsables. La cancelación de una suscripción activa detiene futuros cobros pero no genera reembolso proporcional del período en curso.</p>
                    <p style={{ marginTop: "12px" }}>Para solicitar un reembolso escríbenos a <strong>hola@glowsuitecrm.com</strong>.</p>
                  </>
                ),
              },
              {
                num: "09",
                title: "Limitación de responsabilidad",
                content: (
                  <p>GlowSuite CRM se provee "tal cual" y "según disponibilidad". No garantizamos disponibilidad ininterrumpida ni ausencia de errores. En ningún caso seremos responsables por daños indirectos, pérdida de ganancias o pérdida de datos derivados del uso o la imposibilidad de uso de la plataforma, en la medida permitida por la ley dominicana.</p>
                ),
              },
              {
                num: "10",
                title: "Ley aplicable y jurisdicción",
                content: (
                  <p>Estos términos se rigen por las leyes de la República Dominicana, incluyendo la <strong>Ley 126-02</strong> sobre Comercio Electrónico, Documentos y Firmas Digitales y la <strong>Ley 53-07</strong> sobre Crímenes y Delitos de Alta Tecnología. Para cualquier controversia, las partes se someten a la jurisdicción de los tribunales competentes de Santo Domingo, República Dominicana.</p>
                ),
              },
              {
                num: "11",
                title: "Contacto",
                content: (
                  <p>Para consultas sobre estos términos: <strong>hola@glowsuitecrm.com</strong></p>
                ),
              },
            ].map(({ num, title, content }) => (
              <div
                key={num}
                style={{
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "28px 32px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                  <span style={{
                    fontSize: "0.75rem", fontWeight: 700,
                    color: "var(--pink)", background: "var(--pink-light)",
                    borderRadius: "100px", padding: "4px 12px",
                    letterSpacing: "0.05em",
                  }}>
                    Art. {num}
                  </span>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)" }}>{title}</h2>
                </div>
                <div style={{ fontSize: "0.92rem", color: "var(--text-muted)", lineHeight: 1.75 }}>
                  {content}
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      <footer>
        <div className="footer-logo">
          <img src="/logo.svg" alt="GlowSuite CRM" height="24" />
        </div>
        <div className="footer-links">
          <a href="/terminos">Términos</a>
          <a href="/privacidad">Privacidad</a>
          <a href="/ayuda">Ayuda</a>
        </div>
        <div className="footer-copy">© 2026 GlowSuite CRM</div>
      </footer>
    </div>
  )
}
