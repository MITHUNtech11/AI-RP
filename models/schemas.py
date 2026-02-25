from pydantic import BaseModel, Field
from typing import List, Optional, Literal


class Address(BaseModel):
    street_address: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    pincode: Optional[str] = None


class Language(BaseModel):
    language: Optional[str] = None
    can_read: Optional[Literal['yes', 'no']] = None
    can_speak: Optional[Literal['yes', 'no']] = None
    can_write: Optional[Literal['yes', 'no']] = None


class EmploymentEntry(BaseModel):
    endDate: Optional[str] = None
    startDate: Optional[str] = None
    department: Optional[str] = None
    current_ctc: Optional[str] = None
    designation: Optional[str] = None
    job_profile: Optional[str] = None
    company_name: Optional[str] = None
    employment_type: Optional[Literal['full-time', 'part-time', 'internship', 'contract', 'freelance']] = None
    relevant_experience: Optional[str] = None


class QualificationEntry(BaseModel):
    search: Optional[str] = None
    percentage: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    registration_no: Optional[str] = None
    university_name: Optional[str] = None
    college_or_school: Optional[str] = None
    year_of_completion: Optional[str] = None


class ResumeData(BaseModel):
    first_name: str
    last_name: str
    name: str
    initial: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[Literal['male', 'female']] = None
    marital_status: Optional[Literal['single', 'married', 'divorced', 'separated', 'widowed']] = None
    nationality: Optional[str] = None
    summary: Optional[str] = None
    address: Optional[Address] = None
    highest_qualification: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    hobbies: List[str] = Field(default_factory=list)
    languages: List[Language] = Field(default_factory=list)
    work_status: Optional[Literal['freshers', 'experienced']] = None
    employment: List[EmploymentEntry] = Field(default_factory=list)
    qualifications: List[QualificationEntry] = Field(default_factory=list)


class ParseResponse(BaseModel):
    status: str = "success"
    data: Optional[ResumeData] = None
    processing_time: float = 0.0
    error: Optional[str] = None
    file_id: Optional[str] = None
