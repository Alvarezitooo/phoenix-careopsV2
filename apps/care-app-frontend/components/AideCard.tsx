import React from 'react';
import { Aide } from '@/types';

type Props = {
  aide: Aide;
};

export const AideCard = ({ aide }: Props) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 animate-fade-in">
      <h2 className="text-xl font-semibold text-blue-800">{aide.nom}</h2>
      <p className="text-sm text-gray-700 my-2">{aide.description}</p>
      <div className="flex justify-between items-center mt-4">
        <div className="text-xs text-gray-500">
          <span>Région : {aide.region}</span> | <span>Handicap : {aide.typeHandicap}</span>
        </div>
        {aide.montantEstime && (
          <p className="text-sm font-medium text-green-600">💶 Estimé : {aide.montantEstime} €</p>
        )}
      </div>
      {aide.lienFormulaire && (
        <a
          href="#" // On devra gérer le lien réel plus tard
          className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Accéder au formulaire sécurisé
        </a>
      )}
    </div>
  );
};
