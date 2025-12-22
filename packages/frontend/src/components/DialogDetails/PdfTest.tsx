import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// With user 14886498226
const pdfUrl =
  'https://dialogporten-serviceprovider-ahb4fkchhgceevej.norwayeast-01.azurewebsites.net/attachment/sample.pdf';

interface PdfViewerProps {
  dialogToken?: string;
}

function PdfViewer({ dialogToken }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);

  // Use BFF proxy URL with dialogToken - react-pdf will fetch it directly
  const proxyUrl = dialogToken
    ? `/api/attachment?url=${encodeURIComponent(pdfUrl)}&dialogToken=${encodeURIComponent(dialogToken)}`
    : `/api/attachment?url=${encodeURIComponent(pdfUrl)}`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <Document file={proxyUrl} onLoadSuccess={onDocumentLoadSuccess}>
      {Array.from(new Array(numPages || 0), (_, index) => (
        <Page key={`page_${index + 1}`} pageNumber={index + 1} width={600} />
      ))}
    </Document>
  );
}

export default PdfViewer;
