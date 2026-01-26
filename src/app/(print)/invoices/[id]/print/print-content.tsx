'use client';

import { useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, User } from '@/lib/definitions';

export function InvoicePrintContent({ invoice, user }: { invoice: Invoice; user: User }) {
  useEffect(() => {
    if (invoice && user) {
      setTimeout(() => window.print(), 300);
    }
  }, [invoice, user]);

  const vatRate = user.vatRate ?? 0.21;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        @page {
          size: A4;
          margin: 1.5cm;
        }

        html, body {
          background: #ffffff !important;
          margin: 0;
          padding: 0;
          font-family: 'Inter', sans-serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .page-container {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #ffffff !important;
        }

        @media screen {
          .page-container {
            width: 21cm;
            min-height: 29.7cm;
            margin: 1rem auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 1.5cm;
            box-sizing: border-box;
          }
        }

        @media print {
            .page-container {
                height: 100%;
                width: 100%;
            }
        }

        .main-content {
          flex-grow: 1;
        }

        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #ddd; padding-bottom: 12px; }
        .company-details { display: flex; flex-direction: column; gap: 2px; }
        .company-name { font-size: 16px; font-weight: 700; }
        .company-info { font-size: 10px; }
        .logo { max-width: 120px; max-height: 50px; object-fit: contain; margin-bottom: 6px; }
        .invoice-details { text-align: right; }
        .invoice-title { font-size: 22px; font-weight: 700; }
        .invoice-number, .invoice-date { font-size: 11px; }
        .client-info { margin-top: 20px; margin-bottom: 20px; }
        .bill-to { font-weight: 600; margin-bottom: 4px; }
        
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        thead { background-color: #f5f5f5; }
        th { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; font-weight: 600; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .col-qty, .col-price, .col-total { text-align: right; width: 15%; }
        
        .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
        .totals-container { width: 40%; font-size: 11px; }
        .total-row { display: flex; justify-content: space-between; padding: 4px 0; }
        .grand-total-row { margin-top: 6px; padding-top: 6px; border-top: 1px solid #333; font-weight: 700; font-size: 13px; }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: flex-end;
            page-break-inside: avoid;
        }
        .signature-seal-area {
            display: flex;
            align-items: flex-end;
            gap: 30px;
        }
        .signature-block {
            text-align: center;
        }
        .signature-image { 
            max-height: 50px;
            display: block;
            margin: 0 auto 8px auto;
        }
        .signature-name {
            font-size: 11px;
            font-weight: 600;
        }
        .signature-nif {
            font-size: 10px;
            color: #555;
        }
        .seal-block {
            text-align: center;
        }
        .seal-image {
            max-height: 80px;
            object-fit: contain;
        }
      `}</style>

      <div className="page-container">
        <div className="main-content">
          <div className="header">
            <div className="company-details">
              {user.logoUrl && <img className="logo" src={user.logoUrl} alt="Logo" />}
              <div className="company-name" translate="no">{user.name}</div>
              <div className="company-info">{user.nif}</div>
              <div className="company-info" translate="no">{user.address}</div>
              <div className="company-info" translate="no">{user.email}</div>
            </div>
            <div className="invoice-details">
              <div className="invoice-title">FACTURA</div>
              <div className="invoice-number">{invoice.invoiceNumber}</div>
              <div className="invoice-date">Fecha: {new Date(invoice.date).toLocaleDateString('es-ES')}</div>
            </div>
          </div>

          <div className="client-info">
            <div className="bill-to">Facturar a:</div>
            <div translate="no">{invoice.client.name}</div>
            <div>{invoice.client.nif}</div>
            <div translate="no">{invoice.client.address}</div>
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
                  <td translate="no">{item.description}</td>
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

        {(user.signatureUrl || user.sealUrl) && (
            <footer className="footer">
                <div className="signature-seal-area">
                {user.signatureUrl && (
                    <div className="signature-block">
                    <img src={user.signatureUrl} alt="Firma" className="signature-image" />
                    <p className="signature-name" translate="no">{user.name}</p>
                    {user.nif && <p className="signature-nif">{user.nif}</p>}
                    </div>
                )}
                {user.sealUrl && (
                    <div className="seal-block">
                    <img src={user.sealUrl} alt="Sello" className="seal-image" />
                    </div>
                )}
                </div>
            </footer>
        )}
      </div>
    </>
  );
}
