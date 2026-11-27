import type { Dict } from "./en";

export const es: Dict = {
  meta: {
    title: "Eidon — La empresa de empleados con IA",
    description:
      "Crea, despliega y gestiona empleados con IA listos para producción que razonan, usan tus herramientas y terminan el trabajo. Ventas, datos, soporte, finanzas, legal, ingeniería y más.",
  },
  nav: {
    platform: "Plataforma",
    employees: "Empleados",
    integrations: "Integraciones",
    pricing: "Precios",
    docs: "Documentación",
    studio: "Studio",
    dashboard: "Panel",
    playground: "Playground",
    signIn: "Iniciar sesión",
    start: "Empezar a construir",
    menu: "Menú",
    close: "Cerrar",
    language: "Idioma",
  },
  hero: {
    badge: "La plataforma de fuerza laboral con IA · 2027",
    titleA: "Tu próxima contratación",
    titleB: "no es humana.",
    subtitle:
      "Eidon construye empleados con IA listos para producción — en ventas, datos, soporte, finanzas y más allá — que razonan, usan tus herramientas y terminan el trabajo. Contratados en minutos, no en trimestres.",
    ctaPrimary: "Construye tu empleado con IA",
    ctaSecondary: "Conoce al equipo",
    note: "Sin código · Sin tarjeta · Primer turno en 5 minutos",
    live: "En vivo",
    onShift: "Ava está de turno",
    openPlayground: "Abrir playground completo",
    placeholder: "Pide a Ava que escriba una secuencia de salida…",
  },
  stats: {
    roles: "Roles listos para desplegar",
    tools: "Integraciones nativas",
    uptime: "Disponibilidad del runtime",
    always: "Siempre de turno",
  },
  workforce: {
    eyebrow: "La fuerza laboral",
    title: "Una empresa completa,",
    titleAccent: "lista desde el día uno.",
    subtitle:
      "Doce especialistas en ingresos, datos, soporte, finanzas, legal, ingeniería y más. Cada uno llega con habilidades de dominio, acceso a herramientas, guardrails y una suite de evaluación — no con un cuadro de prompt vacío.",
    viewAll: "Ver todos los empleados",
    available: "Disponible",
    beta: "Beta",
    hire: "Contratar",
    profile: "Ver perfil",
    all: "Todos",
  },
  demo: {
    eyebrow: "Demo en vivo",
    title: "No es un chatbot.",
    titleAccent: "Es un colega.",
    subtitle:
      "Esta es una conversación real con Ava, ejecutándose sobre el mismo runtime que impulsa a cada empleado de Eidon en producción.",
    footnote:
      "El motor de demo funciona sin clave de API. Conecta tu proveedor para un modelo en vivo.",
    reset: "Nueva conversación",
    thinking: "Pensando",
    tools: "Llamadas a herramientas",
    tryAsking: "Prueba a preguntar",
  },
  how: {
    eyebrow: "Cómo funciona",
    title: "De página en blanco a",
    titleAccent: "primer turno.",
    subtitle:
      "Cuatro pasos, sin ingeniería de prompts. La mayoría de los equipos tiene un empleado trabajando la misma tarde.",
    steps: [
      {
        title: "Describe el rol",
        body: "Empieza desde una plantilla o una sola frase. Eidon convierte la intención en una descripción de puesto, un grafo de habilidades y métricas de éxito.",
      },
      {
        title: "Dale una mente",
        body: "Elige profundidad de razonamiento, tono, memoria y las herramientas exactas que puede usar. Sin ingeniería de prompts.",
      },
      {
        title: "Define los guardrails",
        body: "Define qué puede decidir, cuándo escala y qué nunca debe decir. Cada regla es testeable.",
      },
      {
        title: "Ponlo a trabajar",
        body: "Envíalo a web, email, Slack, WhatsApp o tu API. Observa cada decisión en el registro de trazas.",
      },
    ],
  },
  features: {
    eyebrow: "La plataforma",
    title: "Construido para funcionar,",
    titleAccent: "no para demostrar.",
    subtitle:
      "Todo lo que se necesita para ejecutar un empleado digital en producción — en un solo lugar.",
    items: [
      {
        title: "Razonamiento multi-paso",
        body: "Planifica, actúa, usa herramientas y verifica el resultado. No es un wrapper de un modelo.",
      },
      {
        title: "Memoria que se acumula",
        body: "Contexto por cliente, hechos a largo plazo y recuperación sobre tu conocimiento empresarial.",
      },
      {
        title: "Evals antes de cada turno",
        body: "Más de 40 tests de escenario, puertas de regresión y una puntuación de calidad antes de que algo llegue a un cliente.",
      },
      {
        title: "Humano en el bucle",
        body: "Umbrales de aprobación, reglas de escalado y un registro de auditoría completo para cada decisión.",
      },
      {
        title: "Todos los canales",
        body: "Widget embebible, email, Slack, WhatsApp y una API REST con streaming.",
      },
      {
        title: "Observabilidad total",
        body: "Cada pensamiento, llamada a herramienta, token y dólar trazado y reproducible.",
      },
    ],
  },
  integrations: {
    eyebrow: "Integraciones",
    title: "Funciona con las herramientas",
    titleAccent: "en las que ya vives.",
    subtitle:
      "50 integraciones nativas con OAuth acotado y mínimo privilegio. Trae tu propio stack — o construye sobre nuestra API.",
    viewAll: "Ver todas las integraciones",
  },
  security: {
    eyebrow: "Seguridad",
    title: "Empresarial desde",
    titleAccent: "la primera línea.",
    subtitle: "Tus datos son tuyos. Nunca entrenan un modelo. Jamás.",
    items: [
      {
        title: "Tus datos nunca entrenan un modelo",
        body: "El contenido del cliente no se retiene para entrenamiento — ni por nosotros ni por el proveedor.",
      },
      {
        title: "SOC 2 Type II",
        body: "Controles bajo auditoría independiente. Informe disponible bajo NDA.",
      },
      {
        title: "SSO, SCIM y registros de auditoría",
        body: "Control centralizado de identidad, revocación instantánea y un registro de decisiones inmutable.",
      },
      {
        title: "Residencia de datos regional",
        body: "Elige tu región: EE. UU., UE u Oriente Medio. Fija cada byte.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Equipos de acceso temprano",
    title: "Las primeras empresas",
    titleAccent: "funcionan con Eidon.",
    items: [
      {
        quote:
          "Reemplazamos tres semanas de rampa de SDR con una tarde. Ava reservó 41 reuniones en su primer mes — y cada registro del CRM estaba limpio.",
        name: "Maya Chen",
        role: "VP de Ingresos, Northwind",
      },
      {
        quote:
          "Atlas detectó un desajuste en la definición de una métrica que había inflado la activación un 11% durante dos trimestres. Eso pagó la plataforma.",
        name: "Daniel Okafor",
        role: "Jefe de Datos, Meridian",
      },
      {
        quote:
          "Mira resuelve el 80% de los tickets de nivel uno en cuatro idiomas. Nuestro CSAT subió, no bajó. Eso fue lo que no esperaba.",
        name: "Sofia Reyes",
        role: "Directora de CX, Lumen Retail",
      },
    ],
  },
  pricing: {
    eyebrow: "Precios",
    title: "Empieza pequeño.",
    titleAccent: "Contrata una empresa.",
    subtitle: "Paga por empleados y conversaciones, nunca por asientos. Cancela cuando quieras.",
    perMonth: "/mes",
    forever: "para siempre",
    custom: "Personalizado",
    popular: "Más popular",
    plans: [
      {
        name: "Starter",
        price: "$0",
        period: "para siempre",
        description: "Para fundadores que ponen a un empleado a trabajar.",
        features: [
          "1 empleado con IA",
          "250 conversaciones/mes",
          "3 herramientas",
          "Widget web",
          "Soporte de la comunidad",
        ],
        cta: "Empezar gratis",
      },
      {
        name: "Scale",
        price: "$499",
        period: "/mes",
        description: "Para equipos que reemplazan carga operativa real.",
        features: [
          "5 empleados con IA",
          "25.000 conversaciones/mes",
          "Las 50 integraciones",
          "Todos los canales",
          "Evals y puertas de calidad",
          "Soporte prioritario",
        ],
        cta: "Empezar a construir",
      },
      {
        name: "Enterprise",
        price: "Personalizado",
        period: "",
        description: "Para empresas que ejecutan una fuerza laboral con IA a escala.",
        features: [
          "Empleados ilimitados",
          "SSO / SCIM",
          "Despliegue privado o VPC",
          "Modelos personalizados y ajustados",
          "SLA de disponibilidad 99,99%",
          "Ingeniero dedicado",
        ],
        cta: "Hablar con ventas",
      },
    ],
    note: "Todos los planes incluyen el studio completo, registros de trazas y asientos ilimitados. Precios en USD.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Las preguntas",
    titleAccent: "que merecen hacerse.",
    items: [
      {
        q: "¿Es solo un chatbot con una nueva capa de pintura?",
        a: "No. Cada empleado tiene una descripción de puesto, permisos de herramientas acotados, memoria a largo plazo, reglas de escalado y una suite de evaluación. Se mide por resultados — reuniones reservadas, tickets resueltos, varianza explicada — no por lo agradable que suena la respuesta.",
      },
      {
        q: "¿Cuánto tarda realmente el despliegue?",
        a: "La mayoría de los equipos entra en producción el mismo día. Elige una plantilla, conecta tus herramientas, revisa los guardrails y publica. Los roles personalizados con conocimiento privado suelen tardar de dos a cinco días.",
      },
      {
        q: "¿Puede realmente usar nuestras herramientas?",
        a: "Sí. 50 integraciones nativas con OAuth acotado, más una API REST y webhooks para todo lo que no cubrimos. Cada acción se registra y puede requerir aprobación humana.",
      },
      {
        q: "¿Qué evita que alucine o se salga del guion?",
        a: "Recuperación fundamentada, comprobaciones de política antes de cada acción externa, umbrales de confianza y aprobación humana para todo lo irreversible. Si no puede fundamentar una respuesta, lo dice y escala.",
      },
      {
        q: "¿Qué modelos usan?",
        a: "Eidon es agnóstico al modelo. Enruta cada tarea al mejor modelo — GPT, Claude, Gemini u open-weight — con fallback automático. Puedes traer tus propias claves o ejecutar en tu propio VPC.",
      },
      {
        q: "¿Quién es el dueño de los datos?",
        a: "Tú. Los datos se cifran en tránsito y en reposo, se fijan a tu región elegida y nunca se usan para entrenar modelos. Expórtalos o elimínalos en cualquier momento.",
      },
      {
        q: "¿Puedo construir un rol que aún no existe?",
        a: "Ese es el propósito del studio. Describe el trabajo, elige las habilidades, conecta las herramientas y pruébalo contra tus propios escenarios. Cualquier rol puede convertirse en un empleado de primera clase.",
      },
      {
        q: "¿Cómo funciona el precio?",
        a: "Pagas por empleados activos y conversaciones, no por asientos. El plan Starter es gratis para siempre. Scale es $499/mes. Enterprise se cotiza según volumen, despliegue y soporte.",
      },
    ],
  },
  cta: {
    title: "Tu primer empleado con IA",
    titleAccent: "empieza hoy.",
    subtitle:
      "Constrúyelo en minutos — o deja que nuestro equipo lo construya contigo. De cualquier manera, el trabajo empieza a moverse.",
    primary: "Construye tu empleado con IA",
    secondary: "Habla con nuestro equipo",
    note: "Un humano real responde en un día hábil.",
  },
  footer: {
    tagline:
      "La empresa de empleados con IA. Construye una fuerza laboral que trabaja las 24 horas.",
    product: "Producto",
    platform: "Plataforma",
    company: "Empresa",
    legal: "Legal",
    employees: "Empleados",
    studio: "Studio",
    playground: "Playground",
    integrations: "Integraciones",
    pricing: "Precios",
    docs: "Documentación",
    api: "Referencia de API",
    security: "Seguridad",
    status: "Estado",
    changelog: "Changelog",
    about: "Acerca de",
    careers: "Empleos",
    blog: "Blog",
    contact: "Contacto",
    privacy: "Privacidad",
    terms: "Términos",
    dpa: "DPA",
    subprocessors: "Subprocesadores",
    rights: "© 2026 Eidon Labs. Todos los derechos reservados.",
    operational: "Todos los sistemas operativos",
    built: "Construido con Next.js en Vercel",
  },
  common: {
    learnMore: "Saber más",
    viewProfile: "Ver perfil",
    back: "Atrás",
    loading: "Cargando",
    new: "Nuevo",
    comingSoon: "Próximamente",
    copied: "Copiado",
    copy: "Copiar",
    close: "Cerrar",
  },
};
