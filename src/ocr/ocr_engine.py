import fitz  # PyMuPDF
import easyocr
import os
from PIL import Image
import numpy as np

class OCREngine:
    def __init__(self, languages=['en', 'hi']):
        """
        Initialize the OCR engine with supported languages.
        Default languages: English, Hindi.
        Note: Urdu (ur) requires a separate reader as it's not compatible with Devnagari (hi) in EasyOCR.
        """
        self.languages = languages
        self.readers = {}
        # Pre-initialize the primary reader
        self._get_reader(tuple(languages))
        print(f"OCR Engine initialized for languages: {languages}")

    def _get_reader(self, lang_tuple):
        """
        Returns a memoized EasyOCR reader instance for the given language combination.
        """
        if lang_tuple not in self.readers:
            try:
                self.readers[lang_tuple] = easyocr.Reader(list(lang_tuple))
            except ValueError as e:
                # If combined initialization fails, try to fallback or split
                print(f"Warning: Could not initialize combined reader for {lang_tuple}: {e}")
                # Fallback to English if everything fails
                if ('en',) not in self.readers:
                    self.readers[('en',)] = easyocr.Reader(['en'])
                return self.readers[('en',)]
        return self.readers[lang_tuple]

    def extract_text_from_pdf(self, pdf_path):
        """
        Extract text from a PDF. If a page has minimal text, it uses OCR to supplement.
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
            
        doc = fitz.open(pdf_path)
        output = []
        print(f"Processing {pdf_path} ({len(doc)} pages)...")

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text().strip()
            
            # Hybrid Approach: If text is suspiciously short, run OCR
            if len(text) > 200:
                output.append({
                    "page_number": page_num + 1,
                    "content": text,
                    "type": "text"
                })
            else:
                # Scanned/Image-based or minimal text page - Boost resolution for accuracy
                # Zoom factor 2.0 = 144 DPI (Double the default)
                mat = fitz.Matrix(2, 2)
                pix = page.get_pixmap(matrix=mat)
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                ocr_results = self._get_reader(tuple(self.languages)).readtext(np.array(img), detail=0)
                combined_content = text + "\n" + " ".join(ocr_results) if text else " ".join(ocr_results)
                
                output.append({
                    "page_number": page_num + 1,
                    "content": combined_content.strip(),
                    "type": "ocr" if not text else "hybrid"
                })
                
            if (page_num + 1) % 5 == 0:
                print(f"  Processed {page_num + 1}/{len(doc)} pages...")

        doc.close()
        return output

    def extract_text_from_image(self, image_path):
        """
        Extract text from a single image file.
        """
        result = self._get_reader(tuple(self.languages)).readtext(image_path, detail=0)
        return " ".join(result)

if __name__ == "__main__":
    # Example usage
    # engine = OCREngine()
    # text = engine.extract_text_from_pdf("path/to/ncert_book.pdf")
    pass
