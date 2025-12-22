import { useEffect, useState } from 'react';
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
  const [blobUrl, setBlobUrl] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const fetchPdf = async () => {
      try {
        const res = await fetch('/api/attachment', {
          method: 'GET',
          credentials: 'include',
          headers: new Headers({
            'x-dialog-token': dialogToken || '',
            'x-pdf-url': pdfUrl,
          }),
        });
        const blob = await res.blob();

        if (!cancelled && blob) {
          setBlobUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPdf();

    return () => {
      cancelled = true;
    };
  }, [dialogToken]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!blobUrl) {
    return null;
  }

  return (
    <Document file={blobUrl} onLoadSuccess={onDocumentLoadSuccess}>
      {Array.from(new Array(numPages || 0), (_, index) => (
        <Page key={`page_${index + 1}`} pageNumber={index + 1} width={600} />
      ))}
    </Document>
  );
}

export default PdfViewer;
