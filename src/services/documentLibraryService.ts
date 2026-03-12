// ─── Document Library Service ────────────────────────────────────────
// Manages standard documents that can be attached to communications.

export interface LibraryDocument {
  id: string;
  title: string;
  category: 'authorization' | 'presentation' | 'certification' | 'support';
  description: string;
  icon: string;
  available: boolean;
}

const STANDARD_DOCUMENTS: LibraryDocument[] = [
  {
    id: 'auth-up',
    title: 'Autorizație Unitate Protejată',
    category: 'authorization',
    description: 'Autorizația ANPD pentru funcționarea ca unitate protejată.',
    icon: '🏛️',
    available: true,
  },
  {
    id: 'prezentare-equal-up',
    title: 'Prezentare Equal Up',
    category: 'presentation',
    description: 'Prezentarea generală a companiei și a serviciilor oferite.',
    icon: '📊',
    available: true,
  },
  {
    id: 'certificare-iso',
    title: 'Certificări și Standarde',
    category: 'certification',
    description: 'Certificări de calitate și conformitate.',
    icon: '✅',
    available: true,
  },
  {
    id: 'lista-caen',
    title: 'Lista Coduri CAEN Autorizate',
    category: 'support',
    description: 'Lista completă a codurilor CAEN pentru care suntem autorizați.',
    icon: '📋',
    available: true,
  },
  {
    id: 'explicatie-mecanism',
    title: 'Explicație Mecanism UP',
    category: 'support',
    description: 'Document explicativ privind mecanismul unităților protejate.',
    icon: '📖',
    available: true,
  },
  {
    id: 'portofoliu-produse',
    title: 'Portofoliu Produse',
    category: 'presentation',
    description: 'Catalog cu produse și servicii disponibile.',
    icon: '🎁',
    available: true,
  },
];

export function getStandardDocuments(): LibraryDocument[] {
  return STANDARD_DOCUMENTS;
}

export function getDocumentsByCategory(category: LibraryDocument['category']): LibraryDocument[] {
  return STANDARD_DOCUMENTS.filter(d => d.category === category);
}

export function getDocumentById(id: string): LibraryDocument | undefined {
  return STANDARD_DOCUMENTS.find(d => d.id === id);
}
