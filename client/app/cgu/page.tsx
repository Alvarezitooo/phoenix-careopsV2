import Link from 'next/link';
import { Heart, ArrowLeft, FileText } from 'lucide-react';

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-rose-500" />
              <span className="text-xl font-semibold text-slate-900">PhoenixCare</span>
            </Link>
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-900 font-medium flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center mb-8">
          <FileText className="h-10 w-10 text-rose-500 mr-4" />
          <h1 className="text-4xl font-bold text-slate-900">Conditions Générales d&apos;Utilisation</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Objet</h2>
            <p className="text-slate-700">
              Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation
              de la plateforme PhoenixCare, service d&apos;accompagnement numérique pour les familles d&apos;enfants
              en situation de handicap.
            </p>
            <p className="text-slate-700 mt-2">
              En créant un compte, vous acceptez sans réserve les présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Accès au service</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>2.1 Inscription</strong></p>
              <p>L&apos;accès à PhoenixCare nécessite la création d&apos;un compte. Vous devez :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Être âgé(e) d&apos;au moins 18 ans ou avoir le consentement parental</li>
                <li>Fournir des informations exactes et à jour</li>
                <li>Maintenir la confidentialité de vos identifiants</li>
                <li>Ne pas créer plusieurs comptes</li>
              </ul>

              <p className="mt-4"><strong>2.2 Gratuité</strong></p>
              <p>
                PhoenixCare est actuellement gratuit. Nous nous réservons le droit d&apos;introduire des
                fonctionnalités payantes à l&apos;avenir, avec notification préalable.
              </p>

              <p className="mt-4"><strong>2.3 Disponibilité</strong></p>
              <p>
                Nous nous efforçons de maintenir le service accessible 24/7, mais ne garantissons pas
                une disponibilité ininterrompue. Des maintenances programmées seront annoncées.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Utilisation du service</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>3.1 Utilisation autorisée</strong></p>
              <p>Vous vous engagez à utiliser PhoenixCare uniquement pour :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Gérer les informations relatives à vos enfants</li>
                <li>Rechercher des aides et démarches administratives</li>
                <li>Stocker vos documents personnels de manière sécurisée</li>
                <li>Obtenir des informations via notre assistant IA</li>
              </ul>

              <p className="mt-4"><strong>3.2 Utilisation interdite</strong></p>
              <p>Il est strictement interdit de :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Utiliser le service à des fins illégales ou frauduleuses</li>
                <li>Tenter d&apos;accéder aux comptes d&apos;autres utilisateurs</li>
                <li>Extraire massivement des données (scraping, bots)</li>
                <li>Diffuser des virus ou logiciels malveillants</li>
                <li>Contourner les mesures de sécurité</li>
                <li>Revendre ou redistribuer le service</li>
                <li>Utiliser le service pour harceler ou nuire à autrui</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Contenu utilisateur</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>4.1 Responsabilité du contenu</strong></p>
              <p>
                Vous êtes seul(e) responsable des informations et documents que vous téléchargez sur
                PhoenixCare. Vous garantissez détenir tous les droits nécessaires sur ces contenus.
              </p>

              <p className="mt-4"><strong>4.2 Propriété du contenu</strong></p>
              <p>
                Vous conservez tous les droits sur vos contenus. En les téléchargeant, vous nous accordez
                une licence limitée pour les stocker et les traiter dans le cadre du service.
              </p>

              <p className="mt-4"><strong>4.3 Modération</strong></p>
              <p>
                Nous nous réservons le droit de supprimer tout contenu illicite, offensant ou contraire
                aux présentes CGU, sans préavis.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Assistant IA</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>5.1 Nature du service</strong></p>
              <p>
                L&apos;assistant IA utilise Google Gemini pour fournir des informations. Ces réponses sont
                générées automatiquement et peuvent contenir des erreurs.
              </p>

              <p className="mt-4"><strong>5.2 Avertissement médical</strong></p>
              <p className="font-semibold text-rose-700">
                ⚠️ PhoenixCare ne fournit PAS de conseils médicaux. Les informations données par
                l&apos;assistant IA sont à titre informatif uniquement. Consultez toujours un professionnel
                de santé qualifié pour toute question médicale.
              </p>

              <p className="mt-4"><strong>5.3 Limites d&apos;utilisation</strong></p>
              <p>
                Des limites de requêtes sont appliquées pour garantir la qualité du service pour tous
                (actuellement 100 requêtes/minute). Un usage abusif peut entraîner une suspension temporaire.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Propriété intellectuelle</h2>
            <div className="text-slate-700 space-y-2">
              <p>
                PhoenixCare, son logo, son interface et tous les éléments qui le composent sont protégés
                par le droit d&apos;auteur et le droit des marques.
              </p>
              <p>
                Toute reproduction, distribution ou modification non autorisée est interdite et constitue
                une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété
                intellectuelle.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Responsabilité</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>7.1 Limitation de responsabilité</strong></p>
              <p>
                PhoenixCare est fourni &quot;en l&apos;état&quot;. Nous ne garantissons pas que le service sera exempt
                d&apos;erreurs ou d&apos;interruptions. Notre responsabilité est limitée dans les limites autorisées
                par la loi.
              </p>

              <p className="mt-4"><strong>7.2 Responsabilité utilisateur</strong></p>
              <p>
                Vous êtes responsable de toute activité effectuée depuis votre compte. En cas d&apos;utilisation
                non autorisée, contactez-nous immédiatement à{' '}
                <a href="mailto:support@phoenixcare.fr" className="text-rose-600 hover:text-rose-700 underline">
                  support@phoenixcare.fr
                </a>
              </p>

              <p className="mt-4"><strong>7.3 Force majeure</strong></p>
              <p>
                Nous ne serons pas tenus responsables en cas de force majeure (panne généralisée d&apos;internet,
                catastrophe naturelle, etc.).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Suspension et résiliation</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>8.1 Résiliation par l&apos;utilisateur</strong></p>
              <p>
                Vous pouvez supprimer votre compte à tout moment depuis les paramètres. Vos données seront
                supprimées conformément à notre{' '}
                <Link href="/politique-confidentialite" className="text-rose-600 hover:text-rose-700 underline">
                  Politique de Confidentialité
                </Link>.
              </p>

              <p className="mt-4"><strong>8.2 Suspension par PhoenixCare</strong></p>
              <p>
                Nous pouvons suspendre ou résilier votre compte en cas de :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violation des présentes CGU</li>
                <li>Activité frauduleuse ou illégale</li>
                <li>Inactivité prolongée (plus de 3 ans)</li>
                <li>Demande des autorités compétentes</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Données personnelles</h2>
            <p className="text-slate-700">
              Le traitement de vos données personnelles est régi par notre{' '}
              <Link href="/politique-confidentialite" className="text-rose-600 hover:text-rose-700 underline">
                Politique de Confidentialité
              </Link>{' '}
              conforme au RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Modifications des CGU</h2>
            <p className="text-slate-700">
              Nous pouvons modifier ces CGU à tout moment. Les modifications importantes vous seront
              notifiées par email. La poursuite de l&apos;utilisation du service après notification vaut
              acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Droit applicable et juridiction</h2>
            <div className="text-slate-700 space-y-2">
              <p>
                Les présentes CGU sont régies par le droit français.
              </p>
              <p>
                En cas de litige, nous vous invitons à nous contacter en priorité à{' '}
                <a href="mailto:support@phoenixcare.fr" className="text-rose-600 hover:text-rose-700 underline">
                  support@phoenixcare.fr
                </a>{' '}
                pour tenter de trouver une solution amiable.
              </p>
              <p>
                À défaut d&apos;accord, le litige sera soumis aux tribunaux compétents de Toulon.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Contact</h2>
            <div className="text-slate-700 space-y-2">
              <p>Pour toute question concernant ces CGU :</p>
              <p>
                Email :{' '}
                <a href="mailto:support@phoenixcare.fr" className="text-rose-600 hover:text-rose-700 underline">
                  support@phoenixcare.fr
                </a>
              </p>
              <p>
                Adresse : Var (83), France
              </p>
            </div>
          </section>

          <section className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
