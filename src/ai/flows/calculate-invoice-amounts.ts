'use server';

/**
 * @fileOverview Flow to automatically calculate invoice amounts (subtotal, VAT, total).
 *
 * - calculateInvoiceAmounts - Calculates invoice amounts.
 * - CalculateInvoiceAmountsInput - Input type for calculateInvoiceAmounts.
 * - CalculateInvoiceAmountsOutput - Output type for calculateInvoiceAmounts.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateInvoiceAmountsInputSchema = z.object({
  conceptos: z.array(
    z.object({
      descripcion: z.string().describe('Description of the concept.'),
      cantidad: z.number().describe('Quantity of the concept.'),
      precioUnitario: z.number().describe('Unit price of the concept.'),
    })
  ).describe('Array of concepts in the invoice.'),
});
export type CalculateInvoiceAmountsInput = z.infer<typeof CalculateInvoiceAmountsInputSchema>;

const CalculateInvoiceAmountsOutputSchema = z.object({
  subtotal: z.number().describe('Subtotal of the invoice.'),
  iva: z.number().describe('VAT amount (10%).'),
  total: z.number().describe('Total amount including VAT.'),
});
export type CalculateInvoiceAmountsOutput = z.infer<typeof CalculateInvoiceAmountsOutputSchema>;

export async function calculateInvoiceAmounts(input: CalculateInvoiceAmountsInput): Promise<CalculateInvoiceAmountsOutput> {
  return calculateInvoiceAmountsFlow(input);
}

const calculateInvoiceAmountsPrompt = ai.definePrompt({
  name: 'calculateInvoiceAmountsPrompt',
  input: {schema: CalculateInvoiceAmountsInputSchema},
  output: {schema: CalculateInvoiceAmountsOutputSchema},
  prompt: `Given the following invoice concepts, calculate the subtotal, 10% VAT, and total amount.

Concepts:
{{#each conceptos}}
- Description: {{descripcion}}, Quantity: {{cantidad}}, Unit Price: {{precioUnitario}}
{{/each}}

Ensure the outputted JSON is valid and includes the subtotal, iva, and total.
Remember that IVA is 10%.
`,
});

const calculateInvoiceAmountsFlow = ai.defineFlow(
  {
    name: 'calculateInvoiceAmountsFlow',
    inputSchema: CalculateInvoiceAmountsInputSchema,
    outputSchema: CalculateInvoiceAmountsOutputSchema,
  },
  async input => {
    let subtotal = 0;
    input.conceptos.forEach(concepto => {
      subtotal += concepto.cantidad * concepto.precioUnitario;
    });

    const iva = subtotal * 0.1;
    const total = subtotal + iva;

    // Genkit requires you to call the LLM, even when it isn't needed, so pass to the prompt.
    const {output} = await calculateInvoiceAmountsPrompt({
      ...input,
    });

    return {
      subtotal: subtotal,
      iva: iva,
      total: total,
    };
  }
);
