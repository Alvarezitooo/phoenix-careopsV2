import Link from 'next/link';
import { Heart, ArrowLeft, Shield } from 'lucide-react';

export default function PolitiqueConfidentialitePage() {
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
          <Shield className="h-10 w-10 text-rose-500 mr-4" />
          <h1 className="text-4xl font-bold text-slate-900">Politique de Confidentialité</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">Introduction</h2>
            <p className="text-slate-700">
              PhoenixCare s'engage à protéger la confidentialité et la sécurité de vos données personnelles.
              Cette politique explique comment nous collectons, utilisons et protégeons vos informations
              conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">1. Données collectées</h2>
            <div className="text-slate-700 space-y-3">
              <p><strong>Nous collectons les données suivantes :</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Informations de compte :</strong> nom, adresse email, mot de passe (chiffré)</li>
                <li><strong>Informations sur les enfants :</strong> prénom, nom, date de naissance, informations médicales</li>
                <li><strong>Documents :</strong> fichiers que vous téléchargez (rapports médicaux, consentements, etc.)</li>
                <li><strong>Données de conversation :</strong> messages échangés avec l'assistant IA</li>
                <li><strong>Données techniques :</strong> adresse IP, navigateur, horodatage des connexions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">2. Finalité du traitement</h2>
            <div className="text-slate-700 space-y-3">
              <p><strong>Nous utilisons vos données pour :</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fournir et améliorer nos services d'accompagnement</li>
                <li>Vous aider à trouver des aides et démarches administratives pertinentes</li>
                <li>Sécuriser votre compte et prévenir les fraudes</li>
                <li>Répondre à vos questions via notre assistant IA</li>
                <li>Vous envoyer des notifications importantes (si activées)</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">3. Base légale du traitement</h2>
            <div className="text-slate-700 space-y-2">
              <p>Le traitement de vos données repose sur :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Votre consentement</strong> lors de la création de votre compte</li>
                <li><strong>L'exécution du contrat</strong> de service entre vous et PhoenixCare</li>
                <li><strong>L'intérêt légitime</strong> pour améliorer nos services</li>
                <li><strong>Les obligations légales</strong> (conservation de certaines données)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">4. Partage des données</h2>
            <div className="text-slate-700 space-y-3">
              <p><strong>Nous ne vendons JAMAIS vos données.</strong></p>
              <p>Vos données peuvent être partagées avec :</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Supabase :</strong> hébergement sécurisé de la base de données (certifié SOC 2 Type II)</li>
                <li><strong>Google Cloud (Gemini API) :</strong> traitement des conversations IA (anonymisées)</li>
                <li><strong>Vercel & Railway :</strong> hébergement de l'application</li>
              </ul>
              <p className="mt-3">
                Tous nos sous-traitants sont conformes RGPD et situés dans l'UE ou couverts par des clauses
                contractuelles types.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">5. Sécurité des données</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>Mesures de protection :</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Mots de passe hashés avec bcrypt</li>
                <li>Authentification sécurisée via Supabase Auth</li>
                <li>Sauvegardes régulières et chiffrées</li>
                <li>Accès restreint aux données (principe du moindre privilège)</li>
                <li>Surveillance des accès anormaux</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">6. Durée de conservation</h2>
            <div className="text-slate-700 space-y-2">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Compte actif :</strong> tant que vous utilisez PhoenixCare</li>
                <li><strong>Compte inactif :</strong> 3 ans après dernière connexion, puis suppression</li>
                <li><strong>Après suppression de compte :</strong> données anonymisées sous 30 jours</li>
                <li><strong>Logs techniques :</strong> 12 mois maximum</li>
                <li><strong>Données légales :</strong> selon obligations légales (ex: factures 10 ans)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">7. Vos droits RGPD</h2>
            <div className="text-slate-700 space-y-3">
              <p><strong>Vous disposez des droits suivants :</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> supprimer votre compte et vos données</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format lisible</li>
                <li><strong>Droit d'opposition :</strong> refuser certains traitements</li>
                <li><strong>Droit à la limitation :</strong> restreindre temporairement le traitement</li>
              </ul>
              <p className="mt-4">
                <strong>Pour exercer vos droits :</strong> contactez-nous à{' '}
                <a href="mailto:privacy@phoenixcare.fr" className="text-rose-600 hover:text-rose-700 underline">
                  privacy@phoenixcare.fr
                </a>
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Nous répondrons sous 30 jours maximum.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">8. Cookies</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>Cookies essentiels (obligatoires) :</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Session d'authentification (Supabase)</li>
                <li>Sécurité CSRF</li>
              </ul>
              <p className="mt-3"><strong>Cookies facultatifs (actuellement : aucun)</strong></p>
              <p className="text-sm text-slate-600 mt-2">
                Nous n'utilisons pas Google Analytics ni aucun cookie de suivi tiers.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">9. Transferts hors UE</h2>
            <p className="text-slate-700">
              Certains de nos prestataires (Vercel, Railway, Google Cloud) peuvent traiter des données aux
              États-Unis. Ces transferts sont encadrés par :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700 mt-2">
              <li>Clauses contractuelles types de la Commission européenne</li>
              <li>Certifications (ex: ISO 27001, SOC 2)</li>
              <li>Mesures de sécurité renforcées (chiffrement end-to-end)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">10. Mineurs</h2>
            <p className="text-slate-700">
              PhoenixCare est destiné aux parents/tuteurs légaux. Si vous avez moins de 18 ans, vous devez
              obtenir le consentement de vos parents avant d'utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">11. Modifications</h2>
            <p className="text-slate-700">
              Nous pouvons modifier cette politique. En cas de changement important, nous vous en informerons
              par email et/ou notification sur l'application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-4">12. Contact et réclamations</h2>
            <div className="text-slate-700 space-y-2">
              <p><strong>Responsable du traitement :</strong></p>
              <p>PhoenixCare - [VOTRE NOM/SOCIÉTÉ]</p>
              <p>Email : <a href="mailto:privacy@phoenixcare.fr" className="text-rose-600 hover:text-rose-700 underline">privacy@phoenixcare.fr</a></p>
              <p className="mt-4">
                <strong>Autorité de contrôle :</strong> Si vous estimez que vos droits ne sont pas respectés,
                vous pouvez déposer une réclamation auprès de la CNIL (Commission Nationale de l'Informatique
                et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-700 underline">www.cnil.fr</a>
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
