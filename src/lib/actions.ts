'use server';

import { z } from 'zod';
import {
  fetchNextInvoiceNumber,
  saveInvoice,
  updateUserProfile,
  saveClient,
  updateClient as updateClientInDb,
  createUserProfile,
  fetchNextQuoteNumber,
  saveQuote,
  getQuote,
  updateQuote,
  deleteClient as deleteClientFromDb,
  deleteInvoice as deleteInvoiceFromDb,
  deleteQuote as deleteQuoteFromDb,
  fetchUser,
} from '@/lib/data';
import type { User } from './definitions';
import { getAuthSafe } from '@/lib/firebase-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';


// --- AUTH ACTIONS ---

const SignupSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.'),
  email: z.string().email('Por favor, introduce un email válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export async function signup(prevState: any, formData: FormData) {
  const validatedFields = SignupSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación. Revisa los campos.',
    };
  }
  
  const { name, email, password } = validatedFields.data;

  try {
    const userRecord = await getAuthSafe().createUser({
        email,
        password,
        displayName: name,
    });

    const newUserProfile: User = {
      id: userRecord.uid,
      name,
      email,
      vatRate: 0.21,
    };
    await createUserProfile(userRecord.uid, newUserProfile);
    
  } catch (e: any) {
    if (e.code === 'auth/email-already-exists') {
      return { message: 'Este email ya está en uso.' };
    }
    return { message: `Error al crear la cuenta: ${e.message}` };
  }
  
  return { success: true, redirectPath: '/login' };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('__session');
    // The redirect in a simple action like this is safe.
    redirect('/login');
}

// --- INVOICE ACTIONS ---

const LineItemSchemaForAction = z.object({
  descripcion: z.string().min(1, 'La descripción no puede estar vacía.'),
  cantidad: z.coerce.number().gt(0, 'La cantidad debe ser mayor que 0.'),
  precioUnitario: z.coerce.number().gte(0, 'El precio debe ser 0 o mayor.'),
});

const ClientSchemaForInvoice = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre del cliente es requerido.'),
  nif: z.string().min(1, 'El NIF del cliente es requerido.'),
  address: z.string().min(1, 'La dirección del cliente es requerida.'),
});

const invoiceSchema = z.object({
  client: ClientSchemaForInvoice,
  lineItems: z
    .array(LineItemSchemaForAction)
    .min(1, 'Debe haber al menos un concepto.'),
  priceIncludesVAT: z.coerce.boolean(),
});

export async function createInvoice(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
      return { message: 'Usuario no autenticado.' };
    }

    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken?.uid;

    if (!userId) {
      return { message: 'Token de sesión inválido.' };
    }

    const user = await fetchUser(userId);
    if (!user) {
        return { message: 'No se pudo encontrar el perfil del usuario.' };
    }
    const vatRate = user.vatRate ?? 0.21;

    const rawLineItems = JSON.parse(formData.get('lineItems') as string);
    const rawClient = JSON.parse(formData.get('client') as string);
    const rawData = {
      lineItems: rawLineItems,
      client: rawClient,
      priceIncludesVAT: formData.get('priceIncludesVAT'),
    };

    const validatedFields = invoiceSchema.safeParse(rawData);
    
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación. Faltan campos requeridos.',
      };
    }
    
    const { lineItems, client, priceIncludesVAT } = validatedFields.data;

    let subtotal = 0;
    
    const finalLineItems = lineItems.map(item => {
      const basePrice = priceIncludesVAT
        ? item.precioUnitario / (1 + vatRate)
        : item.precioUnitario;
      subtotal += item.cantidad * basePrice;
      return {
        description: item.descripcion,
        quantity: item.cantidad,
        unitPrice: basePrice,
      };
    });

    const vat = subtotal * vatRate;
    const total = subtotal + vat;

    const invoiceNumber = await fetchNextInvoiceNumber(userId);

    await saveInvoice(userId, {
      userId,
      invoiceNumber,
      client,
      date: new Date().toISOString(),
      lineItems: finalLineItems,
      subtotal,
      vat,
      total,
      status: 'pending',
    });

    return { success: true, redirectPath: '/invoices' };
  } catch (e: any) {
    return {
      message: `Error al crear la factura: ${e?.message || String(e)}`,
    };
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
      return { message: 'Usuario no autenticado.' };
    }
    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    await deleteInvoiceFromDb(userId, invoiceId);
    return { success: true, redirectPath: '/invoices' };
  } catch (e: any) {
    return { message: `Error al eliminar la factura: ${e.message}` };
  }
}


// --- QUOTE ACTIONS ---

const LineItemQuoteSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida.'),
  cantidad: z.coerce.number().gt(0, 'La cantidad debe ser mayor que 0.'),
  precioUnitario: z.coerce.number().gte(0, 'El precio debe ser 0 o mayor.'),
});

const QuoteSchema = z.object({
  client: ClientSchemaForInvoice,
  lineItems: z.array(LineItemQuoteSchema).min(1, "Debe haber al menos un concepto."),
  priceIncludesVAT: z.coerce.boolean(),
});


export async function createQuote(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
      return { message: 'Usuario no autenticado.' };
    }
    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const user = await fetchUser(userId);
    if (!user) {
        return { message: 'No se pudo encontrar el perfil del usuario.' };
    }
    const vatRate = user.vatRate ?? 0.21;

    const lineItemsRaw = JSON.parse(formData.get('lineItems') as string);
    const clientRaw = JSON.parse(formData.get('client') as string);
    const rawData = {
      lineItems: lineItemsRaw,
      client: clientRaw,
      priceIncludesVAT: formData.get('priceIncludesVAT'),
    };
    
    const validatedFields = QuoteSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación. Faltan campos.',
      };
    }
    
    const { lineItems, client, priceIncludesVAT } = validatedFields.data;

    let subtotal = 0;
    const finalLineItems = lineItems.map(item => {
      const basePrice = priceIncludesVAT
        ? item.precioUnitario / (1 + vatRate)
        : item.precioUnitario;
      subtotal += item.cantidad * basePrice;
      return {
        description: item.descripcion,
        quantity: item.cantidad,
        unitPrice: basePrice,
      };
    });

    const vat = subtotal * vatRate;
    const total = subtotal + vat;

    const quoteNumber = await fetchNextQuoteNumber(userId);

    await saveQuote(userId, {
      userId,
      quoteNumber,
      client,
      date: new Date().toISOString(),
      lineItems: finalLineItems,
      subtotal,
      vat,
      total,
      status: 'draft',
    });

    return { success: true, redirectPath: '/quotes' };
  } catch (e: any) {
    return { message: `Error al crear el presupuesto: ${e.message}` };
  }
}

export async function deleteQuote(quoteId: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
      return { message: 'Usuario no autenticado.' };
    }
    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    await deleteQuoteFromDb(userId, quoteId);
    return { success: true, redirectPath: '/quotes' };
  } catch (e: any) {
    return { message: `Error al eliminar el presupuesto: ${e.message}` };
  }
}


export async function convertQuoteToInvoice(quoteId: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
      return { message: 'Usuario no autenticado.' };
    }
    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const quote = await getQuote(userId, quoteId);
    if (!quote || quote.userId !== userId) {
      throw new Error('Presupuesto no encontrado o no pertenece al usuario.');
    }
    if (quote.invoiceId) {
      throw new Error('Este presupuesto ya ha sido convertido en factura.');
    }

    const invoiceNumber = await fetchNextInvoiceNumber(userId);
    
    const newInvoiceId = await saveInvoice(userId, {
      userId,
      invoiceNumber,
      client: quote.client,
      date: new Date().toISOString(),
      lineItems: quote.lineItems,
      subtotal: quote.subtotal,
      vat: quote.vat,
      total: quote.total,
      status: 'pending',
    });

    await updateQuote(userId, quoteId, { 
      status: 'accepted',
      invoiceId: newInvoiceId 
    });
    
    return { success: true, redirectPath: '/invoices' };
  } catch (e: any) {
    return { message: `Error al convertir el presupuesto: ${e.message}` };
  }
}

// --- CLIENT ACTIONS ---

const ClientSchema = z.object({
  name: z.string().min(1, 'El nombre del cliente es requerido.'),
  nif: z.string().min(1, 'El NIF del cliente es requerido.'),
  address: z.string().min(1, 'La dirección del cliente es requerida.'),
});

export async function createClient(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
        return { message: 'User not authenticated.' };
    }
    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken?.uid;

    if (!userId) {
        return { message: 'Invalid session token.' };
    }

  const validatedFields = ClientSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación.',
    };
  }

  try {
    await saveClient(userId, validatedFields.data);
  } catch (e: any) {
    return { message: `Error al guardar el cliente: ${e?.message || String(e)}` };
  }

  return { success: true, redirectPath: '/clients' };
}

export async function updateClient(clientId: string, prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
        return { message: 'User not authenticated.' };
    }
    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken.uid;

    const validatedFields = ClientSchema.safeParse(
        Object.fromEntries(formData.entries())
    );

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación.',
        };
    }

    try {
        await updateClientInDb(userId, clientId, validatedFields.data);
    } catch (e: any) {
        return { message: `Error al actualizar el cliente: ${e.message}` };
    }

    return { success: true, redirectPath: '/clients' };
}

export async function deleteClient(clientId: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) {
    return { message: 'Usuario no autenticado.' };
  }
  const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
  const userId = decodedToken.uid;

  try {
    await deleteClientFromDb(userId, clientId);
  } catch (e: any) {
    return { message: `Error al eliminar el cliente: ${e.message}` };
  }

  return { success: true };
}


// --- SETTINGS ACTIONS ---

const SettingsSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  email: z.string().email('Email inválido.'),
  nif: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  vatRate: z.coerce
    .number({ invalid_type_error: 'El tipo de IVA debe ser un número.' })
    .min(0, 'El IVA no puede ser negativo.')
    .transform((val) => val / 100)
    .optional(),
  signature: z.string().optional(),
});

// Helper function to convert a File to a Data URL
async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  return `data:${file.type};base64,${base64}`;
}

export async function updateSettings(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
      throw new Error('No se encontró la cookie de sesión. El usuario no está autenticado.');
    }

    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken?.uid;

    if (!userId) {
      throw new Error('Token de sesión inválido o expirado.');
    }

    const rawData = Object.fromEntries(formData.entries());

    const validatedFields = SettingsSchema.safeParse(rawData);

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación. Revisa los campos marcados.',
      };
    }

    const updatedUserData: Partial<User> = { ...validatedFields.data };

    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      updatedUserData.logoUrl = await fileToDataUrl(logoFile);
    }

    if (validatedFields.data.signature && validatedFields.data.signature.startsWith('data:image')) {
      updatedUserData.signatureUrl = validatedFields.data.signature;
    }

    const sealFile = formData.get('seal') as File | null;
    if (sealFile && sealFile.size > 0) {
      updatedUserData.sealUrl = await fileToDataUrl(sealFile);
    }
    await updateUserProfile(userId, updatedUserData);

  } catch (e: any) {
    return { message: `Error al actualizar perfil: ${e.message}` };
  }
  
  return { message: 'Perfil actualizado con éxito.' };
}

// New action to handle file uploads via iframe worker
export async function uploadFile(formData: FormData) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) {
    return { success: false, error: 'User not authenticated.' };
  }

  const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
  const userId = decodedToken?.uid;

  if (!userId) {
    return { success: false, error: 'Invalid session token.' };
  }

  const file = formData.get('file') as File | null;
  const fieldName = formData.get('fieldName') as 'logoUrl' | 'sealUrl' | 'signatureUrl' | null;

  if (!file || !fieldName) {
    return { success: false, error: 'Missing file or field name.' };
  }

  try {
    const dataUrl = await fileToDataUrl(file);
    await updateUserProfile(userId, { [fieldName]: dataUrl });
    return { success: true, url: dataUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
