'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { fetchNextInvoiceNumber, fetchUser, saveInvoice, updateUserProfile } from '@/lib/data';

// --- AUTH ACTIONS ---

const LoginSchema = z.object({
  email: z.string().email('Por favor, introduce un email válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = LoginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación.',
    };
  }

  // En una aplicación real, aquí llamarías a Firebase Auth.
  // Para esta simulación, asumimos que el inicio de sesión es exitoso.

  revalidatePath('/');
  redirect('/');
}

const SignupSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido.'),
  email: z.string().email('Por favor, introduce un email válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});

export async function signup(prevState: any, formData: FormData) {
  const validatedFields = SignupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación. Revisa los campos.',
    };
  }
  
  // En una aplicación real, aquí llamarías a Firebase Auth para crear un usuario.
  
  revalidatePath('/');
  redirect('/');
}


export async function logout() {
  // In a real app, you'd call Firebase signOut here.
  redirect('/login');
}


// --- INVOICE ACTIONS ---

const LineItemSchema = z.object({
  descripcion: z.string().min(1, "La descripción no puede estar vacía."),
  cantidad: z.coerce.number().gt(0, "La cantidad debe ser mayor que 0."),
  precioUnitario: z.coerce.number().gt(0, "El precio debe ser mayor que 0."),
});

const InvoiceSchema = z.object({
  clientName: z.string().min(1, "El nombre del cliente es requerido."),
  clientNif: z.string().min(1, "El NIF del cliente es requerido."),
  clientAddress: z.string().min(1, "La dirección del cliente es requerida."),
  lineItems: z.array(LineItemSchema).min(1, "Debe haber al menos un concepto."),
  subtotal: z.coerce.number(),
  vat: z.coerce.number(),
  total: z.coerce.number(),
});


export async function createInvoice(prevState: any, formData: FormData) {
  try {
    const lineItems = JSON.parse(formData.get('lineItems') as string);
    const validatedFields = InvoiceSchema.safeParse({
      ...Object.fromEntries(formData.entries()),
      lineItems,
    });

    if (!validatedFields.success) {
      console.error(validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación. Faltan campos requeridos.',
      };
    }

    const { clientName, clientNif, clientAddress, subtotal, vat, total } = validatedFields.data;
    
    const [invoiceNumber, user] = await Promise.all([
      fetchNextInvoiceNumber(),
      fetchUser(),
    ]);

    await saveInvoice({
      invoiceNumber,
      clientName,
      clientNif,
      clientAddress,
      date: new Date().toISOString().split('T')[0],
      lineItems,
      subtotal,
      vat,
      total,
      status: 'generating',
      user: user,
    });
    
  } catch (e) {
    console.error(e);
    return { message: 'Error al crear la factura.' };
  }

  revalidatePath('/');
  redirect('/');
}

// --- SETTINGS ACTIONS ---

const SettingsSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido.'),
  email: z.string().email('Email inválido.'),
  nif: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function updateSettings(prevState: any, formData: FormData) {
  try {
    const validatedFields = SettingsSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Error de validación.',
      };
    }

    // In a real app, file handling for logo, signature, seal would be here.
    // For this mock, we assume they are handled separately or we just update text fields.
    await updateUserProfile(validatedFields.data);

  } catch (e) {
    return { message: 'Error al actualizar el perfil.' };
  }

  revalidatePath('/settings');
  return { message: 'Perfil actualizado con éxito.' };
}
