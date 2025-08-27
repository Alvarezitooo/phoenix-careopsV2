'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, FileText } from 'lucide-react';

interface DocumentUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // en MB
  className?: string;
  disabled?: boolean;
}

export function DocumentUploader({
  onFilesSelected,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxFiles = 10,
  maxSize = 10,
  className = '',
  disabled = false,
}: DocumentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !disabled) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Filtrer les fichiers selon les critères
    const validFiles = files.filter(file => {
      // Vérifier la taille (maxSize en MB)
      if (file.size > maxSize * 1024 * 1024) {
        alert(`Le fichier ${file.name} est trop volumineux (max ${maxSize}MB)`);
        return false;
      }

      // Vérifier le type
      if (accept && !accept.split(',').some(type =>
        file.type.includes(type.replace('.', '')) ||
        file.name.toLowerCase().endsWith(type.replace('.', ''))
      )) {
        alert(`Le fichier ${file.name} n'est pas dans un format accepté`);
        return false;
      }

      return true;
    });

    // Limiter le nombre de fichiers
    const filesToAdd = validFiles.slice(0, maxFiles - selectedFiles.length);
    const newFiles = [...selectedFiles, ...filesToAdd];

    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDragOver
            ? 'border-rose-400 bg-rose-50'
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={disabled}
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
              Importer des documents
            </h3>
            <p className="text-slate-600">
              Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-500">
            <span className="px-3 py-1 bg-slate-100 rounded-lg">PDF</span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg">DOC</span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg">JPG</span>
            <span className="px-3 py-1 bg-slate-100 rounded-lg">PNG</span>
          </div>

          <p className="text-sm text-slate-400">
            Max {maxFiles} fichiers • {maxSize}MB chacun
          </p>
        </div>
      </motion.div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <h4 className="font-medium text-slate-900">Fichiers sélectionnés :</h4>
          {selectedFiles.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-600">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
