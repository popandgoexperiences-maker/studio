export type Client = {
  id: string;
  name: string;
  nif: string;
  address: string;
};

export type User = {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  nif?: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
  signatureUrl?: string;
  sealUrl?: string;
  vatRate?: number;
};

export type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type Invoice = {
  id: string;
  userId: string; // Foreign key to User
  invoiceNumber: string;
  client: Client;
  date: string; // ISO 8601 format
  lineItems: LineItem[];
  subtotal: number;
  vat: number;
  total: number;
  pdfUrl?: string;
  status: 'draft' | 'pending' | 'paid' | 'generating';
};

export type Quote = {
  id: string;
  userId: string; // Foreign key to User
  quoteNumber: string;
  client: Client;
  date: string; // ISO 8601 format
  lineItems: LineItem[];
  subtotal: number;
  vat: number;
  total: number;
  pdfUrl?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  invoiceId?: string; // ID of the invoice created from this quote
};
