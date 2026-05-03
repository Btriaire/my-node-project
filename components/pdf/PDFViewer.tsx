"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface Props {
  url: string;
  highlightKeyword?: string;
  onTextExtracted?: (text: string) => void;
}

export function PDFViewer({ url, highlightKeyword, onTextExtracted }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);

  const onLoadSuccess = useCallback(
    async ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
  );

  const customTextRenderer = useCallback(
    ({ str }: { str: string }) => {
      if (!highlightKeyword || highlightKeyword.trim().length < 2) return str;
      const escaped = highlightKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      return str.replace(
        regex,
        '<mark style="background:#f59e0b;color:#000;border-radius:2px;padding:0 1px">$1</mark>'
      );
    },
    [highlightKeyword]
  );

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-neutral-400">
            {currentPage} / {numPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-neutral-500 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center py-6 px-4">
        <Document
          file={url}
          onLoadSuccess={onLoadSuccess}
          className="shadow-2xl"
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            className="bg-white"
            renderTextLayer
            renderAnnotationLayer
            customTextRenderer={customTextRenderer}
          />
        </Document>
      </div>
    </div>
  );
}
