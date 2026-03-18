"""
Convert PDF, DOCX, and images to PNG format
Support for multi-page documents
"""

import os
import tempfile
import zipfile
import logging
from pathlib import Path
import docx2pdf
from io import BytesIO
from docx import Document


def convert_to_png_list(file_content: bytes, filename: str) -> list:
    """
    Convert any supported file format to list of PNG bytes
    For multi-page documents, returns list of PNGs (one per page)
    For single images, returns list with one PNG
    """
    
    file_ext = Path(filename).suffix.lower()
    
    try:
        if file_ext in ['.jpg', '.jpeg', '.bmp', '.tiff', '.jfif']:
            return [_convert_image_to_png(file_content)]
        
        elif file_ext == '.png':
            return [file_content]
        
        elif file_ext == '.pdf':
            return _convert_pdf_to_png_list(file_content)
        
        elif file_ext in ['.docx', '.doc']:
            return _convert_docx_to_png_list(file_content)
        
        else:
            raise ValueError(f"Unsupported format: {file_ext}")
    
    except DocxConversionError:
        raise
    except Exception as e:
        raise Exception(f"Conversion failed: {e}")


def _convert_image_to_png(image_bytes: bytes) -> bytes:
    """Convert any image format to PNG bytes"""
    try:
        from PIL import Image
    except Exception as e:
        raise Exception("Pillow is required to process image files. Install Pillow: pip install Pillow") from e

    img = Image.open(BytesIO(image_bytes))
    
    # Convert to RGB if needed
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Save to bytes
    output = BytesIO()
    img.save(output, format='PNG', optimize=True)
    output.seek(0)
    
    return output.getvalue()


def _convert_pdf_to_png_list(pdf_bytes: bytes) -> list:
    """
    Convert PDF to list of PNG bytes (one per page)
    """
    
    # Import PyMuPDF (fitz) lazily so the server can start without it installed.
    try:
        import fitz
    except Exception as e:
        raise Exception("PyMuPDF (fitz) is required to convert PDFs to images. Install PyMuPDF or avoid PDF endpoints: pip install PyMuPDF") from e

    # Open PDF from bytes
    pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")
    png_list = []
    
    try:
        # Render each page
        mat = fitz.Matrix(300/72, 300/72)  # 300 DPI
        
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            pix = page.get_pixmap(matrix=mat, alpha=False)
            
            # Convert to PNG bytes
            png_bytes = pix.tobytes(output="png")
            png_list.append(png_bytes)
    
    finally:
        pdf_document.close()
    
    return png_list


class DocxConversionError(Exception):
    """Raised when docx-to-pdf conversion fails"""


def _convert_docx_to_png_list(docx_bytes: bytes) -> list:
    """
    Convert DOCX to list of PNG bytes.
    Falls back to text extraction if PDF conversion fails.
    """
    
    # Try PDF conversion first (for visual rendering)
    try:
        # Use a more reliable temp approach - write to system temp with unique name
        import tempfile
        import logging
        
        fd, temp_docx = tempfile.mkstemp(suffix='.docx', text=False)
        try:
            os.write(fd, docx_bytes)
            os.close(fd)
            
            fd_pdf, temp_pdf = tempfile.mkstemp(suffix='.pdf', text=False)
            os.close(fd_pdf)
            
            try:
                docx2pdf.convert(temp_docx, temp_pdf)
                
                # Read PDF and convert to PNG list
                with open(temp_pdf, 'rb') as f:
                    pdf_bytes = f.read()
                
                return _convert_pdf_to_png_list(pdf_bytes)
                
            finally:
                # Clean up temp PDF
                if os.path.exists(temp_pdf):
                    try:
                        os.remove(temp_pdf)
                    except:
                        pass
        finally:
            # Clean up temp DOCX
            if os.path.exists(temp_docx):
                try:
                    os.remove(temp_docx)
                except:
                    pass
    
    except Exception as e:
        # If PDF conversion fails, fall back to text extraction and convert text to image
        logging.warning(f"DOCX to PDF conversion failed, falling back to text extraction: {e}")
        
        try:
            # Extract text from DOCX
            text_content = extract_text_from_docx_bytes(docx_bytes)
            
            # Create a simple image with the text content
            from PIL import ImageDraw, Image
            
            # Create a simple white image with black text
            img = Image.new('RGB', (800, 1100), color='white')
            draw = ImageDraw.Draw(img)
            
            # Try to use a default font, fall back to default if not available
            try:
                from PIL import ImageFont
                font = ImageFont.load_default()
            except:
                font = None
            
            # Split text into lines and draw
            lines = text_content.split('\n')
            y_position = 50
            line_height = 20
            max_width = 750
            
            for line in lines:
                # Wrap long lines
                while len(line) > 80:
                    draw.text((50, y_position), line[:80], fill='black', font=font)
                    y_position += line_height
                    line = line[80:]
                
                if line:
                    draw.text((50, y_position), line, fill='black', font=font)
                    y_position += line_height
                
                # Check if we need to extend image height
                if y_position > img.size[1] - 100:
                    new_img = Image.new('RGB', (img.size[0], img.size[1] + 1000), color='white')
                    new_img.paste(img, (0, 0))
                    img = new_img
            
            # Convert to PNG bytes
            output = BytesIO()
            img.save(output, format='PNG')
            output.seek(0)
            
            return [output.getvalue()]
            
        except Exception as fallback_error:
            raise DocxConversionError(f"DOCX conversion failed (PDF and text fallback): {str(e)}") from e


def extract_text_from_docx_bytes(docx_bytes: bytes) -> str:
    """Return the plain text from a DOCX so a text-parsing fallback can run"""

    with BytesIO(docx_bytes) as buffer:
        document = Document(buffer)

    paragraphs = [para.text.strip() for para in document.paragraphs if para.text.strip()]
    return "\n".join(paragraphs)


# Resume file extensions supported for batch processing
RESUME_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.jfif'}


def extract_files_from_zip(zip_bytes: bytes, extract_dir: str = None) -> list:
    """
    Extract all files from a ZIP archive.
    Returns list of tuples: (filename, file_bytes)
    If extract_dir is provided, also writes files to disk.
    """
    files = []
    
    with BytesIO(zip_bytes) as zip_buffer:
        with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
            for file_info in zip_ref.filelist:
                # Skip directories and __MACOSX
                if file_info.filename.endswith('/') or '__MACOSX' in file_info.filename:
                    continue
                
                file_bytes = zip_ref.read(file_info.filename)
                filename = Path(file_info.filename).name  # Get just the filename, not path
                
                if extract_dir:
                    full_path = os.path.join(extract_dir, filename)
                    with open(full_path, 'wb') as f:
                        f.write(file_bytes)
                
                files.append((filename, file_bytes))
    
    return files


def get_resume_files_from_zip(zip_bytes: bytes) -> list:
    """
    Extract and filter only resume files from a ZIP.
    Returns list of tuples: (filename, file_bytes) for supported resume formats.
    """
    all_files = extract_files_from_zip(zip_bytes)
    resume_files = []
    
    for filename, file_bytes in all_files:
        file_ext = Path(filename).suffix.lower()
        if file_ext in RESUME_EXTENSIONS:
            resume_files.append((filename, file_bytes))
    
    return resume_files

