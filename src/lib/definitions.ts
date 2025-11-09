export type Client = {
  id: string;
  name: string;
  nif: string;
  address: string;
};

export type User = {
  id: string;
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
  invoiceNumber: string;
  client: Client;
  date: string;
  lineItems: LineItem[];
  subtotal: number;
  vat: number;
  total: number;
  pdfUrl?: string;
  status: 'draft' | 'pending' | 'paid' | 'generating';
  user: {
    name: string;
    nif?: string;
    address?: string;
    email: string;
  };
};
