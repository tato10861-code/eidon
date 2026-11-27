import type { Dict } from "./en";

export const fr: Dict = {
  meta: {
    title: "Eidon — L'entreprise des employés IA",
    description:
      "Créez, déployez et gérez des employés IA prêts pour la production qui raisonnent, utilisent vos outils et terminent le travail. Ventes, données, support, finance, juridique, ingénierie et plus.",
  },
  nav: {
    platform: "Plateforme",
    employees: "Employés",
    integrations: "Intégrations",
    pricing: "Tarifs",
    docs: "Documentation",
    studio: "Studio",
    dashboard: "Tableau de bord",
    playground: "Playground",
    signIn: "Se connecter",
    start: "Commencer à construire",
    menu: "Menu",
    close: "Fermer",
    language: "Langue",
  },
  hero: {
    badge: "La plateforme de force de travail IA · 2027",
    titleA: "Votre prochaine embauche",
    titleB: "n'est pas humaine.",
    subtitle:
      "Eidon construit des employés IA prêts pour la production — en ventes, données, support, finance et au-delà — qui raisonnent, utilisent vos outils et terminent le travail. Embauchés en minutes, pas en trimestres.",
    ctaPrimary: "Créez votre employé IA",
    ctaSecondary: "Rencontrer l'équipe",
    note: "Sans code · Sans carte bancaire · Premier service en 5 minutes",
    live: "En direct",
    onShift: "Ava est de service",
    openPlayground: "Ouvrir le playground complet",
    placeholder: "Demandez à Ava d'écrire une séquence sortante…",
  },
  stats: {
    roles: "Rôles prêts à déployer",
    tools: "Intégrations natives",
    uptime: "Disponibilité du runtime",
    always: "Toujours de service",
  },
  workforce: {
    eyebrow: "La force de travail",
    title: "Une entreprise complète,",
    titleAccent: "prête dès le premier jour.",
    subtitle:
      "Douze spécialistes en revenus, données, support, finance, juridique, ingénierie et plus. Chacun est livré avec des compétences métier, un accès aux outils, des guardrails et une suite d'évaluation — pas une boîte de prompt vide.",
    viewAll: "Voir tous les employés",
    available: "Disponible",
    beta: "Bêta",
    hire: "Embaucher",
    profile: "Voir le profil",
    all: "Tous",
  },
  demo: {
    eyebrow: "Démo en direct",
    title: "Pas un chatbot.",
    titleAccent: "Un collègue.",
    subtitle:
      "Ceci est une vraie conversation avec Ava, exécutée sur le même runtime qui alimente chaque employé Eidon en production.",
    footnote:
      "Le moteur de démo fonctionne sans clé d'API. Connectez votre fournisseur pour un modèle en direct.",
    reset: "Nouvelle conversation",
    thinking: "Réflexion",
    tools: "Appels d'outils",
    tryAsking: "Essayez de demander",
  },
  how: {
    eyebrow: "Comment ça marche",
    title: "De la page blanche au",
    titleAccent: "premier service.",
    subtitle:
      "Quatre étapes, sans ingénierie de prompts. La plupart des équipes ont un employé au travail le même après-midi.",
    steps: [
      {
        title: "Décrivez le rôle",
        body: "Partez d'un modèle ou d'une seule phrase. Eidon transforme l'intention en description de poste, graphe de compétences et métriques de succès.",
      },
      {
        title: "Donnez-lui un esprit",
        body: "Choisissez la profondeur de raisonnement, le ton, la mémoire et les outils exacts qu'il peut toucher. Sans ingénierie de prompts.",
      },
      {
        title: "Définissez les guardrails",
        body: "Définissez ce qu'il peut décider, quand il escalade et ce qu'il ne doit jamais dire. Chaque règle est testable.",
      },
      {
        title: "Mettez-le au travail",
        body: "Expédiez-le sur le web, l'email, Slack, WhatsApp ou votre API. Observez chaque décision dans le journal de traces.",
      },
    ],
  },
  features: {
    eyebrow: "La plateforme",
    title: "Conçu pour fonctionner,",
    titleAccent: "pas pour démontrer.",
    subtitle:
      "Tout ce qu'il faut pour exécuter un employé digital en production — en un seul endroit.",
    items: [
      {
        title: "Raisonnement multi-étapes",
        body: "Planifie, agit, utilise des outils et vérifie le résultat. Pas un wrapper autour d'un modèle.",
      },
      {
        title: "Une mémoire qui s'accumule",
        body: "Contexte par client, faits à long terme et récupération sur votre connaissance d'entreprise.",
      },
      {
        title: "Evals avant chaque service",
        body: "Plus de 40 tests de scénario, portes de régression et un score de qualité avant qu'anything n'atteigne un client.",
      },
      {
        title: "Humain dans la boucle",
        body: "Seuils d'approbation, règles d'escalade et un journal d'audit complet pour chaque décision.",
      },
      {
        title: "Tous les canaux",
        body: "Widget intégrable, email, Slack, WhatsApp et une API REST en streaming.",
      },
      {
        title: "Observabilité totale",
        body: "Chaque pensée, appel d'outil, token et dollar tracé et rejouable.",
      },
    ],
  },
  integrations: {
    eyebrow: "Intégrations",
    title: "Fonctionne avec les outils",
    titleAccent: "dans lesquels vous vivez déjà.",
    subtitle:
      "50 intégrations natives avec OAuth à portée limitée et moindre privilège. Apportez votre stack — ou construisez sur notre API.",
    viewAll: "Parcourir toutes les intégrations",
  },
  security: {
    eyebrow: "Sécurité",
    title: "Entreprise dès",
    titleAccent: "la première ligne.",
    subtitle: "Vos données sont les vôtres. Elles n'entraînent jamais un modèle. Jamais.",
    items: [
      {
        title: "Vos données n'entraînent jamais un modèle",
        body: "Le contenu client n'est pas conservé pour l'entraînement — ni par nous, ni par le fournisseur.",
      },
      {
        title: "SOC 2 Type II",
        body: "Contrôles sous audit indépendant. Rapport disponible sous NDA.",
      },
      {
        title: "SSO, SCIM et journaux d'audit",
        body: "Contrôle centralisé de l'identité, révocation instantanée et journal de décisions immuable.",
      },
      {
        title: "Résidence régionale des données",
        body: "Choisissez votre région : États-Unis, UE ou Moyen-Orient. Épinglez chaque octet.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Équipes en accès anticipé",
    title: "Les premières entreprises",
    titleAccent: "tournent sur Eidon.",
    items: [
      {
        quote:
          "Nous avons remplacé trois semaines de montée en compétence SDR par un après-midi. Ava a réservé 41 réunions en son premier mois — et chaque fiche CRM était propre.",
        name: "Maya Chen",
        role: "VP Revenu, Northwind",
      },
      {
        quote:
          "Atlas a détecté une incohérence dans la définition d'une métrique qui gonflait l'activation de 11 % pendant deux trimestres. Cela a payé la plateforme.",
        name: "Daniel Okafor",
        role: "Responsable Data, Meridian",
      },
      {
        quote:
          "Mira résout 80 % des tickets de niveau un en quatre langues. Notre CSAT a augmenté, pas diminué. C'est la partie que je n'attendais pas.",
        name: "Sofia Reyes",
        role: "Directrice CX, Lumen Retail",
      },
    ],
  },
  pricing: {
    eyebrow: "Tarifs",
    title: "Commencez petit.",
    titleAccent: "Embauchez une entreprise.",
    subtitle:
      "Payez pour les employés et les conversations, jamais pour des sièges. Annulez à tout moment.",
    perMonth: "/mois",
    forever: "pour toujours",
    custom: "Sur mesure",
    popular: "Le plus populaire",
    plans: [
      {
        name: "Starter",
        price: "$0",
        period: "pour toujours",
        description: "Pour les fondateurs qui mettent un employé au travail.",
        features: [
          "1 employé IA",
          "250 conversations/mois",
          "3 outils",
          "Widget web",
          "Support communautaire",
        ],
        cta: "Commencer gratuitement",
      },
      {
        name: "Scale",
        price: "$499",
        period: "/mois",
        description: "Pour les équipes qui remplacent une charge opérationnelle réelle.",
        features: [
          "5 employés IA",
          "25 000 conversations/mois",
          "Les 50 intégrations",
          "Tous les canaux",
          "Evals et portes de qualité",
          "Support prioritaire",
        ],
        cta: "Commencer à construire",
      },
      {
        name: "Enterprise",
        price: "Sur mesure",
        period: "",
        description: "Pour les entreprises qui exécutent une force de travail IA à grande échelle.",
        features: [
          "Employés illimités",
          "SSO / SCIM",
          "Déploiement privé ou VPC",
          "Modèles personnalisés et ajustés",
          "SLA de disponibilité 99,99 %",
          "Ingénieur dédié",
        ],
        cta: "Parler aux ventes",
      },
    ],
    note: "Tous les plans incluent le studio complet, les journaux de traces et des sièges illimités. Prix en USD.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Les questions",
    titleAccent: "qui méritent d'être posées.",
    items: [
      {
        q: "N'est-ce qu'un chatbot avec un nouveau costume ?",
        a: "Non. Chaque employé a une description de poste, des permissions d'outils à portée limitée, une mémoire à long terme, des règles d'escalade et une suite d'évaluation. Il est mesuré sur les résultats — réunions réservées, tickets résolus, variance expliquée — pas sur la beauté de la réponse.",
      },
      {
        q: "Combien de temps prend réellement le déploiement ?",
        a: "La plupart des équipes passent en production le jour même. Choisissez un modèle, connectez vos outils, revoyez les guardrails et publiez. Les rôles personnalisés avec connaissance privée prennent généralement de deux à cinq jours.",
      },
      {
        q: "Peut-il vraiment utiliser nos outils ?",
        a: "Oui. 50 intégrations natives avec OAuth à portée limitée, plus une API REST et des webhooks pour tout ce que nous ne couvrons pas. Chaque action est journalisée et peut nécessiter une approbation humaine.",
      },
      {
        q: "Qu'est-ce qui l'empêche d'halluciner ou de sortir du script ?",
        a: "Récupération fondée, contrôles de politique avant chaque action externe, seuils de confiance et approbation humaine pour tout ce qui est irréversible. S'il ne peut pas fonder une réponse, il le dit et escalade.",
      },
      {
        q: "Quels modèles utilisez-vous ?",
        a: "Eidon est agnostique au modèle. Routez chaque tâche vers le meilleur modèle — GPT, Claude, Gemini ou open-weight — avec fallback automatique. Vous pouvez apporter vos propres clés ou exécuter dans votre propre VPC.",
      },
      {
        q: "À qui appartiennent les données ?",
        a: "À vous. Les données sont chiffrées en transit et au repos, épinglées à votre région choisie et jamais utilisées pour entraîner des modèles. Exportez-les ou supprimez-les à tout moment.",
      },
      {
        q: "Puis-je construire un rôle qui n'existe pas encore ?",
        a: "C'est le but du studio. Décrivez le travail, choisissez les compétences, connectez les outils et testez-le contre vos propres scénarios. Tout rôle peut devenir un employé de premier ordre.",
      },
      {
        q: "Comment fonctionne la tarification ?",
        a: "Vous payez pour les employés actifs et les conversations, pas pour des sièges. Le plan Starter est gratuit pour toujours. Scale est à 499 $/mois. Enterprise est tarifé selon le volume, le déploiement et le support.",
      },
    ],
  },
  cta: {
    title: "Votre premier employé IA",
    titleAccent: "commence aujourd'hui.",
    subtitle:
      "Construisez-le en minutes — ou laissez notre équipe le construire avec vous. Dans les deux cas, le travail commence à avancer.",
    primary: "Créez votre employé IA",
    secondary: "Parlez à notre équipe",
    note: "Un humain réel répond sous un jour ouvré.",
  },
  footer: {
    tagline:
      "L'entreprise des employés IA. Construisez une force de travail qui travaille 24 h/24.",
    product: "Produit",
    platform: "Plateforme",
    company: "Entreprise",
    legal: "Mentions légales",
    employees: "Employés",
    studio: "Studio",
    playground: "Playground",
    integrations: "Intégrations",
    pricing: "Tarifs",
    docs: "Documentation",
    api: "Référence API",
    security: "Sécurité",
    status: "Statut",
    changelog: "Changelog",
    about: "À propos",
    careers: "Carrières",
    blog: "Blog",
    contact: "Contact",
    privacy: "Confidentialité",
    terms: "Conditions",
    dpa: "DPA",
    subprocessors: "Sous-traitants",
    rights: "© 2026 Eidon Labs. Tous droits réservés.",
    operational: "Tous les systèmes opérationnels",
    built: "Construit avec Next.js sur Vercel",
  },
  common: {
    learnMore: "En savoir plus",
    viewProfile: "Voir le profil",
    back: "Retour",
    loading: "Chargement",
    new: "Nouveau",
    comingSoon: "Bientôt",
    copied: "Copié",
    copy: "Copier",
    close: "Fermer",
  },
};
