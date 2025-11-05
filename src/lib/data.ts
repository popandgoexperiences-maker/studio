// This file provides a mock data layer.
// In a real application, this would be replaced with calls to a database like Firestore.

import type { User, Invoice } from '@/lib/definitions';

let mockUser: User = {
  id: '1',
  name: 'Tu Nombre',
  email: 'tu@email.com',
  nif: '12345678A',
  address: 'Tu Dirección, 123, Tu Ciudad',
  phone: '600123456',
  logoUrl: 'https://picsum.photos/seed/logo/200/80',
  signatureUrl: 'https://picsum.photos/seed/signature/200/100',
  sealUrl: 'https://picsum.photos/seed/seal/120/120',
};

let mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'F-003',
    clientName: 'Empresa Grande S.L.',
    clientNif: 'B87654321',
    clientAddress: 'Calle Ancha 1, Madrid',
    date: '2024-07-20',
    lineItems: [
      { description: 'Diseño Web', quantity: 1, unitPrice: 1200 },
      { description: 'Hosting (Anual)', quantity: 1, unitPrice: 150 },
    ],
    subtotal: 1350,
    vat: 135,
    total: 1485,
    status: 'paid',
    pdfUrl: '#',
    user: {
      name: mockUser.name,
      nif: mockUser.nif,
      address: mockUser.address,
      email: mockUser.email,
    },
  },
  {
    id: '2',
    invoiceNumber: 'F-002',
    clientName: 'Cliente Mediano S.A.',
    clientNif: 'A12345678',
    clientAddress: 'Avenida Central 2, Barcelona',
    date: '2024-06-15',
    lineItems: [
      { description: 'Consultoría SEO', quantity: 10, unitPrice: 75 },
    ],
    subtotal: 750,
    vat: 75,
    total: 825,
    status: 'pending',
    pdfUrl: '#',
     user: {
      name: mockUser.name,
      nif: mockUser.nif,
      address: mockUser.address,
      email: mockUser.email,
    },
  },
  {
    id: '3',
    invoiceNumber: 'F-001',
    clientName: 'Pequeño Autónomo',
    clientNif: 'Y9876543Z',
    clientAddress: 'Plaza Nueva 3, Valencia',
    date: '2024-05-01',
    lineItems: [
      { description: 'Creación de Logo', quantity: 1, unitPrice: 400 },
    ],
    subtotal: 400,
    vat: 40,
    total: 440,
    status: 'paid',
    pdfUrl: '#',
     user: {
      name: mockUser.name,
      nif: mockUser.nif,
      address: mockUser.address,
      email: mockUser.email,
    },
  },
];

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchInvoices(): Promise<Invoice[]> {
  await delay(500);
  return [...mockInvoices];
}

export async function fetchUser(): Promise<User> {
  await delay(300);
  return { ...mockUser };
}

export async function fetchNextInvoiceNumber(): Promise<string> {
  await delay(100);
  if (mockInvoices.length === 0) {
    return 'F-001';
  }
  const lastInvoiceNumber = mockInvoices
    .map(inv => parseInt(inv.invoiceNumber.split('-')[1]))
    .sort((a, b) => b - a)[0];
  const nextNumber = lastInvoiceNumber + 1;
  return `F-${String(nextNumber).padStart(3, '0')}`;
}

export async function saveInvoice(invoiceData: Omit<Invoice, 'id' | 'user'> & { user: User }): Promise<Invoice> {
  await delay(1000);
  const newInvoice: Invoice = {
    ...invoiceData,
    id: String(mockInvoices.length + 4), // simple unique ID
    status: 'generating', // Simulate PDF generation
    user: {
      name: invoiceData.user.name,
      email: invoiceData.user.email,
      nif: invoiceData.user.nif,
      address: invoiceData.user.address,
    }
  };
  mockInvoices.unshift(newInvoice);

  // Simulate PDF being ready
  setTimeout(() => {
    const foundIndex = mockInvoices.findIndex(inv => inv.id === newInvoice.id);
    if (foundIndex !== -1) {
      mockInvoices[foundIndex].status = 'pending';
      mockInvoices[foundIndex].pdfUrl = '#';
    }
  }, 3000);

  return newInvoice;
}


export async function updateUserProfile(userData: Partial<User>): Promise<User> {
  await delay(700);
  mockUser = { ...mockUser, ...userData };
  return { ...mockUser };
}
