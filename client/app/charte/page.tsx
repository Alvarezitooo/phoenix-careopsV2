import Link from 'next/link';

const pillars = [
  {
    title: 'Principe du regard détourné',
    subtitle: 'Privacy by design',
    rule: 'Par défaut, PhoenixCare est aveugle au contenu du journal.',
    details:
      "Rien n'est interprété tant que vous n'actionnez pas une aide explicite. Vos mots ne deviennent jamais des 'données' sans consentement.",
  },
  {
    title: 'Amnistie de l’absence',
    subtitle: 'Right to disappear',
    rule: "L'application n'attend rien de vous.",
    details:
      "Aucun rappel automatique, aucun streak. Vous pouvez disparaître deux mois et revenir sans reproche.",
  },
  {
    title: 'Neutralité de la mémoire',
    subtitle: 'Non-judgmental storage',
    rule: 'Le passé sert uniquement si vous le demandez.',
    details:
      "PhoenixCare ne ressort pas vos anciennes notes sauf pour répondre à une question concrète (ex. date pour un dossier).",
  },
  {
    title: 'Posture de l’ombre',
    subtitle: 'Support over substitution',
    rule: "L'IA reste un scribe, jamais un oracle.",
    details:
      "Elle reformule, prépare, simplifie, mais ne parle pas à votre place. Elle redonne votre voix plutôt que de la remplacer.",
  },
];

export default function ChartePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="text-center space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">PhoenixCare</p>
          <h1 className="text-3xl font-semibold text-slate-900">Charte Éthique du Silence</h1>
          <p className="text-slate-600">
            Contrat de confiance entre l&apos;outil et les parents. Chaque nouvelle fonctionnalité passe par ces quatre piliers.
          </p>
        </header>

        <div className="space-y-6">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">{pillar.subtitle}</p>
              <h2 className="text-xl font-semibold text-slate-900">{pillar.title}</h2>
              <p className="text-sm font-medium text-slate-700">{pillar.rule}</p>
              <p className="text-sm text-slate-600">{pillar.details}</p>
            </div>
          ))}
        </div>

        <footer className="text-center text-sm text-slate-500">
          <p>Draft vivant. Toute évolution produit doit respecter ces quatre engagements.</p>
          <p className="mt-2">
            <Link href="/" className="text-rose-600 hover:text-rose-700">
              Retour à la base arrière
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
