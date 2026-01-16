'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, User } from '@/lib/definitions';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function InvoicePrintPage() {
  const params = useParams();
  const id = params.id as string;
  const { user: authUser, isUserLoading: isAuthUserLoading } = useUser();
  const firestore = useFirestore();

  const invoiceRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid, 'invoices', id) : null),
    [firestore, authUser, id]
  );

  const userRef = useMemoFirebase(
    () => (authUser ? doc(firestore, 'users', authUser.uid) : null),
    [firestore, authUser]
  );

  const { data: invoice, isLoading: isInvoiceLoading } = useDoc<Invoice>(invoiceRef);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userRef);

  const loading = isAuthUserLoading || isInvoiceLoading || isUserLoading;

  // 👉 Auto-imprimir cuando cargue
  useEffect(() => {
    if (!loading && invoice) {
      setTimeout(() => window.print(), 300);
    }
  }, [loading, invoice]);

  // 👉 Reload limpio al volver atrás (evita error de hidratación)
  useEffect(() => {
    const handlePopState = () => {
      window.location.reload();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) return <div>Cargando factura...</div>;
  if (!invoice || !user) return <div>Factura no encontrada</div>;

  const vatRate = user.vatRate ?? 0.1;

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

          @page {
            size: A4;
            margin: 1.2cm;
          }

          html, body {
            background: #ffffff !important;
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* ⭐ BLOQUE ANTI-PÁGINA EXTRA DEFINITIVO */
          .page-container {
            width: 100%;
            height: calc(100vh - 2.4cm);
            max-height: calc(100vh - 2.4cm);
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
            outline: 2px solid red !important;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
            padding: 0.3cm 1cm;
            background: #ffffff !important;
            page-break-after: avoid;
            break-after: avoid;
          }

          .page-container::after {
            content: "";
            display: block;
            height: 0;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #ddd;
            padding-bottom: 12px;
          }

          .company-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .company-name {
            font-size: 16px;
            font-weight: 700;
          }

          .company-info {
            font-size: 10px;
          }

          .logo {
            max-width: 120px;
            max-height: 50px;
            object-fit: contain;
            margin-bottom: 6px;
          }

          .invoice-details {
            text-align: right;
          }

          .invoice-title {
            font-size: 22px;
            font-weight: 700;
          }

          .invoice-number,
          .invoice-date {
            font-size: 11px;
          }

          .client-info {
            margin-top: 10px;
            margin-bottom: 10px;
          }

          .bill-to {
            font-weight: 600;
            margin-bottom: 4px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }

          thead {
            background-color: #f5f5f5;
          }

          th {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #ddd;
            font-weight: 600;
          }

          td {
            padding: 8px;
            border-bottom: 1px solid #eee;
          }

          .col-qty,
          .col-price,
          .col-total {
            text-align: right;
            width: 15%;
          }

          .totals {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
          }

          .totals-container {
            width: 40%;
            font-size: 11px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }

          .grand-total-row {
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #333;
            font-weight: 700;
            font-size: 13px;
          }

          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 10px;
          }

          .signature-image {
            max-height: 50px;
            object-fit: contain;
          }

          .seal-image {
            max-height: 70px;
            object-fit: contain;
          }

          .print-button {
            margin-top: 20px;
            align-self: flex-end;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          }

          @media print {
            .print-button {
              display: none;
            }
          }
        `}
      </style>

      <div className="page-container">
        <div className="header">
          <div className="company-details">
            {user.logoUrl && <img className="logo" src={user.logoUrl} alt="Logo" />}
            <div className="company-name">{user.name}</div>
            <div className="company-info">{user.nif}</div>
            <div className="company-info">{user.address}</div>
            <div className="company-info">{user.email}</div>
          </div>

          <div className="invoice-details">
            <div className="invoice-title">FACTURA</div>
            <div className="invoice-number">{invoice.invoiceNumber}</div>
            <div className="invoice-date">
              Fecha: {new Date(invoice.date).toLocaleDateString('es-ES')}
            </div>
          </div>
        </div>

        <div className="client-info">
          <div className="bill-to">Facturar a:</div>
          <div>{invoice.client.name}</div>
          <div>{invoice.client.nif}</div>
          <div>{invoice.client.address}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th className="col-qty">Cantidad</th>
              <th className="col-price">Precio Unit.</th>
              <th className="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-price">{formatCurrency(item.unitPrice)}</td>
                <td className="col-total">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div className="totals-container">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="total-row">
              <span>IVA ({(vatRate * 100).toFixed(0)}%)</span>
              <span>{formatCurrency(invoice.vat)}</span>
            </div>
            <div className="total-row grand-total-row">
              <span>TOTAL</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        <div className="footer">
          <div>Gracias por su confianza.</div>

          <div className="footer-signature">
            {user.signatureUrl && (
              <img src={user.signatureUrl} alt="Firma" className="signature-image" />
            )}
            <div>Firma</div>
          </div>

          {user.sealUrl && (
            <img src={user.sealUrl} alt="Sello" className="seal-image" />
          )}
        </div>

        <button className="print-button" onClick={() => window.print()}>
          Imprimir / Guardar como PDF
        </button>
      </div>
    </>
  );
}