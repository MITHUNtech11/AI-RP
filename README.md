# AI Resume Parser

A comprehensive AI-powered resume parsing system that converts resumes from various formats (PDF, DOCX, images, text) into structured JSON data using OCR and large language models. The system provides both a FastAPI backend for programmatic access and a Streamlit web interface for easy file uploads and result visualization.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
  - [API Usage](#api-usage)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)
- [Troubleshooting](#troubleshooting)

## Overview

The AI Resume Parser is designed to automate the extraction of structured information from resumes. It supports multiple file formats and uses advanced AI models to parse complex document layouts. The system is built with scalability in mind, supporting both single-file processing and batch operations.

Key capabilities:
- Intelligent file type detection and routing
- Multi-page document support
- Batch processing for ZIP archives
- Real-time processing with progress tracking
- Structured JSON output with validation
- Web-based interface for non-technical users

## Features

### Core Functionality
- **Multi-format Support**: Processes PDF, DOCX, images (JPG, PNG, BMP, TIFF), and text files
-- **Intelligent Parsing**: Uses OCR (image-to-text) and a generative model (Gemini or similar) for structured extraction
- **Batch Processing**: Handle multiple resumes in a single ZIP upload
- **Real-time Results**: Fast processing with detailed timing information
- **Error Handling**: Comprehensive error reporting and fallback mechanisms

### Technical Features
- **RESTful API**: FastAPI-based backend with automatic OpenAPI documentation
- **Web Interface**: Streamlit frontend for easy file uploads and JSON visualization
- **Authentication**: Optional API key authentication for secure access
- **CORS Support**: Cross-origin resource sharing for web applications
- **Logging**: Detailed processing logs for monitoring and debugging
- **File Tracking**: Unique file IDs for result retrieval and auditing

### Output Structure
The parser extracts comprehensive resume information including:
- Personal details (name, contact, demographics)
- Professional summary
- Skills and competencies
- Work experience with detailed employment history
- Educational qualifications
- Languages and additional information

## Architecture

The system follows a modular architecture with clear separation of concerns:

```
├── main.py                 # FastAPI application and API endpoints
├── streamlit_app.py        # Streamlit web interface
├── config/                 # Configuration and authentication
│   ├── settings.py        # Application settings and constants
│   ├── auth.py           # API key authentication logic
│   └── ssl_config.py     # SSL/TLS configuration
├── models/                # Data models and schemas
│   └── schemas.py        # Pydantic models for request/response validation
├── services/              # Core business logic
│   ├── azure_vision.py   # Generative extraction integration (uses Gemini proxy). Consider renaming when switching OCR provider
│   ├── converter.py      # File format conversion utilities
│   └── logger.py         # Logging and monitoring
├── utils/                 # Utility functions
│   └── ssl_config.py     # SSL utilities
└── uploads/               # Temporary file storage
```

### Data Flow
1. **File Upload**: User uploads resume file via API or web interface
2. **Type Detection**: System determines file type and routes to appropriate handler
3. **Preprocessing**: Convert binary files to images/text as needed
4. **AI Processing**: Use OCR (e.g., Google Cloud Vision or Tesseract) for image-to-text, and Gemini (or another generative model) for structured extraction
5. **Validation**: Validate extracted data against Pydantic schemas
6. **Response**: Return structured JSON with processing metadata

## Prerequisites

- **Python**: 3.9 or higher
- **Azure Account**: With Computer Vision service enabled
- **OpenAI Account**: With API access (for GPT models)
- **System Dependencies**:
  - Poppler (for PDF processing on Linux)
  - LibreOffice (optional, for enhanced DOCX support)

### Generative Model & OCR Setup

1. If you plan to use a hosted generative model (Gemini/Vertex AI or other), obtain the API key and endpoint and put them in your `.env` as shown in `config/settings.py` (e.g., `GEMINI_API_KEY` and `GEMINI_ENDPOINT`).

2. For OCR (image → text) choose one of:
  - Google Cloud Vision API (recommended for high-quality OCR)
  - Tesseract (open-source, local) — requires installing `tesseract-ocr` on the host

3. Configure the relevant credentials (Cloud Vision key or ensure Tesseract is installed) before running multi-page image parsing.

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ai-resume-parser
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv .venv
   # On Windows:
   .\.venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify installation**:
  ```bash
  python -c "import fastapi, streamlit; print('All dependencies installed')"
  ```

## Configuration

### Environment Variables

Create a `.env` file in the project root or set environment variables:

```bash
# Generative model (Gemini or similar)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta2/models/your-model:generate

# OCR configuration (choose one approach)
# If using Google Cloud Vision, set the credentials accordingly or enable the API
# If using local Tesseract, install tesseract-ocr on the host

# Application Settings
REQUIRE_AUTH=true
MAX_FILE_SIZE_MB=10
ALLOWED_FORMATS=.pdf,.docx,.doc,.jpg,.jpeg,.png,.bmp,.tiff,.txt
```

### Streamlit Secrets

For the web interface, create `st.secrets` configuration:

```toml
# .streamlit/secrets.toml
api_base = "http://localhost:8000"
api_key = "your-api-key-if-auth-enabled"
```

### Settings File

Review and modify `config/settings.py` for application-wide settings:

- File size limits
- Supported formats
- Authentication requirements
- Processing timeouts

## Usage

### Running the Backend

Start the FastAPI server:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API Base**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Running the Frontend

Start the Streamlit application:

```bash
streamlit run streamlit_app.py
```

Access the web interface at http://localhost:8501

### API Usage

#### Single File Processing

```bash
# Using curl
curl -X POST "http://localhost:8000/parse" \
  -H "X-API-Key: your-api-key" \
  -F "file=@resume.pdf" \
  -o result.json
```

#### Python Example

```python
import requests

url = "http://localhost:8000/parse"
headers = {"X-API-Key": "your-api-key"}
files = {"file": open("resume.pdf", "rb")}

response = requests.post(url, headers=headers, files=files)
result = response.json()

print(f"Status: {result['status']}")
print(f"Processing Time: {result['processing_time']}s")
print(f"Name: {result['data']['name']}")
```

#### Batch Processing

```bash
# Upload ZIP file with multiple resumes
curl -X POST "http://localhost:8000/parse_batch" \
  -H "X-API-Key: your-api-key" \
  -F "file=@resumes.zip" \
  -o batch_results.json
```

## API Reference

### Endpoints

#### GET /
Root endpoint providing API information.

**Response**:
```json
{
  "name": "Resume Parser API",
  "version": "2.0.0",
  "authentication": "enabled",
  "endpoints": {
    "recommended": "/parse (auto-routes based on file type)",
    "image_files": "/parse_resume (PDF, DOCX, Images)",
    "text_files": "/parse_resume_txt (.txt only)",
    "batch": "/parse_batch (ZIP files with multiple resumes)"
  },
  "docs": "/docs"
}
```

#### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "healthy"
}
```

#### POST /parse
Intelligent orchestrator endpoint that automatically routes based on file type.

**Parameters**:
- `file`: UploadFile - The resume file to process

**Headers**:
- `X-API-Key`: API key (if authentication enabled)

**Supported Formats**: All supported file types (PDF, DOCX, images, text)

**Response**: `ParseResponse`

#### POST /parse_resume
Process binary files (PDF, DOCX, images) through image-based OCR pipeline.

**Parameters**:
- `file`: UploadFile - Binary resume file

**Supported Formats**: PDF, DOCX, JPG, JPEG, PNG, BMP, TIFF, JFIF

**Response**: `ParseResponse`

#### POST /parse_resume_txt
Process text-based files directly without OCR.

**Parameters**:
- `file`: UploadFile - Text resume file

**Supported Formats**: TXT, RTF, MD, CSV, JSON, XML, PY, JS, HTML, CSS, C, CPP, JAVA, SH, ODT, TEX, RST, YAML, YML

**Response**: `ParseResponse`

#### POST /parse_batch
Process multiple resumes from a ZIP archive.

**Parameters**:
- `file`: UploadFile - ZIP file containing resume files

**Response**:
```json
{
  "status": "batch_complete",
  "total_files": 5,
  "successful": 4,
  "failed": 1,
  "results": [...],
  "total_processing_time": 45.2
}
```

### Response Schemas

#### ParseResponse
```json
{
  "status": "success",
  "data": {
    "first_name": "John",
    "last_name": "Doe",
    "name": "John Doe",
    "initial": "JD",
    "email": "john.doe@email.com",
    "phone": "+1-555-0123",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "marital_status": "single",
    "nationality": "American",
    "summary": "Experienced software engineer...",
    "address": {
      "street_address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "country": "USA",
      "pincode": "12345"
    },
    "highest_qualification": "Bachelor of Science",
    "skills": ["Python", "JavaScript", "React"],
    "hobbies": ["Reading", "Hiking"],
    "languages": [
      {
        "language": "English",
        "can_read": "yes",
        "can_speak": "yes",
        "can_write": "yes"
      }
    ],
    "work_status": "experienced",
    "employment": [
      {
        "company_name": "Tech Corp",
        "designation": "Senior Developer",
        "startDate": "2020-01-01",
        "endDate": "2023-12-31",
        "employment_type": "full-time",
        "job_profile": "Full-stack development",
        "department": "Engineering",
        "current_ctc": "150000",
        "relevant_experience": "3 years"
      }
    ],
    "qualifications": [
      {
        "qualification": "Bachelor of Computer Science",
        "specialization": "Software Engineering",
        "university_name": "State University",
        "college_or_school": "College of Engineering",
        "year_of_completion": "2019",
        "percentage": "85%",
        "registration_no": "CS2019001"
      }
    ]
  },
  "processing_time": 12.5,
  "error": null,
  "file_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Testing

### Running Tests

Execute the test suite using pytest:

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest test_auth.py

# Run with coverage
pytest --cov=.
```

### Test Coverage

The test suite covers:
- API endpoint functionality
- Authentication mechanisms
- File processing pipelines
- Error handling scenarios
- Schema validation

### Sample Test Data

Use the provided sample files in the `uploads/` directory or create test resumes for validation.

## Development

### Project Structure

Follow the established modular structure:
- Keep business logic in `services/`
- Define data models in `models/`
- Handle configuration in `config/`
- Place utilities in `utils/`

### Code Style

- Follow PEP 8 conventions
- Use type hints for function parameters and return values
- Write comprehensive docstrings
- Maintain test coverage above 80%

### Adding New Features

1. **Plan the feature**: Define requirements and API changes
2. **Implement core logic**: Add functionality to appropriate service modules
3. **Update schemas**: Modify Pydantic models if needed
4. **Add API endpoints**: Extend FastAPI routes
5. **Update frontend**: Modify Streamlit interface if applicable
6. **Write tests**: Ensure comprehensive test coverage
7. **Update documentation**: Reflect changes in README and API docs

### Local Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run with auto-reload
uvicorn main:app --reload --log-level debug

# Run tests in watch mode
pytest-watch
```

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** with proper tests
4. **Run the test suite**: `pytest`
5. **Update documentation** if needed
6. **Commit your changes**: `git commit -m "Add feature description"`
7. **Push to your branch**: `git push origin feature/your-feature-name`
8. **Create a Pull Request**

### Code Review Process

- All PRs require review before merging
- Maintain code quality and test coverage
- Follow established coding standards
- Provide clear commit messages

### Issue Reporting

- Use GitHub Issues for bug reports and feature requests
- Provide detailed reproduction steps for bugs
- Include relevant error messages and logs
- Specify your environment (OS, Python version, etc.)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

If no LICENSE file exists, please add one before distributing the software.

## Troubleshooting

### Common Issues

#### Authentication / API Errors
```
Error: Authentication failed when calling external AI or OCR services
```
**Solution**: Verify your configured keys and endpoints (e.g., `GEMINI_API_KEY`, `GEMINI_ENDPOINT`, or your OCR provider credentials). Ensure the services are enabled and have sufficient quota.

#### File Processing Failures
```
Error: File format not supported
```
**Solution**: Ensure your file is in a supported format. Check `ALLOWED_FORMATS` in settings.

#### Large File Errors
```
Error: File too large
```
**Solution**: Reduce file size or increase `MAX_FILE_SIZE_MB` in settings.

### Performance Issues

- **Slow processing**: Check generative/OCR API latency (Gemini, Cloud Vision, etc.)
- **Memory usage**: Monitor system resources during batch processing
- **Timeout errors**: Increase timeout values in configuration

### Logging and Debugging

Enable debug logging:

```bash
uvicorn main:app --log-level debug
```

Check processing logs in `processing_log.txt` for detailed error information.

### Getting Help

- Check the [API Documentation](http://localhost:8000/docs) when running
- Review the [Issues](https://github.com/your-repo/issues) page
- Contact the maintainers for support

---

For more information or support, please visit the project repository or contact the development team.
