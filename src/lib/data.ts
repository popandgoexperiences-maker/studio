// This file provides a mock data layer.
// In a real application, this would be replaced with calls to a database like Firestore.

import type { User, Invoice, Client } from '@/lib/definitions';
import { PlaceHolderImages } from './placeholder-images';

const logo = PlaceHolderImages.find(img => img.id === 'default-logo');
const signature = PlaceHolderImages.find(img => img.id === 'default-signature');
const seal = PlaceHolderImages.find(img => img.id === 'default-seal');

let mockUser: User = {
  id: '1',
  name: 'Tu Nombre',
  email: 'tu@email.com',
  nif: '12345678A',
  address: 'Tu Dirección, 123, Tu Ciudad',
  phone: '600123456',
  logoUrl: logo?.imageUrl,
  signatureUrl: signature?.imageUrl,
  sealUrl: seal?.imageUrl,
  vatRate: 0.10,
};

let mockClients: Client[] = [
    { id: '1', name: 'Empresa Grande S.L.', nif: 'B87654321', address: 'Calle Ancha 1, Madrid' },
    { id: '2', name: 'Cliente Mediano S.A.', nif: 'A12345678', address: 'Avenida Central 2, Barcelona' },
    { id: '3', name: 'Pequeño Autónomo', nif: 'Y9876543Z', address: 'Plaza Nueva 3, Valencia' },
];

let mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'F-003',
    client: mockClients[0],
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
    client: mockClients[1],
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
    client: mockClients[2],
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

export async function fetchClients(): Promise<Client[]> {
  await delay(400);
  return [...mockClients];
}

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

export async function saveInvoice(invoiceData: Omit<Invoice, 'id' | 'user'> & { user: User, client: Partial<Client> & Pick<Client, 'name' | 'nif' | 'address'> }): Promise<Invoice> {
  await delay(1000);
  
  // Find or create client
  let client = mockClients.find(c => c.id === invoiceData.client.id);

  if (!client) {
      // Check if a client with the same name exists to avoid duplicates
      const existingClient = mockClients.find(c => c.name.toLowerCase() === invoiceData.client.name.toLowerCase());
      if (existingClient) {
        client = existingClient;
      } else {
        client = {
            id: String(mockClients.length + 1),
            name: invoiceData.client.name,
            nif: invoiceData.client.nif,
            address: invoiceData.client.address
        };
        mockClients.push(client);
      }
  }

  const newInvoice: Invoice = {
    ...invoiceData,
    id: String(mockInvoices.length + 4), // simple unique ID
    status: 'generating', // Using 'generating' to ensure persistence in dev environment
    pdfUrl: '#',
    client: client,
    user: {
      name: invoiceData.user.name,
      email: invoiceData.user.email,
      nif: invoiceData.user.nif,
      address: invoiceData.user.address,
    }
  };
  mockInvoices.unshift(newInvoice);

  return newInvoice;
}


export async function updateUserProfile(userData: Partial<User>): Promise<User> {
  await delay(700);
  mockUser = { ...mockUser, ...userData };
  return { ...mockUser };
}

export async function saveClient(clientData: Omit<Client, 'id'>): Promise<Client> {
    await delay(600);
    const newClient: Client = {
        id: String(mockClients.length + 1),
        ...clientData
    };
    mockClients.push(newClient);
    return newClient;
}
