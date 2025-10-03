'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';

export default function SignupPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const auth = useSupabaseAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  const { signUp } = auth;

  const onSubmit = async (data: SignupFormData) => {
    setMessage(null);

    try {
      const { data: authData, error } = await signUp(data.email, data.password, data.name);

      if (error) {
        if (error.message.includes('email')) {
          setFormError('email', { message: error.message });
        } else {
          setFormError('root', { message: error.message });
        }
        return;
      }

      if (authData.user && !authData.user.email_confirmed_at) {
        setMessage('✉️ Vérifiez votre email pour confirmer votre compte avant de vous connecter.');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setFormError('root', {
        message: error.message || 'Erreur lors de la création du compte',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Rejoindre Phoenix</h1>
            <p className="text-slate-600 mt-2">
              Créez votre compte pour commencer
            </p>
          </div>

          {errors.root && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errors.root.message}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700 text-sm">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Votre nom"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                    errors.email ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="votre@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  {...register('password')}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                    errors.password ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Minimum 8 caractères avec majuscule, minuscule et chiffre
              </p>
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-slate-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  id="passwordConfirm"
                  type="password"
                  {...register('passwordConfirm')}
                  className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                    errors.passwordConfirm ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.passwordConfirm.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Création en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-rose-600 hover:text-rose-700 font-medium">
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              En créant un compte, vous acceptez nos{' '}
              <Link href="/cgu" className="text-rose-600 hover:text-rose-700 underline">
                conditions d&apos;utilisation
              </Link>{' '}
              et notre{' '}
              <Link href="/politique-confidentialite" className="text-rose-600 hover:text-rose-700 underline">
                politique de confidentialité
              </Link>.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-slate-600 hover:text-slate-700 text-sm">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}