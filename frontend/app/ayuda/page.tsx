const faqs = [
  {
    category: "Primeros pasos",
    items: [
      {
        q: "¿Cómo registro a una clienta?",
        a: "Ve a Clientes → botón \"+ Nueva clienta\". Completa nombre, teléfono, tipo de piel y estatus (Prospecto o Clienta). Guarda y la clienta queda disponible de inmediato.",
      },
      {
        q: "¿Cuál es la diferencia entre Prospecto y Clienta?",
        a: "Un Prospecto es alguien interesada pero que aún no ha comprado. Al registrar su primera venta, el sistema la convierte automáticamente en Clienta.",
      },
      {
        q: "¿Puedo importar mis clientas existentes?",
        a: "Por ahora el registro es manual. Estamos trabajando en un link de registro para que tus clientas se añadan solas. Está disponible en el plan Pro.",
      },
    ],
  },
  {
    category: "Ventas y cobros",
    items: [
      {
        q: "¿Cómo registro una venta?",
        a: "Ve a Ventas → \"+ Nueva venta\". Selecciona la clienta, elige los productos, indica la fecha de venta y el método de pago. Si fue pago completo, marca \"Pago completo\". Si fue un abono, selecciona \"Abono parcial\" e indica el monto recibido.",
      },
      {
        q: "¿Cómo registro un abono adicional?",
        a: "Entra al perfil de la clienta, busca la venta con saldo pendiente y haz clic en \"Registrar abono\". Indica el monto y la fecha del pago.",
      },
      {
        q: "¿Dónde veo las ventas que aún me deben?",
        a: "En el Dashboard verás la tarjeta \"Cuentas por cobrar\" con el total adeudado. También puedes ir a la sección Cobros dentro de Seguimientos para ver el detalle por clienta.",
      },
      {
        q: "¿Por qué el Dashboard muestra ingresos distintos a mis ventas totales?",
        a: "El Dashboard muestra solo lo cobrado en el mes en curso, usando la fecha de la venta. Las Métricas muestran el dinero realmente recibido según la fecha de cada pago (abono), reflejando tu flujo de caja real.",
      },
    ],
  },
  {
    category: "Seguimientos",
    items: [
      {
        q: "¿Cómo funciona el sistema 2+2+2?",
        a: "Cada vez que registras una venta, GlowSuite CRM programa automáticamente 3 recordatorios: a los 2 días, 2 semanas y 2 meses. Estos aparecen en tu sección de Seguimientos cuando llega el momento de contactar a la clienta.",
      },
      {
        q: "¿Puedo desactivar los seguimientos para una clienta?",
        a: "Sí. En el perfil de la clienta hay un botón para activar o desactivar los seguimientos automáticos.",
      },
      {
        q: "¿Cómo marco un seguimiento como enviado?",
        a: "En la sección Seguimientos, cada tarjeta tiene el mensaje pre-redactado. Puedes editar el mensaje y luego hacer clic en \"Marcar como enviado\" una vez que contactes a tu clienta.",
      },
    ],
  },
  {
    category: "Cuenta y acceso",
    items: [
      {
        q: "¿Cómo cambio mi contraseña?",
        a: "Ve a tu Perfil → sección \"Seguridad\" → \"Cambiar contraseña\". Si olvidaste tu contraseña, usa la opción \"¿Olvidaste tu contraseña?\" en la pantalla de inicio de sesión.",
      },
      {
        q: "¿Mis datos están seguros?",
        a: "Sí. Toda la información se transmite cifrada (HTTPS) y se almacena en servidores seguros. Solo tú tienes acceso a los datos de tu negocio. Consulta nuestra Política de Privacidad para más detalles.",
      },
    ],
  },
  {
    category: "Sobre GlowSuite CRM",
    items: [
      {
        q: "¿GlowSuite CRM es oficial de Mary Kay o alguna otra empresa?",
        a: "No. GlowSuite CRM es un software independiente de gestión de negocio, sin afiliación con Mary Kay, Yanbal, Avon ni ninguna otra empresa de venta directa. Es una herramienta de terceros que puedes usar para organizar tu negocio, igual que usarías Excel o WhatsApp.",
      },
    ],
  },
]

export default function AyudaPage() {
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
          <div className="section-label">Soporte</div>
          <h1 className="section-title">Centro de Ayuda</h1>
          <p className="section-sub">
            Encuentra respuestas a las preguntas más frecuentes sobre GlowSuite CRM. Si no encuentras lo que buscas, escríbenos directamente.
          </p>
        </div>
      </section>

      <section style={{ paddingTop: "0", paddingBottom: "80px", background: "var(--bg-alt)" }}>
        <div className="section-inner" style={{ maxWidth: "760px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>

            {faqs.map(({ category, items }) => (
              <div key={category}>
                <div style={{
                  fontSize: "0.78rem", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "var(--pink)", marginBottom: "16px",
                }}>
                  {category}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {items.map(({ q, a }) => (
                    <div
                      key={q}
                      style={{
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        padding: "24px 28px",
                      }}
                    >
                      <h3 style={{ fontSize: "0.97rem", fontWeight: 700, color: "var(--text)", marginBottom: "10px" }}>
                        {q}
                      </h3>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.75 }}>{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Contacto directo */}
            <div style={{
              background: "var(--pink)",
              borderRadius: "20px",
              padding: "36px 32px",
              textAlign: "center",
              color: "white",
            }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "12px" }}>💬</div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>
                ¿No encontraste tu respuesta?
              </h2>
              <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.8)", marginBottom: "24px" }}>
                Nuestro equipo está disponible para ayudarte de lunes a viernes.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <a
                  href="https://wa.me/18499259226?text=Hola%2C%20necesito%20ayuda%20con%20GlowSuite%20CRM"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "white", color: "var(--pink)",
                    padding: "12px 24px", borderRadius: "100px",
                    fontWeight: 600, fontSize: "0.9rem",
                    textDecoration: "none",
                  }}
                >
                  WhatsApp
                </a>
                <a
                  href="mailto:hola@glowsuitecrm.com"
                  style={{
                    background: "rgba(255,255,255,0.15)", color: "white",
                    padding: "12px 24px", borderRadius: "100px",
                    fontWeight: 600, fontSize: "0.9rem",
                    textDecoration: "none",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                  }}
                >
                  hola@glowsuitecrm.com
                </a>
              </div>
            </div>

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
