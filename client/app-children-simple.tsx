'use client';

import { useState } from 'react';
import { uiCopy } from '@/lib/uiCopy';

export default function ChildrenPage() {
  const [children, setChildren] = useState([]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            {uiCopy.children.title}
          </h1>
          <p className="text-slate-600 mt-2">
            Gérez les informations de vos enfants
          </p>
        </div>
        <button className="bg-rose-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-rose-600 transition-colors">
          {uiCopy.children.add_child}
        </button>
      </div>

      <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {uiCopy.children.no_children}
        </h3>
        <p className="text-slate-600">
          {uiCopy.children.add_child_description}
        </p>
      </div>
    </div>
  );
}
