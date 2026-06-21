from decimal import Decimal
from typing import Dict

from pydantic import BaseModel


class ProviderDashboard(BaseModel):
    provider_id: int
    total_customers: int
    total_jobs: int
    jobs_by_status: Dict[str, int]
    total_quotes: int
    quotes_by_status: Dict[str, int]
    total_quoted_value: Decimal
    accepted_quote_value: Decimal
    completed_job_revenue: Decimal
    average_job_value: Decimal
