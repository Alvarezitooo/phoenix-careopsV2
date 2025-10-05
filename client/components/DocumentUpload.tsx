'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface DocumentUploadProps {
  onDocumentUploaded: () => void;
  userId: string;
}

export default function DocumentUpload({ onDocumentUploaded, userId }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Vérification du type de fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError('Type de fichier non supporté. Utilisez JPG, PNG, PDF ou TXT.');
      return;
    }

    // Vérification de la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Maximum 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Déterminer le type de document
      const documentType = file.type.includes('image') ? 'scan' :
                         file.type.includes('pdf') ? 'pdf' : 'text';

      // 🔐 Récupérer Supabase
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Vous devez être connecté pour uploader un document');
      }

      console.log('📤 Upload document:', file.name);

      // 💾 Sauvegarder dans Supabase user_documents
      const { error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          nom: file.name,
          type: documentType,
          statut: 'valide',
          date: new Date().toISOString(),
        });

      if (dbError) {
        throw new Error('Erreur lors de la sauvegarde du document');
      }

      setSuccess('Document ajouté avec succès !');

      // Petit délai pour que l'utilisateur voit le message
      setTimeout(() => {
        onDocumentUploaded();
      }, 800);

    } catch (err: any) {
      console.error('Erreur upload document:', err);
      setError(err.message || 'Erreur lors de l\'upload du document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-rose-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,.txt"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="h-12 w-12 text-rose-500 animate-spin mx-auto" />
            <p className="text-slate-600">Enregistrement en cours...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-center space-x-4">
              <Upload className="h-8 w-8 text-slate-400" />
              <FileText className="h-8 w-8 text-slate-400" />
              <Camera className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-700 font-medium">
                Glissez votre document ici ou cliquez pour choisir
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Notification MDPH, certificat médical, courrier CAF...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                JPG, PNG, PDF, TXT • Max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages de statut */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Exemples de documents */}
      <div className="text-xs text-slate-500">
        <p className="font-medium mb-2">Types de documents acceptés :</p>
        <ul className="space-y-1">
          <li>• Notifications et décisions MDPH</li>
          <li>• Certificats médicaux et bilans</li>
          <li>• Courriers CAF et organismes</li>
          <li>• Formulaires de demande d&apos;aides</li>
          <li>• Documents scolaires (PPS, PAI...)</li>
        </ul>
        <p className="text-slate-400 mt-2">Vous pourrez demander une analyse par Phoenix après l&apos;upload.</p>
      </div>
    </div>
  );
}