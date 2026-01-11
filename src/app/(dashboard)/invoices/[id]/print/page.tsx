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

  useEffect(() => {
    if (!loading && invoice) {
        // Automatically trigger print dialog when component is ready
        setTimeout(() => window.print(), 500);
    }
  }, [loading, invoice]);

  if (loading) {
    return <div>Cargando factura...</div>;
  }

  if (!invoice || !user) {
    return <div>Factura no encontrada</div>;
  }

  const vatRate = user.vatRate ?? 0.1;

  return (
    <>
      <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              font-size: 10px;
              color: #333;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4;
              margin: 0;
            }
            .page-container {
                padding: 1.5cm;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
            }
            .container {
              width: 100%;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 30px;
              border-bottom: 1px solid #e5e5e5;
              padding-bottom: 10px;
            }
            .company-details {
              display: flex;
              flex-direction: column;
            }
            .company-name {
              font-size: 14px;
              font-weight: bold;
            }
            .company-info {
              font-size: 9px;
            }
            .logo {
              max-width: 120px;
              max-height: 50px;
              object-fit: contain;
              margin-bottom: 10px;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            .invoice-number, .invoice-date {
              font-size: 11px;
            }
            .client-info {
              margin-bottom: 30px;
            }
            .bill-to {
              font-weight: bold;
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            thead {
              background-color: #f3f4f6;
            }
            thead th {
              border-top: 1px solid #d1d5db;
              border-bottom: 1px solid #d1d5db;
              font-weight: bold;
            }
            tbody tr {
              border-bottom: 1px solid #e5e7eb;
            }
            .col-description { width: 55%; }
            .col-qty, .col-price, .col-total { width: 15%; text-align: right; }
            .totals {
              margin-top: 20px;
              display: flex;
              justify-content: flex-end;
            }
            .totals-container {
              width: 40%;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .grand-total-row {
              margin-top: 5px;
              padding-top: 5px;
              border-top: 1px solid #333;
              font-weight: bold;
              font-size: 12px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 9px;
            }
            .footer-notes {
            }
            .footer-signature {
                text-align: center;
            }
            .signature-image {
                max-height: 50px;
                object-fit: contain;
            }
            .seal-image {
                max-height: 80px;
                object-fit: contain;
                margin-left: 20px;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
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
              body {
                margin: 0;
              }
            }
          `}
        </style>
      <div className="page-container">
          <div className="container">
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
              <div className="invoice-date">Fecha: {new Date(invoice.date).toLocaleDateString('es-ES')}</div>
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
                  <th className="col-description">Descripción</th>
                  <th className="col-qty">Cantidad</th>
                  <th className="col-price">Precio Unit.</th>
                  <th className="col-total">Total</th>
              </tr>
              </thead>
              <tbody>
              {invoice.lineItems.map((item, index) => (
                  <tr key={index}>
                  <td className="col-description">{item.description}</td>
                  <td className="col-qty">{item.quantity}</td>
                  <td className="col-price">{formatCurrency(item.unitPrice)}</td>
                  <td className="col-total">{formatCurrency(item.quantity * item.unitPrice)}</td>
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

          </div>

          <div className="footer">
              <div className='footer-notes'>
                  Gracias por su confianza.
              </div>
              <div className="footer-signature">
                  {user.signatureUrl && <img src={user.signatureUrl} alt="Firma" className="signature-image" />}
                  <div>Firma</div>
              </div>
                {user.sealUrl && <img src={user.sealUrl} alt="Sello" className="seal-image" />}
          </div>
      </div>
      <button className="print-button" onClick={() => window.print()}>Imprimir / Guardar como PDF</button>
    </>
  );
}
