# **App Name**: InvoiceFlow

## Core Features:

- User Authentication: Secure user registration and login with email and password.
- Invoice Creation: Users can create invoices by entering concepts, quantity, and unit price. The system should show the latest invoices first.
- Automatic Calculation: Automatically calculate subtotal, 10% VAT, and total amount with VAT. These will act as tools to aid in the invoicing process. Reasoning is incorporated by the LLM tool deciding if each step in the process has been correctly executed.
- Automatic Invoice Numbering: Automatically generate invoice numbers (e.g., F-001, F-002...).
- PDF Generation: Automatically generate professional PDF invoices with user's logo, company information, client information, invoice details, totals, and signature/seal. Utilizes Firebase extension for PDF generation.
- Profile Configuration: Users can upload/update their company logo, signature, and seal in the settings screen.
- Invoice Management: Store generated PDFs in Firebase Storage, display them in the app with options to download or send via email.  Each user can only see their invoices. Invoice documents will be stored in Firestore with appropriate access restrictions.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) for a professional and trustworthy feel.
- Background color: Light grey (#ECEFF1) for a clean and modern look.
- Accent color: Teal (#009688) to highlight key actions and elements.
- Body and headline font: 'Inter' for a modern, neutral, readable feel.
- Use clean, simple icons for navigation and actions.
- Admin panel style layout with large buttons and readable typography. Prioritize clear and easy navigation.
- Subtle transitions and animations to enhance user experience.