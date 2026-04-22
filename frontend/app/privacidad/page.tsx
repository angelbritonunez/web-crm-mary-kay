import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de privacidad",
  robots: { index: false },
}

export default function PrivacidadPage() {
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
          <h1 className="section-title">Política de Privacidad</h1>
          <p className="section-sub">
            Última actualización: abril 2026. Tu privacidad es importante para nosotros. Esta política explica qué datos recopilamos y cómo los usamos, de conformidad con la <strong>Ley 172-13</strong> de la República Dominicana.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: "0", paddingBottom: "100px", background: "var(--bg-alt)" }}>
        <div className="section-inner" style={{ maxWidth: "760px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

            {[
              {
                icon: "🔒",
                title: "Datos y terceros",
                content: (
                  <>
                    <p>GlowSuite CRM almacena únicamente los datos que el usuario ingresa voluntariamente en la plataforma (nombres de clientes, montos de ventas, notas de seguimiento, etc.).</p>
                    <p style={{ marginTop: "12px" }}>No compartimos, vendemos ni transmitimos datos de usuarios a empresas de venta directa (Mary Kay, Yanbal, Avon u otras) ni a ningún tercero no indicado en esta política.</p>
                    <p style={{ marginTop: "12px" }}>Los datos ingresados en GlowSuite CRM son propiedad del usuario y no tienen ninguna relación contractual con las empresas de venta directa que el usuario represente.</p>
                  </>
                ),
              },
              {
                icon: "🏢",
                title: "¿Quién es el responsable?",
                content: (
                  <p>GlowSuite CRM es el responsable del tratamiento de tus datos personales. Para ejercer tus derechos o realizar consultas, puedes contactarnos en <strong>hola@glowsuitecrm.com</strong>.</p>
                ),
              },
              {
                icon: "📋",
                title: "¿Qué datos recopilamos?",
                content: (
                  <>
                    <p><strong>Datos de cuenta:</strong></p>
                    <ul style={{ paddingLeft: "20px", margin: "8px 0 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li>Nombre y apellido</li>
                      <li>Dirección de correo electrónico</li>
                      <li>Número de teléfono</li>
                    </ul>
                    <p><strong>Datos de negocio que tú ingresas:</strong></p>
                    <ul style={{ paddingLeft: "20px", margin: "8px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <li>Información de tus clientes (nombre, teléfono, tipo de piel)</li>
                      <li>Historial de ventas y pagos</li>
                      <li>Seguimientos programados</li>
                    </ul>
                    <p style={{ marginTop: "12px" }}>No recopilamos datos de tarjetas de crédito ni información financiera personal.</p>
                  </>
                ),
              },
              {
                icon: "🎯",
                title: "¿Para qué usamos tus datos?",
                content: (
                  <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <li>Proveer y mejorar el servicio de GlowSuite CRM.</li>
                    <li>Enviarte notificaciones relacionadas con tu cuenta y el servicio.</li>
                    <li>Garantizar la seguridad e integridad de la plataforma.</li>
                    <li>Cumplir con obligaciones legales aplicables.</li>
                  </ul>
                ),
              },
              {
                icon: "⚖️",
                title: "Base legal (Ley 172-13)",
                content: (
                  <p>El tratamiento de tus datos se basa en la <strong>Ley 172-13 sobre Protección de la Persona frente al Tratamiento de sus Datos Personales</strong> de la República Dominicana. Tratamos tus datos con tu consentimiento expreso al registrarte y/o por necesidad contractual para prestarte el servicio.</p>
                ),
              },
              {
                icon: "🔐",
                title: "Tus derechos (ARCO)",
                content: (
                  <>
                    <p>Conforme a la Ley 172-13, tienes los siguientes derechos sobre tus datos personales:</p>
                    <ul style={{ paddingLeft: "20px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <li><strong>Acceso:</strong> Solicitar qué datos personales tenemos sobre ti.</li>
                      <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos.</li>
                      <li><strong>Cancelación:</strong> Solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
                      <li><strong>Oposición:</strong> Oponerte al tratamiento de tus datos en ciertos supuestos.</li>
                    </ul>
                    <p style={{ marginTop: "12px" }}>Para ejercer cualquiera de estos derechos, escríbenos a <strong>hola@glowsuitecrm.com</strong> con el asunto "Derechos ARCO". Responderemos en un plazo máximo de 15 días hábiles.</p>
                  </>
                ),
              },
              {
                icon: "🛡️",
                title: "Seguridad de los datos",
                content: (
                  <p>Utilizamos medidas técnicas y organizativas adecuadas para proteger tus datos: cifrado en tránsito (HTTPS/TLS), cifrado en reposo a través de Supabase, y acceso restringido por roles. Ningún sistema es 100% invulnerable, pero tomamos la seguridad de tus datos muy en serio.</p>
                ),
              },
              {
                icon: "🍪",
                title: "Uso de cookies",
                content: (
                  <p>Utilizamos únicamente cookies de sesión esenciales para mantener tu autenticación activa mientras usas la plataforma. No usamos cookies de rastreo, publicidad ni analítica de terceros.</p>
                ),
              },
              {
                icon: "🤝",
                title: "¿Compartimos tus datos?",
                content: (
                  <>
                    <p>No vendemos ni cedemos tus datos personales a terceros con fines comerciales. Podemos compartir datos únicamente con:</p>
                    <ul style={{ paddingLeft: "20px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <li><strong>Supabase</strong> — proveedor de infraestructura y base de datos (alojado bajo estándares internacionales de seguridad).</li>
                      <li><strong>Autoridades competentes</strong> — cuando sea requerido por ley o resolución judicial.</li>
                    </ul>
                  </>
                ),
              },
              {
                icon: "📝",
                title: "Cambios a esta política",
                content: (
                  <p>Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos los cambios significativos por correo electrónico o mediante un aviso en la plataforma. El uso continuo del servicio tras la notificación implica la aceptación de los cambios.</p>
                ),
              },
              {
                icon: "✉️",
                title: "Contacto",
                content: (
                  <p>Para consultas sobre privacidad o para ejercer tus derechos: <strong>hola@glowsuitecrm.com</strong></p>
                ),
              },
            ].map(({ icon, title, content }) => (
              <div
                key={title}
                style={{
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "28px 32px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <span style={{
                    width: "36px", height: "36px", flexShrink: 0,
                    background: "var(--pink-light)", borderRadius: "10px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem",
                  }}>
                    {icon}
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
