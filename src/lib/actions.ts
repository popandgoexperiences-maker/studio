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
import { adminAuth } from '@/lib/firebase-server';
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
    const userRecord = await adminAuth().createUser({
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
    cookies().delete('__session');
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
  
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return { message: 'Usuario no autenticado.' };
  }

  const decodedToken = await adminAuth().verifySessionCookie(sessionCookie);
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
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación. Faltan campos requeridos.',
      };
    }

    const { subtotal, vat, total } = validatedFields.data;

    const invoiceNumber = await fetchNextInvoiceNumber(userId);

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
  } catch (e) {
    console.error(e);
    return { message: 'Error al crear la factura.' };
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
    
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
        return { message: 'User not authenticated.' };
    }
    const decodedToken = await adminAuth().verifySessionCookie(sessionCookie);
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
  } catch (e) {
    return { message: 'Error al guardar el cliente.' };
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
  console.log('--- Iniciando updateSettings ---');

  try {
    // 1. Verificación de Autenticación
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
      console.error('Error de autenticación: No se encontró la cookie de sesión.');
      return { message: 'Usuario no autenticado. Por favor, inicia sesión de nuevo.' };
    }

    const decodedToken = await adminAuth().verifySessionCookie(sessionCookie);
    const userId = decodedToken?.uid;

    if (!userId) {
      console.error('Error de autenticación: El token de sesión es inválido o ha expirado.');
      return { message: 'Token de sesión inválido.' };
    }
    console.log(`Paso 1: Usuario autenticado correctamente. UID: ${userId}`);

    // 2. Validación de Datos del Formulario
    const rawData = Object.fromEntries(formData.entries());
    console.log('Paso 2: Validando datos del formulario...', rawData);

    const validatedFields = SettingsSchema.safeParse(rawData);

    if (!validatedFields.success) {
      const validationErrors = validatedFields.error.flatten().fieldErrors;
      console.error('Error de validación:', validationErrors);
      return {
        errors: validationErrors,
        message: 'Error de validación. Revisa los campos marcados.',
      };
    }
    console.log('Paso 2: Validación de datos exitosa.', validatedFields.data);

    // 3. Procesamiento de Archivos y Datos
    console.log('Paso 3: Procesando datos y archivos para la actualización...');
    let updatedUserData: Partial<User> = { ...validatedFields.data };

    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      console.log(`- Procesando archivo de logo: ${logoFile.name} (${logoFile.size} bytes)`);
      updatedUserData.logoUrl = await fileToDataUrl(logoFile);
    }

    if (validatedFields.data.signature && validatedFields.data.signature.startsWith('data:image')) {
      console.log('- Procesando datos de firma (data URL).');
      updatedUserData.signatureUrl = validatedFields.data.signature;
    }

    const sealFile = formData.get('seal') as File | null;
    if (sealFile && sealFile.size > 0) {
      console.log(`- Procesando archivo de sello: ${sealFile.name} (${sealFile.size} bytes)`);
      updatedUserData.sealUrl = await fileToDataUrl(sealFile);
    }
    console.log('Paso 3: Objeto de datos final a guardar:', updatedUserData);

    // 4. Actualización en Base de Datos
    console.log(`Paso 4: Intentando actualizar el perfil para el usuario ${userId} en Firestore.`);
    await updateUserProfile(userId, updatedUserData);
    console.log(`Paso 4: Perfil de usuario ${userId} actualizado con éxito en Firestore.`);

  } catch (e: any) {
    console.error('--- ERROR INESPERADO en updateSettings ---');
    console.error('Mensaje:', e.message);
    console.error('Stack:', e.stack);
    return { message: `Error del servidor: ${e.message}` };
  }

  // 5. Revalidación y Finalización
  console.log('Paso 5: Revalidando rutas y finalizando la operación.');
  revalidatePath('/settings');
  revalidatePath('/invoices/new');
  revalidatePath('/(dashboard)/layout.tsx');
  
  console.log('--- updateSettings finalizado con éxito ---');
  return { message: 'Perfil actualizado con éxito.' };
}
