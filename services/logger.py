"""
Processing logger for tracking request times
"""

from datetime import datetime
from config.settings import LOG_FILE


def log_processing(filename: str, processing_time: float, status: str, error: str = None):
    """
    Log processing result to processing_log.txt
    
    Format:
    2025-11-07 13:09:45 | resume1.pdf | 18.32s | SUCCESS
    """
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if error:
        log_entry = f"{timestamp} | {filename} | {processing_time:.2f}s | FAILED ({error[:50]})\n"
    else:
        log_entry = f"{timestamp} | {filename} | {processing_time:.2f}s | {status}\n"
    
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(log_entry)
