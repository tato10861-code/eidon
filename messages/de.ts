import type { Dict } from "./en";

export const de: Dict = {
  meta: {
    title: "Eidon — Das KI-Mitarbeiter-Unternehmen",
    description:
      "Erstellen, bereitstellen und verwalten Sie produktionsreife KI-Mitarbeiter, die denken, Ihre Tools nutzen und die Arbeit erledigen. Vertrieb, Daten, Support, Finanzen, Recht, Engineering und mehr.",
  },
  nav: {
    platform: "Plattform",
    employees: "Mitarbeiter",
    integrations: "Integrationen",
    pricing: "Preise",
    docs: "Dokumentation",
    studio: "Studio",
    dashboard: "Dashboard",
    playground: "Playground",
    signIn: "Anmelden",
    start: "Erstellen beginnen",
    menu: "Menü",
    close: "Schließen",
    language: "Sprache",
  },
  hero: {
    badge: "Die KI-Belegschaftsplattform · 2027",
    titleA: "Ihre nächste Einstellung",
    titleB: "ist kein Mensch.",
    subtitle:
      "Eidon baut produktionsreife KI-Mitarbeiter — in Vertrieb, Daten, Support, Finanzen und darüber hinaus — die denken, Ihre Tools nutzen und die Arbeit erledigen. In Minuten eingestellt, nicht in Quartalen.",
    ctaPrimary: "Erstellen Sie Ihren KI-Mitarbeiter",
    ctaSecondary: "Das Team kennenlernen",
    note: "Kein Code · Keine Kreditkarte · Erster Dienst in 5 Minuten",
    live: "Live",
    onShift: "Ava ist im Dienst",
    openPlayground: "Vollen Playground öffnen",
    placeholder: "Bitten Sie Ava, eine Outbound-Sequenz zu schreiben…",
  },
  stats: {
    roles: "Einsatzbereite Rollen",
    tools: "Native Integrationen",
    uptime: "Runtime-Verfügbarkeit",
    always: "Immer im Dienst",
  },
  workforce: {
    eyebrow: "Die Belegschaft",
    title: "Ein komplettes Unternehmen,",
    titleAccent: "ab Tag eins bereit.",
    subtitle:
      "Zwölf Spezialisten in Umsatz, Daten, Support, Finanzen, Recht, Engineering und mehr. Jeder wird mit Fachkenntnissen, Tool-Zugriff, Guardrails und einer Evaluations-Suite geliefert — nicht mit einer leeren Prompt-Box.",
    viewAll: "Alle Mitarbeiter ansehen",
    available: "Verfügbar",
    beta: "Beta",
    hire: "Einstellen",
    profile: "Profil ansehen",
    all: "Alle",
  },
  demo: {
    eyebrow: "Live-Demo",
    title: "Kein Chatbot.",
    titleAccent: "Ein Kollege.",
    subtitle:
      "Dies ist ein echtes Gespräch mit Ava, das auf derselben Runtime läuft, die jeden Eidon-Mitarbeiter in der Produktion antreibt.",
    footnote:
      "Die Demo-Engine läuft ohne API-Schlüssel. Verbinden Sie Ihren Anbieter für ein Live-Modell.",
    reset: "Neues Gespräch",
    thinking: "Denkt nach",
    tools: "Tool-Aufrufe",
    tryAsking: "Versuchen Sie zu fragen",
  },
  how: {
    eyebrow: "So funktioniert's",
    title: "Von der leeren Seite zum",
    titleAccent: "ersten Dienst.",
    subtitle:
      "Vier Schritte, kein Prompt-Engineering. Die meisten Teams haben am selben Nachmittag einen Mitarbeiter im Einsatz.",
    steps: [
      {
        title: "Rolle beschreiben",
        body: "Starten Sie aus einer Vorlage oder einem einzigen Satz. Eidon verwandelt die Absicht in eine Stellenbeschreibung, einen Fähigkeitsgraphen und Erfolgsmetriken.",
      },
      {
        title: "Geben Sie ihm einen Verstand",
        body: "Wählen Sie Denktiefe, Ton, Gedächtnis und die genauen Tools, die er berühren darf. Kein Prompt-Engineering nötig.",
      },
      {
        title: "Setzen Sie die Guardrails",
        body: "Definieren Sie, was er entscheiden darf, wann er eskaliert und was er niemals sagen darf. Jede Regel ist testbar.",
      },
      {
        title: "Setzen Sie ihn ein",
        body: "Liefern Sie ihn an Web, E-Mail, Slack, WhatsApp oder Ihre API. Beobachten Sie jede Entscheidung im Trace-Log.",
      },
    ],
  },
  features: {
    eyebrow: "Die Plattform",
    title: "Gebaut zum Arbeiten,",
    titleAccent: "nicht zum Vorführen.",
    subtitle:
      "Alles, was es braucht, um einen digitalen Mitarbeiter in Produktion zu betreiben — an einem Ort.",
    items: [
      {
        title: "Mehrstufiges Denken",
        body: "Plant, handelt, nutzt Tools und verifiziert das Ergebnis. Kein Wrapper um ein Modell.",
      },
      {
        title: "Gedächtnis, das sich aufbaut",
        body: "Kontext pro Kunde, langfristige Fakten und Abruf über Ihr Unternehmenswissen.",
      },
      {
        title: "Evals vor jedem Dienst",
        body: "Über 40 Szenario-Tests, Regressions-Gates und ein Qualitäts-Score, bevor etwas einen Kunden erreicht.",
      },
      {
        title: "Mensch in der Schleife",
        body: "Freigabe-Schwellen, Eskalationsregeln und ein vollständiger Audit-Trail für jede Entscheidung.",
      },
      {
        title: "Alle Kanäle",
        body: "Eingebettetes Widget, E-Mail, Slack, WhatsApp und eine Streaming-REST-API.",
      },
      {
        title: "Totale Observability",
        body: "Jeder Gedanke, Tool-Aufruf, Token und Dollar nachverfolgbar und replaybar.",
      },
    ],
  },
  integrations: {
    eyebrow: "Integrationen",
    title: "Funktioniert mit den Tools,",
    titleAccent: "in denen Sie bereits leben.",
    subtitle:
      "50 native Integrationen mit eingeschränktem OAuth und Least Privilege. Bringen Sie Ihren eigenen Stack mit — oder bauen Sie auf unserer API auf.",
    viewAll: "Alle Integrationen durchsuchen",
  },
  security: {
    eyebrow: "Sicherheit",
    title: "Unternehmen von",
    titleAccent: "Zeile eins an.",
    subtitle: "Ihre Daten gehören Ihnen. Sie trainieren niemals ein Modell. Niemals.",
    items: [
      {
        title: "Ihre Daten trainieren niemals ein Modell",
        body: "Kundeninhalte werden nicht für das Training aufbewahrt — weder von uns noch vom Anbieter.",
      },
      {
        title: "SOC 2 Type II",
        body: "Kontrollen unter unabhängiger Prüfung. Bericht unter NDA verfügbar.",
      },
      {
        title: "SSO, SCIM & Audit-Logs",
        body: "Zentrale Identitätskontrolle, sofortiger Widerruf und ein unveränderlicher Entscheidungs-Log.",
      },
      {
        title: "Regionale Datenresidenz",
        body: "Wählen Sie Ihre Region: USA, EU oder Naher Osten. Fixieren Sie jedes Byte.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Early-Access-Teams",
    title: "Die ersten Unternehmen",
    titleAccent: "laufen auf Eidon.",
    items: [
      {
        quote:
          "Wir haben drei Wochen SDR-Ramp-up durch einen Nachmittag ersetzt. Ava buchte 41 Meetings in ihrem ersten Monat — und jeder CRM-Eintrag war sauber.",
        name: "Maya Chen",
        role: "VP Revenue, Northwind",
      },
      {
        quote:
          "Atlas entdeckte eine Metrik-Definitionsabweichung, die die Aktivierung zwei Quartale lang um 11 % aufgebläht hatte. Das hat die Plattform bezahlt.",
        name: "Daniel Okafor",
        role: "Head of Data, Meridian",
      },
      {
        quote:
          "Mira löst 80 % der Tier-1-Tickets in vier Sprachen. Unser CSAT stieg, nicht sank. Das war der Teil, den ich nicht erwartet hatte.",
        name: "Sofia Reyes",
        role: "Director of CX, Lumen Retail",
      },
    ],
  },
  pricing: {
    eyebrow: "Preise",
    title: "Klein anfangen.",
    titleAccent: "Ein Unternehmen einstellen.",
    subtitle: "Zahlen Sie für Mitarbeiter und Gespräche, nie für Seats. Jederzeit kündbar.",
    perMonth: "/Monat",
    forever: "für immer",
    custom: "Individuell",
    popular: "Am beliebtesten",
    plans: [
      {
        name: "Starter",
        price: "$0",
        period: "für immer",
        description: "Für Gründer, die einen Mitarbeiter einsetzen.",
        features: [
          "1 KI-Mitarbeiter",
          "250 Gespräche/Monat",
          "3 Tools",
          "Web-Widget",
          "Community-Support",
        ],
        cta: "Kostenlos starten",
      },
      {
        name: "Scale",
        price: "$499",
        period: "/Monat",
        description: "Für Teams, die echte operative Last ersetzen.",
        features: [
          "5 KI-Mitarbeiter",
          "25.000 Gespräche/Monat",
          "Alle 50 Integrationen",
          "Alle Kanäle",
          "Evals & Qualitäts-Gates",
          "Prioritäts-Support",
        ],
        cta: "Erstellen beginnen",
      },
      {
        name: "Enterprise",
        price: "Individuell",
        period: "",
        description: "Für Unternehmen, die eine KI-Belegschaft im großen Maßstab betreiben.",
        features: [
          "Unbegrenzte Mitarbeiter",
          "SSO / SCIM",
          "Private Bereitstellung oder VPC",
          "Eigene & feingetunte Modelle",
          "99,99 % Verfügbarkeits-SLA",
          "Dedizierter Engineer",
        ],
        cta: "Vertrieb kontaktieren",
      },
    ],
    note: "Alle Pläne umfassen das vollständige Studio, Trace-Logs und unbegrenzte Seats. Preise in USD.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Die Fragen,",
    titleAccent: "die es wert sind, gestellt zu werden.",
    items: [
      {
        q: "Ist das nur ein Chatbot mit neuem Anstrich?",
        a: "Nein. Jeder Mitarbeiter hat eine Stellenbeschreibung, eingeschränkte Tool-Berechtigungen, Langzeitgedächtnis, Eskalationsregeln und eine Evaluations-Suite. Er wird an Ergebnissen gemessen — gebuchte Meetings, gelöste Tickets, erklärte Varianz — nicht an der Klangschönheit der Antwort.",
      },
      {
        q: "Wie lange dauert die Bereitstellung wirklich?",
        a: "Die meisten Teams gehen am selben Tag live. Wählen Sie eine Vorlage, verbinden Sie Ihre Tools, prüfen Sie die Guardrails und veröffentlichen Sie. Individuelle Rollen mit privatem Wissen dauern in der Regel zwei bis fünf Tage.",
      },
      {
        q: "Kann er wirklich unsere Tools nutzen?",
        a: "Ja. 50 native Integrationen mit eingeschränktem OAuth, plus eine REST-API und Webhooks für alles, was wir nicht abdecken. Jede Aktion wird protokolliert und kann eine menschliche Freigabe erfordern.",
      },
      {
        q: "Was hindert ihn daran zu halluzinieren oder vom Skript abzuweichen?",
        a: "Fundierte Abrufe, Richtlinienprüfungen vor jeder externen Aktion, Vertrauensschwellen und menschliche Freigabe für alles Unwiderrufliche. Wenn er eine Antwort nicht begründen kann, sagt er das und eskaliert.",
      },
      {
        q: "Welche Modelle nutzen Sie?",
        a: "Eidon ist modellagnostisch. Leiten Sie jede Aufgabe an das beste Modell — GPT, Claude, Gemini oder Open-Weight — mit automatischem Fallback. Sie können eigene Schlüssel mitbringen oder in Ihrem eigenen VPC betreiben.",
      },
      {
        q: "Wem gehören die Daten?",
        a: "Ihnen. Daten werden bei Übertragung und Speicherung verschlüsselt, an Ihre gewählte Region gebunden und niemals zum Trainieren von Modellen verwendet. Exportieren oder löschen Sie sie jederzeit.",
      },
      {
        q: "Kann ich eine Rolle bauen, die es noch nicht gibt?",
        a: "Das ist der Zweck des Studios. Beschreiben Sie den Job, wählen Sie Fähigkeiten, verbinden Sie Tools und testen Sie ihn gegen Ihre eigenen Szenarien. Jede Rolle kann zu einem erstklassigen Mitarbeiter werden.",
      },
      {
        q: "Wie funktioniert die Preisgestaltung?",
        a: "Sie zahlen für aktive Mitarbeiter und Gespräche, nicht für Seats. Der Starter-Plan ist für immer kostenlos. Scale kostet 499 $/Monat. Enterprise wird nach Volumen, Bereitstellung und Support berechnet.",
      },
    ],
  },
  cta: {
    title: "Ihr erster KI-Mitarbeiter",
    titleAccent: "beginnt heute.",
    subtitle:
      "Bauen Sie ihn in Minuten — oder lassen Sie unser Team ihn mit Ihnen bauen. So oder so, die Arbeit beginnt sich zu bewegen.",
    primary: "Erstellen Sie Ihren KI-Mitarbeiter",
    secondary: "Sprechen Sie mit unserem Team",
    note: "Ein echter Mensch antwortet innerhalb eines Geschäftstages.",
  },
  footer: {
    tagline:
      "Das KI-Mitarbeiter-Unternehmen. Bauen Sie eine Belegschaft, die rund um die Uhr arbeitet.",
    product: "Produkt",
    platform: "Plattform",
    company: "Unternehmen",
    legal: "Rechtliches",
    employees: "Mitarbeiter",
    studio: "Studio",
    playground: "Playground",
    integrations: "Integrationen",
    pricing: "Preise",
    docs: "Dokumentation",
    api: "API-Referenz",
    security: "Sicherheit",
    status: "Status",
    changelog: "Changelog",
    about: "Über uns",
    careers: "Karriere",
    blog: "Blog",
    contact: "Kontakt",
    privacy: "Datenschutz",
    terms: "AGB",
    dpa: "DPA",
    subprocessors: "Unterauftragsverarbeiter",
    rights: "© 2026 Eidon Labs. Alle Rechte vorbehalten.",
    operational: "Alle Systeme betriebsbereit",
    built: "Gebaut mit Next.js auf Vercel",
  },
  common: {
    learnMore: "Mehr erfahren",
    viewProfile: "Profil ansehen",
    back: "Zurück",
    loading: "Lädt",
    new: "Neu",
    comingSoon: "Demnächst",
    copied: "Kopiert",
    copy: "Kopieren",
    close: "Schließen",
  },
};
