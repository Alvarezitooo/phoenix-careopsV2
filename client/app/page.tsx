import Link from 'next/link';
import {
  Heart,
  FileText,
  ShieldCheck,
  ArrowRight,
  Star,
  ChevronDown
} from 'lucide-react';
import { uiCopy } from '@/lib/uiCopy';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-rose-500" />
              <span className="text-xl font-semibold text-slate-900">PhoenixCare</span>
            </div>
            <div className="space-x-3">
              <Link
                href="/login"
                className="text-slate-600 hover:text-slate-900 font-medium"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="bg-rose-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-600 transition-colors focus:ring-2 focus:ring-rose-300 focus:outline-none"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-slate-900 tracking-tight mb-6">
            {uiCopy.landing.hero.title}
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            {uiCopy.landing.hero.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-rose-500 text-white px-8 py-4 rounded-xl font-medium hover:bg-rose-600 transition-all duration-200 focus:ring-2 focus:ring-rose-300 focus:outline-none flex items-center justify-center"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button className="border border-slate-300 text-slate-700 px-8 py-4 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200 focus:ring-2 focus:ring-slate-300 focus:outline-none">
              {uiCopy.landing.hero.cta_secondary}
            </button>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-slate-900 tracking-tight mb-4">
              {uiCopy.landing.values.title}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Trois piliers pour simplifier votre quotidien de parent
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {uiCopy.landing.values.items.map((value, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                  {value.icon === 'FileText' && <FileText className="h-6 w-6 text-rose-600" />}
                  {value.icon === 'Heart' && <Heart className="h-6 w-6 text-rose-600" />}
                  {value.icon === 'ShieldCheck' && <ShieldCheck className="h-6 w-6 text-rose-600" />}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-rose-500" />
              <span className="text-xl font-semibold">PhoenixCare</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/mentions-legales" className="text-slate-400 hover:text-white transition-colors">
                Mentions légales
              </Link>
              <Link href="/politique-confidentialite" className="text-slate-400 hover:text-white transition-colors">
                Confidentialité
              </Link>
              <Link href="/cgu" className="text-slate-400 hover:text-white transition-colors">
                CGU
              </Link>
            </div>

            <p className="text-slate-400">{uiCopy.landing.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
