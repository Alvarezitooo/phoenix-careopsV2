export const uiCopy = {
  // Navigation
  nav: {
    home: 'Accueil',
    login: 'Connexion',
    dashboard: 'Tableau de bord',
    children: 'Enfants',
    documents: 'Documents',
    consents: 'Consentements',
    logout: 'Se déconnecter',
  },

  // Landing Page
  landing: {
    hero: {
      title: 'PhoenixCare 🕊️',
      subtitle: 'Votre compagnon numérique pour accompagner votre enfant en situation de handicap',
      cta_primary: 'Commencer maintenant',
      cta_secondary: 'En savoir plus',
    },
    values: {
      title: 'Pourquoi PhoenixCare ?',
      items: [
        {
          title: 'Centralisation',
          description: 'Tous vos documents et démarches au même endroit',
          icon: 'FileText',
        },
        {
          title: 'Simplicité',
          description: 'Interface intuitive conçue pour les parents',
          icon: 'Heart',
        },
        {
          title: 'Sécurité',
          description: 'Vos données protégées et confidentielles',
          icon: 'ShieldCheck',
        },
      ],
    },
    howItWorks: {
      title: 'Comment ça marche ?',
      steps: [
        {
          title: 'Créez votre compte',
          description: 'Inscription simple et sécurisée',
        },
        {
          title: 'Ajoutez vos enfants',
          description: 'Informations médicales et administratives',
        },
        {
          title: 'Importez vos documents',
          description: 'Dossiers médicaux, consentements, etc.',
        },
        {
          title: 'Partagez en toute sécurité',
          description: 'Avec les professionnels de santé',
        },
      ],
    },
    testimonials: {
      title: 'Témoignages',
      items: [
        {
          quote: '"PhoenixCare m\'a fait gagner un temps précieux dans la gestion des papiers médicaux de mon fils."',
          author: 'Marie, mère d\'un enfant autiste',
        },
        {
          quote: '"Enfin une solution simple pour partager les informations importantes avec l\'équipe médicale."',
          author: 'Pierre, père d\'une enfant trisomique',
        },
      ],
    },
    faq: {
      title: 'Questions fréquentes',
      items: [
        {
          question: 'Mes données sont-elles sécurisées ?',
          answer: 'Oui, toutes vos données sont chiffrées et stockées de manière sécurisée, conformément au RGPD.',
        },
        {
          question: 'Puis-je partager l\'accès avec les professionnels de santé ?',
          answer: 'Oui, vous pouvez créer des accès temporaires ou permanents selon vos besoins.',
        },
        {
          question: 'L\'application est-elle gratuite ?',
          answer: 'Oui, PhoenixCare est entièrement gratuit pour accompagner les familles.',
        },
      ],
    },
    footer: {
      cta: 'Prêt à simplifier votre quotidien ?',
      cta_button: 'Créer mon compte',
      copyright: '© 2024 PhoenixCare. Tous droits réservés.',
    },
  },

  // Authentification
  auth: {
    login: {
      title: 'Se connecter à PhoenixCare',
      email: 'Adresse email',
      password: 'Mot de passe',
      submit: 'Se connecter',
      forgot_password: 'Mot de passe oublié ?',
    },
    errors: {
      invalid_credentials: 'Email ou mot de passe incorrect',
      network_error: 'Erreur de connexion. Veuillez réessayer.',
    },
  },

  // Dashboard
  dashboard: {
    welcome: 'Bonjour, {name}',
    actions: {
      add_child: 'Ajouter un enfant',
      import_document: 'Importer un document',
      share_access: 'Partager un accès',
    },
    recent_activity: 'Activités récentes',
    no_activity: 'Aucune activité récente',
  },

  // Enfants
  children: {
    title: 'Mes enfants',
    add_child: 'Ajouter un enfant',
    no_children: 'Aucun enfant enregistré',
    add_child_description: 'Ajoutez les informations de votre enfant pour commencer',
    form: {
      first_name: 'Prénom',
      last_name: 'Nom',
      birth_date: 'Date de naissance',
      medical_info: 'Informations médicales',
      submit: 'Enregistrer',
      cancel: 'Annuler',
    },
  },

  // Documents
  documents: {
    title: 'Mes documents',
    upload: 'Importer un document',
    no_documents: 'Aucun document',
    upload_description: 'Glissez-déposez vos documents ici ou cliquez pour sélectionner',
    uploading: 'Téléchargement en cours...',
    success: 'Document téléchargé avec succès',
    error: 'Erreur lors du téléchargement',
  },

  // Consentements
  consents: {
    title: 'Consentements',
    add_consent: 'Nouveau consentement',
    no_consents: 'Aucun consentement',
    recipient: 'Destinataire',
    scope: 'Périmètre',
    status: 'Statut',
    statuses: {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Refusé',
      expired: 'Expiré',
    },
  },

  // Messages communs
  common: {
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    success: 'Opération réussie',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    export: 'Exporter',
    import: 'Importer',
    download: 'Télécharger',
    upload: 'Télécharger',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    finish: 'Terminer',
  },

  // Messages d'erreur
  errors: {
    // Erreurs génériques pour le chat
    UNKNOWN_ERROR: "Une erreur inattendue est survenue. L'équipe technique a été prévenue.",
    DB_FETCH_FAILED: "Je n'arrive pas à accéder aux informations pour le moment. Veuillez réessayer dans quelques instants.",
    AI_SERVICE_ERROR: "Mon service d'intelligence artificielle rencontre des difficultés. Veuillez patienter un peu avant de réessayer.",

    // Erreurs existantes
    network: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
    server: 'Erreur serveur. Nos équipes ont été notifiées.',
    validation: 'Veuillez corriger les erreurs dans le formulaire.',
    unauthorized: 'Vous n\'êtes pas autorisé à accéder à cette ressource.',
    not_found: 'La page demandée n\'existe pas.',
    forbidden: 'Accès interdit à cette resource.',
  },

  // Messages de succès
  success: {
    saved: 'Modifications enregistrées avec succès',
    deleted: 'Élément supprimé avec succès',
    uploaded: 'Fichier téléchargé avec succès',
    shared: 'Accès partagé avec succès',
  },
};
