from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .services.opportunities_ingest import run_ingest

scheduler = AsyncIOScheduler()


def setup_jobs():
    scheduler.add_job(
        run_ingest,
        "interval",
        minutes=60,
        next_run_time=datetime.now(),
        id="opportunities_ingest",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
