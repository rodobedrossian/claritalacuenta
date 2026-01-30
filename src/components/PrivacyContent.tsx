/** Reusable privacy policy content for embedding in other pages. */
export const PrivacyContent = () => (
  <div className="space-y-6 text-foreground/90 text-sm">
    <section>
      <h2 className="text-base font-bold text-foreground mb-2">1. Información que recopilamos</h2>
      <p className="leading-relaxed">
        En Clarita la cuenta, recopilamos la información que nos proporcionás directamente al crear una cuenta y usar nuestros servicios:
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
        <li>Dirección de correo electrónico</li>
        <li>Nombre (opcional)</li>
        <li>Información de transacciones financieras que registrás</li>
        <li>Metas de ahorro y presupuestos que configurás</li>
        <li>Preferencias de la aplicación</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-bold text-foreground mb-2">2. Cómo usamos tu información</h2>
      <p className="leading-relaxed">Utilizamos tus datos exclusivamente para:</p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
        <li>Proporcionar y mantener la funcionalidad de la aplicación</li>
        <li>Mostrarte tus transacciones, ahorros y estadísticas financieras</li>
        <li>Enviar notificaciones que hayas configurado</li>
        <li>Mejorar nuestros servicios y experiencia de usuario</li>
        <li>Comunicarnos contigo sobre tu cuenta cuando sea necesario</li>
      </ul>
    </section>

    <section>
      <h2 className="text-base font-bold text-foreground mb-2">3. Almacenamiento y seguridad</h2>
      <p className="leading-relaxed">
        Tu información se almacena de forma segura en servidores protegidos con encriptación, autenticación segura y acceso restringido.
      </p>
    </section>

    <section>
      <h2 className="text-base font-bold text-foreground mb-2">4. Tus derechos</h2>
      <p className="leading-relaxed">
        Tenés control total: podés acceder, editar o eliminar tus datos. Para eliminar tu cuenta, hacelo desde Configuración.
      </p>
    </section>

    <section>
      <h2 className="text-base font-bold text-foreground mb-2">5. Compartir información</h2>
      <p className="leading-relaxed">
        No vendemos ni compartimos tu información personal, excepto cuando sea necesario para cumplir obligaciones legales o proporcionar el servicio.
      </p>
    </section>

    <section>
      <h2 className="text-base font-bold text-foreground mb-2">6. Contacto</h2>
      <p className="leading-relaxed">
        Si tenés preguntas, contactanos a través de la aplicación o por correo electrónico.
      </p>
    </section>
  </div>
);
