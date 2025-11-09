'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice, User } from '@/lib/definitions';
import { formatCurrency } from '@/lib/utils';

interface InvoicePDFDocumentProps {
  invoice: Invoice;
  user: User;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 30,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 10,
  },
  companyDetails: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  companyInfo: {
    fontSize: 9,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  invoiceDetails: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  invoiceNumber: {
    fontSize: 11,
  },
  invoiceDate: {
    fontSize: 11,
  },
  clientInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#d1d5db',
    fontWeight: 'bold',
  },
  tableHeaderCell: {
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    padding: 8,
  },
  colDescription: { width: '55%' },
  colQty: { width: '15%', textAlign: 'right' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  totals: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsContainer: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
  },
  totalValue: {
    textAlign: 'right',
  },
  grandTotalRow: {
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderColor: '#333',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
});

export function InvoicePDFDocument({ invoice, user }: InvoicePDFDocumentProps) {
    const vatRate = user.vatRate ?? 0.10;
    
    return (
        <Document title={`Factura ${invoice.invoiceNumber}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyDetails}>
                        {user.logoUrl && <Image style={styles.logo} src={user.logoUrl} />}
                        <Text style={[styles.companyName, { marginTop: user.logoUrl ? 10 : 0 }]}>{user.name}</Text>
                        <Text style={styles.companyInfo}>{user.nif}</Text>
                        <Text style={styles.companyInfo}>{user.address}</Text>
                        <Text style={styles.companyInfo}>{user.email}</Text>
                    </View>
                    <View style={styles.invoiceDetails}>
                        <Text style={styles.invoiceTitle}>FACTURA</Text>
                        <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                        <Text style={styles.invoiceDate}>Fecha: {new Date(invoice.date).toLocaleDateString('es-ES')}</Text>
                    </View>
                </View>
                
                {/* Client Info */}
                <View style={styles.clientInfo}>
                    <View>
                        <Text style={styles.billTo}>Facturar a:</Text>
                        <Text>{invoice.client.name}</Text>
                        <Text>{invoice.client.nif}</Text>
                        <Text>{invoice.client.address}</Text>
                    </View>
                </View>
                
                {/* Line Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colDescription]}>Descripción</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQty]}>Cantidad</Text>
                        <Text style={[styles.tableHeaderCell, styles.colPrice]}>Precio</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                    </View>
                    {invoice.lineItems.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colDescription]}>{item.description}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unitPrice)}</Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totals}>
                    <View style={styles.totalsContainer}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>IVA ({vatRate * 100}%)</Text>
                            <Text style={styles.totalValue}>{formatCurrency(invoice.vat)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotalRow]}>
                            <Text style={styles.totalLabel}>TOTAL</Text>
                            <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>Gracias por su confianza.</Text>
            </Page>
        </Document>
    );
}