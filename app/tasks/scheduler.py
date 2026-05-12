"""Celery Beat task — runs every minute to fire due scheduled tasks."""
import uuid as uuid_lib
import datetime
from app.worker import celery_app
from app.database import SessionLocal
from app.models.task import ScheduledTask
from app.models.agent import Agent, Run
from app.models.session import Session, Message
from app.logging_config import log


def _is_due(task: ScheduledTask, now: datetime.datetime) -> bool:
    """Return True if this task should fire right now."""
    if not task.is_active:
        return False

    if task.schedule_type == "once":
        if task.run_at is None:
            return False
        # Fire if run_at has passed and never run
        return task.last_run_at is None and now >= task.run_at

    if task.schedule_type == "daily":
        if not task.time_of_day:
            return False
        h, m = map(int, task.time_of_day.split(":"))
        # Due if current hour:minute matches and haven't run today
        due_today = now.hour == h and now.minute == m
        already_run_today = (
            task.last_run_at is not None
            and task.last_run_at.date() == now.date()
        )
        return due_today and not already_run_today

    if task.schedule_type == "weekly":
        if not task.time_of_day or not task.day_of_week:
            return False
        h, m = map(int, task.time_of_day.split(":"))
        day_names = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        today_name = day_names[now.weekday()]
        due_today = today_name == task.day_of_week.lower() and now.hour == h and now.minute == m
        already_run_this_week = (
            task.last_run_at is not None
            and task.last_run_at.date() == now.date()
        )
        return due_today and not already_run_this_week

    return False


@celery_app.task
def check_scheduled_tasks():
    """Poll the scheduled_tasks table and fire any that are due."""
    db = SessionLocal()
    now = datetime.datetime.utcnow()
    fired = 0

    try:
        tasks = db.query(ScheduledTask).filter(ScheduledTask.is_active == True).all()

        for task in tasks:
            if not _is_due(task, now):
                continue

            agent = db.query(Agent).filter(
                Agent.id == task.agent_id,
                Agent.user_id == task.user_id,
            ).first()
            if not agent:
                log.warn("scheduled_task_no_agent", task_id=str(task.id))
                continue

            # Create a dedicated session for this scheduled run
            session = Session(
                user_id=task.user_id,
                title=f"Scheduled: {task.prompt[:50]}",
            )
            db.add(session)
            db.commit()
            db.refresh(session)

            # User message
            user_msg = Message(
                session_id=session.id,
                user_id=task.user_id,
                role="user",
                content=task.prompt,
            )
            db.add(user_msg)
            db.commit()

            # Inject org context + memories
            from app.models.context import OrgContext, Memory
            from app.coordinator import build_context_preamble
            org_ctx = db.query(OrgContext).filter(OrgContext.user_id == task.user_id).first()
            memories = (
                db.query(Memory)
                .filter(Memory.user_id == task.user_id)
                .order_by(Memory.created_at.desc())
                .limit(20)
                .all()
            )
            preamble = build_context_preamble(org_ctx, memories)
            task_prompt = f"{preamble}{task.prompt}" if preamble else task.prompt

            # Create run
            run = Run(
                user_id=task.user_id,
                agent_id=agent.id,
                session_id=session.id,
                task_prompt=task_prompt,
            )
            db.add(run)
            db.commit()
            db.refresh(run)

            # Assistant placeholder
            assist_msg = Message(
                session_id=session.id,
                user_id=task.user_id,
                role="assistant",
                content=f"Running {agent.agent_type or agent.name} agent...",
                agent_type=agent.agent_type,
                run_id=run.id,
            )
            db.add(assist_msg)
            db.commit()
            db.refresh(assist_msg)

            # Queue run
            from app.tasks.run_agent import execute_run
            execute_run.delay(
                str(uuid_lib.UUID(str(run.id))),
                task_prompt,
                str(uuid_lib.UUID(str(assist_msg.id))),
            )

            # Mark last run
            task.last_run_at = now
            # Deactivate one-time tasks after firing
            if task.schedule_type == "once":
                task.is_active = False
            db.commit()

            fired += 1
            log.info("scheduled_task_fired",
                     task_id=str(task.id),
                     agent=agent.name,
                     schedule_type=task.schedule_type)

    except Exception as e:
        log.error("scheduler_error", error=str(e))
    finally:
        db.close()

    if fired:
        log.info("scheduler_ran", fired=fired, checked=len(tasks) if 'tasks' in dir() else 0)
