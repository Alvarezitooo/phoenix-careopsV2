'use client';

export const dynamic = 'force-dynamic';
// Force cette page à être dynamique (pas de génération statique)

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Plus,
  Upload,
  Share2,
  FileText,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { uiCopy } from '@/lib/uiCopy';

export default function DashboardPage() {
  const actions = [
    {
      title: uiCopy.dashboard.actions.add_child,
      description: 'Ajouter les informations de votre enfant',
      icon: Plus,
      href: '/app/children',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: uiCopy.dashboard.actions.import_document,
      description: 'Télécharger vos documents médicaux',
      icon: Upload,
      href: '/app/documents',
      color: 'bg-sky-500 hover:bg-sky-600',
      bgColor: 'bg-sky-50',
      iconColor: 'text-sky-600',
    },
    {
      title: uiCopy.dashboard.actions.share_access,
      description: 'Partager l\'accès avec les professionnels',
      icon: Share2,
      href: '/app/consents',
      color: 'bg-rose-500 hover:bg-rose-600',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'document',
      title: 'Dossier médical importé',
      description: 'Rapport médical du Dr. Martin',
      time: 'Il y a 2 heures',
      icon: FileText,
      color: 'text-sky-600',
    },
    {
      id: 2,
      type: 'consent',
      title: 'Accès partagé',
      description: 'Avec l\'équipe éducative',
      time: 'Il y a 1 jour',
      icon: Users,
      color: 'text-emerald-600',
    },
    {
      id: 3,
      type: 'child',
      title: 'Profil enfant mis à jour',
      description: 'Informations médicales de Lucas',
      time: 'Il y a 3 jours',
      icon: Plus,
      color: 'text-rose-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          {uiCopy.dashboard.welcome.replace('{name}', 'Parent')}
        </h1>
        <p className="text-slate-600 mt-2">
          Gérez facilement les informations de vos enfants et partagez-les en toute sécurité.
        </p>
      </motion.div>

      {/* Actions Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Actions rapides</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
            >
              <Link
                href={action.href}
                className="block group"
              >
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-rose-300 focus:outline-none">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 ${action.bgColor} rounded-xl flex items-center justify-center`}>
                      <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-rose-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-slate-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-medium text-white ${action.color} group-hover:scale-105 transition-transform duration-200`}>
                      Commencer
                      <Plus className="ml-2 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Recent Activity */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {uiCopy.dashboard.recent_activity}
          </h2>
          <Link
            href="/app/documents"
            className="text-rose-600 hover:text-rose-700 text-sm font-medium"
          >
            Voir tout
          </Link>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className={`flex-shrink-0 w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center`}>
                  <activity.icon className={`h-5 w-5 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-slate-900">{activity.title}</h4>
                  <p className="text-sm text-slate-600">{activity.description}</p>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {activity.time}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {uiCopy.dashboard.no_activity}
            </h3>
            <p className="text-slate-600">
              Commencez par ajouter un enfant ou importer un document.
            </p>
          </div>
        )}
      </motion.section>
    </div>
  );
}
