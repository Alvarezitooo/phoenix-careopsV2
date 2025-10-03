'use client';

export const dynamic = 'force-dynamic';
// Force cette page à être dynamique (pas de génération statique)

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  MoreVertical
} from 'lucide-react';
import { uiCopy } from '@/lib/uiCopy';

interface Consent {
  id: string;
  recipient: string;
  scope: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt?: string;
}

const statusConfig = {
  pending: {
    label: uiCopy.consents.statuses.pending,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    iconColor: 'text-amber-600',
  },
  approved: {
    label: uiCopy.consents.statuses.approved,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600',
  },
  rejected: {
    label: uiCopy.consents.statuses.rejected,
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-600',
  },
  expired: {
    label: uiCopy.consents.statuses.expired,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Shield,
    iconColor: 'text-slate-600',
  },
};

export default function ConsentsPage() {
  const [consents, setConsents] = useState<Consent[]>([
    {
      id: '1',
      recipient: 'Centre Médical Saint-Joseph',
      scope: 'Dossier médical complet',
      status: 'approved',
      createdAt: '2024-01-15T10:30:00Z',
      expiresAt: '2024-12-15T10:30:00Z',
    },
    {
      id: '2',
      recipient: 'École primaire des Roses',
      scope: 'Informations médicales essentielles',
      status: 'pending',
      createdAt: '2024-01-20T14:15:00Z',
    },
    {
      id: '3',
      recipient: 'Dr. Martin - Pédiatre',
      scope: 'Suivi médical complet',
      status: 'approved',
      createdAt: '2024-01-10T09:00:00Z',
      expiresAt: '2024-06-10T09:00:00Z',
    },
  ]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status: Consent['status']) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}>
        <Icon className={`h-4 w-4 mr-2 ${config.iconColor}`} />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            {uiCopy.consents.title}
          </h1>
          <p className="text-slate-600 mt-2">
            Gérez les accès à vos données médicales
          </p>
        </div>
        <button className="bg-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors focus:ring-2 focus:ring-rose-300 focus:outline-none flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          {uiCopy.consents.add_consent}
        </button>
      </div>

      {/* Consents Table */}
      {consents.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    {uiCopy.consents.recipient}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    {uiCopy.consents.scope}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    {uiCopy.consents.status}
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Créé le
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-slate-900">
                    Expire le
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {consents.map((consent, index) => (
                  <motion.tr
                    key={consent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center mr-3">
                          <Users className="h-4 w-4 text-rose-600" />
                        </div>
                        <span className="font-medium text-slate-900">{consent.recipient}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{consent.scope}</td>
                    <td className="px-6 py-4">{getStatusBadge(consent.status)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(consent.createdAt)}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {consent.expiresAt ? formatDate(consent.expiresAt) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {uiCopy.consents.no_consents}
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Aucun consentement n&apos;a encore été créé. Commencez par partager l&apos;accès à vos données.
          </p>
          <button className="bg-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors focus:ring-2 focus:ring-rose-300 focus:outline-none">
            {uiCopy.consents.add_consent}
          </button>
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-slate-50 rounded-2xl p-6 border border-slate-200"
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Sécurité de vos données
            </h3>
            <p className="text-slate-600 mb-4">
              Tous les consentements sont chiffrés et stockés de manière sécurisée.
              Vous pouvez révoquer l&apos;accès à tout moment.
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).map(([status, config]) => (
                <div key={status} className="flex items-center space-x-2 text-sm">
                  {getStatusBadge(status as Consent['status'])}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
