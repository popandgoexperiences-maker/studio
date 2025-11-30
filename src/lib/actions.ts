'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  fetchNextInvoiceNumber,
  saveInvoice,
  updateUserProfile,
  saveClient,
  createUserProfile,
} from '@/lib/data';
import type { User } from './definitions';
import { getAuthSafe } from '@/lib/firebase-server';
import { cookies } from 'next/headers';


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
  
  redirect('/login');
}

export async function logout() {
    const cookieStore = cookies();
    cookieStore.delete('__session');
    redirect('/login');
}

// --- INVOICE ACTIONS ---

const LineItemSchema = z.object({
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

const InvoiceSchema = z.object({
  client: ClientSchemaForInvoice,
  lineItems: z
    .array(LineItemSchema)
    .min(1, 'Debe haber al menos un concepto.'),
  subtotal: z.coerce.number(),
  vat: z.coerce.number(),
  total: z.coerce.number(),
});

export async function createInvoice(prevState: any, formData: FormData) {
  console.log('[DEBUG createInvoice] Entrando a createInvoice. Keys:', Array.from(formData.keys()));
  console.log('[DEBUG createInvoice] Client data:', formData.get('client'));
  console.log('[DEBUG createInvoice] LineItems data:', formData.get('lineItems'));


  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session')?.value;
  if (!sessionCookie) {
    return { message: 'Usuario no autenticado.' };
  }

  const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
  const userId = decodedToken?.uid;

  if (!userId) {
    return { message: 'Token de sesión inválido.' };
  }

  try {
    const lineItems = JSON.parse(formData.get('lineItems') as string);
    const client = JSON.parse(formData.get('client') as string);

    const validatedFields = InvoiceSchema.safeParse({
      ...Object.fromEntries(formData.entries()),
      lineItems,
      client,
    });

    if (!validatedFields.success) {
      console.error('[ERROR createInvoice] Zod validation failed:', validatedFields.error.flatten());
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación. Faltan campos requeridos.',
      };
    }
    
    console.log('[DEBUG createInvoice] userId:', userId);
    console.log('[DEBUG createInvoice] Validated data:', validatedFields.data);

    const { subtotal, vat, total } = validatedFields.data;

    const invoiceNumber = await fetchNextInvoiceNumber(userId);
    console.log('[DEBUG createInvoice] Next invoice number:', invoiceNumber);

    await saveInvoice(userId, {
      userId,
      invoiceNumber,
      client: validatedFields.data.client,
      date: new Date().toISOString(),
      lineItems: validatedFields.data.lineItems.map(item => ({
          description: item.descripcion,
          quantity: item.cantidad,
          unitPrice: item.precioUnitario
      })),
      subtotal,
      vat,
      total,
      status: 'pending',
    });
    console.log('[DEBUG createInvoice] saveInvoice completado correctamente.');

  } catch (e: any) {
    console.error('[ERROR createInvoice] Error al ejecutar la acción:', e);
    return {
      message: `Error al crear la factura: ${e?.message || String(e)}`,
      error: {
        message: e?.message ?? String(e),
        stack: e?.stack ?? null,
        name: e?.name ?? null,
      },
    };
  }

  revalidatePath('/invoices');
  revalidatePath('/clients');
  redirect('/invoices');
}

// --- CLIENT ACTIONS ---

const ClientSchema = z.object({
  name: z.string().min(1, 'El nombre del cliente es requerido.'),
  nif: z.string().min(1, 'El NIF del cliente es requerido.'),
  address: z.string().min(1, 'La dirección del cliente es requerida.'),
});

export async function createClient(prevState: any, formData: FormData) {
    console.log('[DEBUG createClient] Entrando en createClient');
    console.log('[DEBUG createClient] formData keys:', Array.from(formData.keys()));
    
    const cookieStore = cookies();
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
  
  console.log('[DEBUG createClient] userId before saveClient:', userId);
  console.log('[DEBUG createClient] validatedFields:', validatedFields.data);

  try {
    console.log('[DEBUG createClient] Llamando a saveClient con userId:', userId);
    await saveClient(userId, validatedFields.data);
    console.log('[DEBUG createClient] saveClient completado correctamente');
  } catch (e: any) {
    console.error('[ERROR createClient] Error al ejecutar saveClient:', e);
    // Devolver el mensaje y la traza para diagnóstico inmediato.
    // Nota: esto es solo diagnóstico; no modificar la lógica más allá de devolver información.
    return {
      message: `Error al guardar el cliente: ${e?.message || String(e)}`,
      error: {
        message: e?.message ?? String(e),
        stack: e?.stack ?? null,
        name: e?.name ?? null
      }
    };
  }

  revalidatePath('/clients');
  revalidatePath('/invoices/new');
  redirect('/clients');
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
  console.log('[DEBUG] updateSettings -> Invocada la acción del servidor.');
  try {
    // 1. Verificación de Autenticación
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    if (!sessionCookie) {
      throw new Error('No se encontró la cookie de sesión. El usuario no está autenticado.');
    }

    const decodedToken = await getAuthSafe().verifySessionCookie(sessionCookie, true);
    const userId = decodedToken?.uid;

    if (!userId) {
      throw new Error('Token de sesión inválido o expirado.');
    }
    console.log(`[DEBUG] updateSettings -> Autenticación verificada. userId: ${userId}`);

    // 2. Validación de Datos del Formulario
    const rawData = Object.fromEntries(formData.entries());
    console.log('[DEBUG] updateSettings -> Raw form data:', rawData);

    const validatedFields = SettingsSchema.safeParse(rawData);

    if (!validatedFields.success) {
      console.error('[DEBUG] updateSettings -> Error de validación de Zod:', validatedFields.error.flatten());
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación. Revisa los campos marcados.',
      };
    }
    console.log('[DEBUG] updateSettings -> Datos validados:', validatedFields.data);

    // 3. Procesamiento de Archivos y Datos
    const updatedUserData: Partial<User> = { ...validatedFields.data };
    console.log('[DEBUG] updateSettings -> Objeto de datos inicial:', updatedUserData);

    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      console.log(`[DEBUG] updateSettings -> Procesando archivo 'logo': ${logoFile.name}`);
      updatedUserData.logoUrl = await fileToDataUrl(logoFile);
    }

    if (validatedFields.data.signature && validatedFields.data.signature.startsWith('data:image')) {
      console.log('[DEBUG] updateSettings -> Procesando data URL de la firma.');
      updatedUserData.signatureUrl = validatedFields.data.signature;
    }

    const sealFile = formData.get('seal') as File | null;
    if (sealFile && sealFile.size > 0) {
      console.log(`[DEBUG] updateSettings -> Procesando archivo 'seal': ${sealFile.name}`);
      updatedUserData.sealUrl = await fileToDataUrl(sealFile);
    }
    console.log('[DEBUG] updateSettings -> Objeto de datos final para Firestore:', updatedUserData);

    // 4. Actualización en Base de Datos
    console.log(`[DEBUG] updateSettings -> Llamando a updateUserProfile para userId: ${userId}`);
    await updateUserProfile(userId, updatedUserData);
    console.log(`[DEBUG] updateSettings -> updateUserProfile completado con éxito.`);

  } catch (e: any) {
    console.error('[ERROR] en updateSettings:', e);
    console.error('[ERROR STACK] en updateSettings:', e.stack);
    return { message: `Error al actualizar perfil: ${e.message}` };
  }

  // 5. Revalidación y Finalización
  console.log('[DEBUG] updateSettings -> Revalidando rutas y finalizando.');
  revalidatePath('/settings');
  revalidatePath('/invoices/new');
  revalidatePath('/(dashboard)/layout.tsx');
  
  return { message: 'Perfil actualizado con éxito.' };
}

// New action to handle file uploads via iframe worker
export async function uploadFile(formData: FormData) {
  const cookieStore = cookies();
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
    revalidatePath('/settings');
    return { success: true, url: dataUrl };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
