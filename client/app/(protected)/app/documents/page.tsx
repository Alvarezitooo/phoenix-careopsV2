'use client';

export const dynamic = 'force-dynamic';
// Force cette page à être dynamique (pas de génération statique)

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { uiCopy } from '@/lib/uiCopy';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  status: 'uploading' | 'success' | 'error';
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    setIsUploading(true);

    // Simulation de l'upload
    const newDocuments: Document[] = files.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      status: 'uploading' as const,
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Simuler l'upload avec délai
    for (const doc of newDocuments) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      setDocuments(prev =>
        prev.map(d =>
          d.id === doc.id
            ? { ...d, status: 'success' as const }
            : d
        )
      );
    }

    setIsUploading(false);
  };

  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          {uiCopy.documents.title}
        </h1>
        <p className="text-slate-600 mt-2">
          Importez et organisez vos documents médicaux
        </p>
      </div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
          isDragOver
            ? 'border-rose-400 bg-rose-50'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <div className="space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
            isDragOver ? 'bg-rose-100' : 'bg-slate-100'
          }`}>
            <Upload className={`h-8 w-8 ${
              isDragOver ? 'text-rose-600' : 'text-slate-400'
            }`} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {uiCopy.documents.upload}
            </h3>
            <p className="text-slate-600">
              {uiCopy.documents.upload_description}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-500">
            <span className="px-3 py-1 bg-slate-100 rounded-lg">PDF</span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg">DOC</span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg">JPG</span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg">PNG</span>
          </div>
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-2xl">
            <div className="flex items-center space-x-2 text-slate-700">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent"></div>
              <span>{uiCopy.documents.uploading}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Documents List */}
      {documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <h2 className="font-medium text-slate-900">Vos documents</h2>

          {documents.map((doc, index) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  {doc.status === 'success' && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
                  {doc.status === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
                  {doc.status === 'uploading' && (
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{doc.name}</h4>
                  <p className="text-sm text-slate-600">
                    {formatFileSize(doc.size)} • {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              {doc.status === 'success' && (
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors focus:ring-2 focus:ring-red-300 focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {documents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {uiCopy.documents.no_documents}
          </h3>
          <p className="text-slate-600">
            {uiCopy.documents.upload_description}
          </p>
        </motion.div>
      )}
    </div>
  );
}
