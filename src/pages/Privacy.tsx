import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RuculaLogo } from "@/components/RuculaLogo";

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2">
            <RuculaLogo size="sm" />
          </Link>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-4">
          Política de Privacidad
        </h1>
        <p className="text-muted-foreground mb-8">
          Última actualización: Enero 2026
        </p>

        <div className="space-y-8 text-foreground/90">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">
              1. Información que recopilamos
            </h2>
            <p className="leading-relaxed">
              En Rucula, recopilamos la información que nos proporcionás 
              directamente al crear una cuenta y usar nuestros servicios:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
              <li>Dirección de correo electrónico</li>
              <li>Nombre (opcional)</li>
              <li>Información de transacciones financieras que registrás</li>
              <li>Metas de ahorro y presupuestos que configurás</li>
              <li>Preferencias de la aplicación</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">
              2. Cómo usamos tu información
            </h2>
            <p className="leading-relaxed">
              Utilizamos tus datos exclusivamente para:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
              <li>Proporcionar y mantener la funcionalidad de la aplicación</li>
              <li>Mostrarte tus transacciones, ahorros y estadísticas financieras</li>
              <li>Enviar notificaciones que hayas configurado</li>
              <li>Mejorar nuestros servicios y experiencia de usuario</li>
              <li>Comunicarnos contigo sobre tu cuenta cuando sea necesario</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">
              3. Almacenamiento y seguridad de datos
            </h2>
            <p className="leading-relaxed">
              Tu información se almacena de forma segura en servidores protegidos. 
              Implementamos medidas de seguridad estándar de la industria, incluyendo:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
              <li>Encriptación de datos en tránsito y en reposo</li>
              <li>Autenticación segura de usuarios</li>
              <li>Acceso restringido a datos personales</li>
              <li>Monitoreo continuo de seguridad</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">
              4. Tus derechos sobre tus datos
            </h2>
            <p className="leading-relaxed">
              Tenés control total sobre tu información. Podés:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
              <li>Acceder a todos tus datos desde la aplicación</li>
              <li>Editar o corregir tu información personal</li>
              <li>Eliminar transacciones o datos específicos</li>
              <li>Solicitar la eliminación completa de tu cuenta y datos</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              Para eliminar tu cuenta, podés hacerlo desde la sección de Configuración 
              dentro de la aplicación.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">
              5. Cookies y tecnologías similares
            </h2>
            <p className="leading-relaxed">
              Utilizamos cookies y almacenamiento local del navegador únicamente para:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
              <li>Mantener tu sesión activa</li>
              <li>Recordar tus preferencias de usuario</li>
              <li>Mejorar el rendimiento de la aplicación</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              No utilizamos cookies de seguimiento ni compartimos información con 
              terceros para publicidad.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">
              6. Compartir información
            </h2>
            <p className="leading-relaxed">
              No vendemos, alquilamos ni compartimos tu información personal con 
              terceros, excepto cuando sea necesario para:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-muted-foreground">
              <li>Cumplir con obligaciones legales</li>
              <li>Proteger nuestros derechos y seguridad</li>
              <li>Proporcionar el servicio a través de proveedores de infraestructura seguros</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">
              7. Cambios a esta política
            </h2>
            <p className="leading-relaxed">
              Podemos actualizar esta política de privacidad ocasionalmente. 
              Te notificaremos sobre cambios significativos a través de la aplicación 
              o por correo electrónico. La fecha de "última actualización" al inicio 
              de este documento indica cuándo se realizaron los últimos cambios.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">
              8. Contacto
            </h2>
            <p className="leading-relaxed">
              Si tenés preguntas sobre esta política de privacidad o sobre cómo 
              manejamos tus datos, podés contactarnos a través de la aplicación 
              o enviando un correo electrónico.
            </p>
          </section>
        </div>

        {/* Back button */}
        <div className="mt-12 pt-8 border-t border-border/50">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Privacy;
