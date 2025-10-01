import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';

export default function MentionsLegalesPage() {
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
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Mentions Légales</h1>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Éditeur du site</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>Nom du site :</strong> PhoenixCare</p>
              <p><strong>Propriétaire :</strong> [VOTRE NOM / RAISON SOCIALE]</p>
              <p><strong>Adresse :</strong> [VOTRE ADRESSE]</p>
              <p><strong>Email :</strong> contact@phoenixcare.fr</p>
              <p><strong>SIRET :</strong> [VOTRE NUMÉRO SIRET]</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Directeur de publication</h2>
            <p className="text-slate-700">
              <strong>Nom :</strong> [VOTRE NOM]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Hébergement</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>Hébergeur frontend :</strong> Vercel Inc.</p>
              <p>440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</p>
              <p className="mt-4"><strong>Hébergeur backend :</strong> Railway Corp.</p>
              <p>228 Park Ave S, New York, NY 10003, États-Unis</p>
              <p className="mt-4"><strong>Base de données :</strong> Supabase Inc.</p>
              <p>970 Toa Payoh North, #07-04, Singapore 318992</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Propriété intellectuelle</h2>
            <p className="text-slate-700">
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur
              et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour
              les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Données personnelles</h2>
            <p className="text-slate-700">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un
              droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer
              ce droit, consultez notre{' '}
              <Link href="/politique-confidentialite" className="text-rose-600 hover:text-rose-700 underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Cookies</h2>
            <p className="text-slate-700">
              Ce site utilise des cookies pour améliorer l'expérience utilisateur. En naviguant sur ce site,
              vous acceptez l'utilisation de cookies conformément à notre politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Conditions d'utilisation</h2>
            <p className="text-slate-700">
              L'utilisation de ce site est soumise à nos{' '}
              <Link href="/cgu" className="text-rose-600 hover:text-rose-700 underline">
                Conditions Générales d'Utilisation
              </Link>.
            </p>
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
