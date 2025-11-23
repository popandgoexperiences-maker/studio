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
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase-server';


// --- AUTH ACTIONS ---

const LoginSchema = z.object({
  email: z.string().email('Por favor, introduce un email válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación.',
      success: false,
    };
  }
  const { auth } = getFirebaseAuth();
  const { email, password } = validatedFields.data;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e: any) {
    return { message: 'Credenciales incorrectas.', success: false };
  }

  // Instead of redirecting here, we return a success state.
  // The client will handle the redirect.
  revalidatePath('/');
  return { success: true, message: 'Login successful' };
}

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
      success: false,
    };
  }
  const { auth } = getFirebaseAuth();
  const { name, email, password } = validatedFields.data;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    const newUserProfile: User = {
      id: firebaseUser.uid,
      name,
      email,
      vatRate: 0.21,
    };
    await createUserProfile(newUserProfile);
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
      return { message: 'Este email ya está en uso.', success: false };
    }
    return { message: 'Error al crear la cuenta.', success: false };
  }
  
  revalidatePath('/');
  return { success: true, message: 'Signup successful' };
}

export async function logout() {
  const { auth } = getFirebaseAuth();
  await signOut(auth);
  revalidatePath('/');
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
  const { auth } = getFirebaseAuth();
  const userId = auth.currentUser?.uid;

  if (!userId) {
    return { message: 'Usuario no autenticado.' };
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

    const invoiceNumber = await fetchNextInvoiceNumber();

    await saveInvoice({
      userId,
      invoiceNumber,
      client: validatedFields.data.client,
      date: new Date().toISOString(),
      lineItems: validatedFields.data.lineItems,
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
    const { auth } = getFirebaseAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
        return { message: 'User not authenticated.' };
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
    const { auth } = getFirebaseAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
        return { message: 'User not authenticated.' };
    }

  try {
    const rawData = Object.fromEntries(formData.entries());

    const validatedFields = SettingsSchema.safeParse(rawData);

    if (!validatedFields.success) {
      console.log(validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación. Revisa los campos marcados.',
      };
    }

    let updatedUserData: Partial<User> = { ...validatedFields.data };

    // Handle logo image
    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      updatedUserData.logoUrl = await fileToDataUrl(logoFile);
    }

    // Handle signature data URL
    if (
      validatedFields.data.signature &&
      validatedFields.data.signature.startsWith('data:image')
    ) {
      updatedUserData.signatureUrl = validatedFields.data.signature;
    }

    // Handle seal image
    const sealFile = formData.get('seal') as File | null;
    if (sealFile && sealFile.size > 0) {
      updatedUserData.sealUrl = await fileToDataUrl(sealFile);
    }

    await updateUserProfile(userId, updatedUserData);
  } catch (e) {
    console.error('Error updating settings:', e);
    return { message: 'Error al actualizar el perfil.' };
  }

  revalidatePath('/settings');
  revalidatePath('/invoices/new');
  revalidatePath('/(dashboard)/layout.tsx');
  return { message: 'Perfil actualizado con éxito.' };
}