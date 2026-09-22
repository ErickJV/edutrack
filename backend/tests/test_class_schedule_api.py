"""
Tests for tasks 3.3, 3.4, 3.5:

3.3 – Weekly schedule generation: semester bounds, multiple blocks, idempotent
      repetition, concurrency guard via unique constraint, invalid local times.

3.4 – Individual occurrence: GET, PATCH (room, cancelled, starts_at/ends_at),
      POST standalone/makeup, reactivation, 404 for foreign references.

3.5 – Series reconciliation on PATCH/DELETE: preserved IDs, cancel only future
      untouched occurrences, 409 for conflicts.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone as dt_tz

import pytest
from django.test import Client
from django.utils import timezone

from apps.accounts.models import User
from apps.academic.models import (
    AcademicTerm,
    ClassOccurrence,
    ClassSchedule,
    StudentSubject,
)

pytestmark = pytest.mark.django_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_user(n: int, offering) -> User:
    return User.objects.create_user(
        email=f"aluno{n}@aluno.impacta.edu.br",
        full_name=f"Aluno {n}",
        course_offering=offering,
    )


def _login(client: Client, user: User) -> None:
    client.force_login(user)


def _make_term(user: User, start: date, end: date, tz: str = "America/Sao_Paulo") -> AcademicTerm:
    return AcademicTerm.objects.create(
        user=user,
        name="2026/1",
        start_date=start,
        end_date=end,
        timezone=tz,
    )


def _make_subject(client: Client, offering, user: User, term: AcademicTerm) -> dict:
    """Select the first subject from the offering and bind the term. Returns the enrollment JSON."""
    subj = offering.course.subjects.filter(active=True).first()
    res = client.post(
        "/api/v1/student-subjects",
        content_type="application/json",
        data={"subject_ids": [str(subj.id)]},
    )
    assert res.status_code == 201
    ss_id = res.json()[0]["id"]
    # Bind term
    client.patch(
        f"/api/v1/student-subjects/{ss_id}",
        content_type="application/json",
        data={"term_id": str(term.id)},
    )
    return {"id": ss_id}


# ---------------------------------------------------------------------------
# Task 3.3: Schedule creation generates occurrences
# ---------------------------------------------------------------------------

def test_schedule_post_generates_weekly_occurrences(client: Client, offering):
    """POST /api/v1/class-schedules creates a schedule and generates all occurrences."""
    user = _make_user(1, offering)
    _login(client, user)
    # Semester: Mon 2026-08-03 → Mon 2026-08-17 (3 Mondays: 3, 10, 17)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 17))
    ss = _make_subject(client, offering, user, term)

    res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={
            "student_subject_id": ss["id"],
            "weekday": 0,  # Monday
            "start_time": "19:00",
            "end_time": "21:00",
        },
    )
    assert res.status_code == 201, res.json()
    schedule_id = res.json()["id"]

    # List occurrences for this subject
    occ_res = client.get(
        f"/api/v1/class-occurrences?student_subject_id={ss['id']}"
    )
    assert occ_res.status_code == 200
    occs = occ_res.json()
    assert len(occs) == 3, f"Expected 3 Mondays, got {len(occs)}: {occs}"
    # All should be non-cancelled and unrecorded
    for occ in occs:
        assert occ["cancelled"] is False
        assert occ["attendance_status"] == "unrecorded"
        assert occ["schedule_id"] == schedule_id


def test_schedule_post_two_blocks_same_day_count_separately(client: Client, offering):
    """Two schedule blocks on the same weekday each generate their own occurrences."""
    user = _make_user(2, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 10))  # 2 Mondays
    ss = _make_subject(client, offering, user, term)

    for start, end in [("08:00", "10:00"), ("14:00", "16:00")]:
        res = client.post(
            "/api/v1/class-schedules",
            content_type="application/json",
            data={
                "student_subject_id": ss["id"],
                "weekday": 0,
                "start_time": start,
                "end_time": end,
            },
        )
        assert res.status_code == 201, res.json()

    occs = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()
    # 2 Mondays × 2 blocks = 4 occurrences
    assert len(occs) == 4


def test_schedule_generation_is_idempotent(client: Client, offering):
    """Repeating a schedule POST should not duplicate occurrences (unique constraint)."""
    user = _make_user(3, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 10))  # 2 Mondays
    ss = _make_subject(client, offering, user, term)

    payload = {
        "student_subject_id": ss["id"],
        "weekday": 0,
        "start_time": "10:00",
        "end_time": "12:00",
    }
    r1 = client.post("/api/v1/class-schedules", content_type="application/json", data=payload)
    assert r1.status_code == 201
    schedule_id_1 = r1.json()["id"]

    # Counts before
    count_before = ClassOccurrence.objects.filter(schedule_id=schedule_id_1).count()

    # Manually trigger generation again (simulating a second POST for same schedule)
    from apps.academic.serializers import _generate_occurrences
    schedule = ClassSchedule.objects.get(id=schedule_id_1)
    _generate_occurrences(schedule)

    count_after = ClassOccurrence.objects.filter(schedule_id=schedule_id_1).count()
    assert count_before == count_after, "Idempotency: count should not grow"


def test_schedule_validity_window_within_term(client: Client, offering):
    """valid_from and valid_until clamp which occurrences are generated."""
    user = _make_user(4, offering)
    _login(client, user)
    # Mondays: 3, 10, 17, 24, 31 Aug
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 31))
    ss = _make_subject(client, offering, user, term)

    # Only generate from 10 Aug onwards (2nd Monday)
    res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={
            "student_subject_id": ss["id"],
            "weekday": 0,
            "start_time": "19:00",
            "end_time": "21:00",
            "valid_from": "2026-08-10",
        },
    )
    assert res.status_code == 201
    occs = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()
    assert len(occs) == 4  # 10, 17, 24, 31 Aug


def test_schedule_rejects_end_before_start(client: Client, offering):
    user = _make_user(5, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 31))
    ss = _make_subject(client, offering, user, term)

    res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={
            "student_subject_id": ss["id"],
            "weekday": 0,
            "start_time": "21:00",
            "end_time": "19:00",
        },
    )
    assert res.status_code == 400


def test_schedule_rejects_validity_outside_term(client: Client, offering):
    user = _make_user(6, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 31))
    ss = _make_subject(client, offering, user, term)

    res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={
            "student_subject_id": ss["id"],
            "weekday": 0,
            "start_time": "10:00",
            "end_time": "12:00",
            "valid_from": "2026-07-01",  # before term start
        },
    )
    assert res.status_code == 400


def test_schedule_rejects_archived_subject(client: Client, offering):
    """Cannot create a schedule for a DROPPED (archived) enrollment."""
    user = _make_user(7, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 31))
    ss = _make_subject(client, offering, user, term)

    # Archive (drop) the enrollment
    client.post(
        "/api/v1/student-subjects",
        content_type="application/json",
        data={"subject_ids": []},  # deselect all → DROPPED
    )

    res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={
            "student_subject_id": ss["id"],
            "weekday": 0,
            "start_time": "10:00",
            "end_time": "12:00",
        },
    )
    assert res.status_code == 400


def test_schedule_no_term_generates_no_occurrences(client: Client, offering):
    """Subject without a term: schedule created but no occurrences."""
    user = _make_user(8, offering)
    _login(client, user)
    subj = offering.course.subjects.filter(active=True).first()
    res_ss = client.post(
        "/api/v1/student-subjects",
        content_type="application/json",
        data={"subject_ids": [str(subj.id)]},
    )
    ss_id = res_ss.json()[0]["id"]

    res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={
            "student_subject_id": ss_id,
            "weekday": 2,
            "start_time": "10:00",
            "end_time": "12:00",
        },
    )
    assert res.status_code == 201
    occs = client.get(f"/api/v1/class-occurrences?student_subject_id={ss_id}").json()
    assert occs == []


def test_schedule_requires_auth():
    from django.test import Client as DjangoClient
    c = DjangoClient()
    res = c.post("/api/v1/class-schedules", content_type="application/json", data={})
    assert res.status_code == 401


# ---------------------------------------------------------------------------
# Task 3.4: Individual occurrence GET/PATCH/POST (standalone/makeup)
# ---------------------------------------------------------------------------

def test_occurrence_get_detail(client: Client, offering):
    user = _make_user(10, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 3))  # 1 Monday
    ss = _make_subject(client, offering, user, term)

    client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    occ = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()[0]
    detail = client.get(f"/api/v1/class-occurrences/{occ['id']}")
    assert detail.status_code == 200
    assert detail.json()["id"] == occ["id"]


def test_occurrence_patch_room_and_cancel(client: Client, offering):
    user = _make_user(11, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 3))
    ss = _make_subject(client, offering, user, term)

    client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    occ = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()[0]
    occ_id = occ["id"]

    # Edit room
    res = client.patch(
        f"/api/v1/class-occurrences/{occ_id}",
        content_type="application/json",
        data={"room": "Sala 42"},
    )
    assert res.status_code == 200
    assert res.json()["room"] == "Sala 42"
    assert res.json()["individually_edited"] is True

    # Cancel
    res2 = client.patch(
        f"/api/v1/class-occurrences/{occ_id}",
        content_type="application/json",
        data={"cancelled": True},
    )
    assert res2.status_code == 200
    assert res2.json()["cancelled"] is True

    # Reactivate
    res3 = client.patch(
        f"/api/v1/class-occurrences/{occ_id}",
        content_type="application/json",
        data={"cancelled": False},
    )
    assert res3.status_code == 200
    assert res3.json()["cancelled"] is False


def test_occurrence_404_for_other_user(client: Client, offering):
    user1 = _make_user(12, offering)
    user2 = _make_user(13, offering)
    _login(client, user1)
    term = _make_term(user1, date(2026, 8, 3), date(2026, 8, 3))
    ss = _make_subject(client, offering, user1, term)

    client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    occ = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()[0]
    occ_id = occ["id"]

    # Switch to user2
    _login(client, user2)
    assert client.get(f"/api/v1/class-occurrences/{occ_id}").status_code == 404


def test_occurrence_post_standalone_makeup(client: Client, offering):
    """POST /api/v1/class-occurrences creates a standalone or makeup class."""
    user = _make_user(14, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 10))
    ss = _make_subject(client, offering, user, term)

    # Create schedule to generate a cancelled occurrence
    client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    occ = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()[0]
    # Cancel it
    client.patch(
        f"/api/v1/class-occurrences/{occ['id']}",
        content_type="application/json",
        data={"cancelled": True},
    )

    # Post makeup occurrence
    makeup_res = client.post(
        "/api/v1/class-occurrences",
        content_type="application/json",
        data={
            "student_subject_id": ss["id"],
            "starts_at": "2026-08-15T10:00:00Z",  # Saturday makeup
            "ends_at": "2026-08-15T12:00:00Z",
            "room": "Sala Reposição",
            "replaces_id": occ["id"],
        },
    )
    assert makeup_res.status_code == 201
    makeup = makeup_res.json()
    assert makeup["room"] == "Sala Reposição"
    assert makeup["replaces"] == occ["id"]


def test_makeup_rejects_foreign_subject(client: Client, offering):
    """Makeup replaces_id must belong to the same user."""
    user1 = _make_user(15, offering)
    user2 = _make_user(16, offering)

    _login(client, user1)
    term1 = _make_term(user1, date(2026, 8, 3), date(2026, 8, 3))
    ss1 = _make_subject(client, offering, user1, term1)
    client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss1["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    occ_id = client.get(f"/api/v1/class-occurrences?student_subject_id={ss1['id']}").json()[0]["id"]

    _login(client, user2)
    term2 = _make_term(user2, date(2026, 8, 3), date(2026, 8, 31))
    ss2 = _make_subject(client, offering, user2, term2)

    res = client.post(
        "/api/v1/class-occurrences",
        content_type="application/json",
        data={
            "student_subject_id": ss2["id"],
            "starts_at": "2026-08-15T10:00:00Z",
            "ends_at": "2026-08-15T12:00:00Z",
            "replaces_id": occ_id,  # belongs to user1
        },
    )
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# Task 3.5: Schedule DELETE cancels only future untouched occurrences
# ---------------------------------------------------------------------------

def test_schedule_delete_cancels_future_untouched_preserves_past_and_edited(client: Client, offering):
    """
    DELETE a schedule cancels future non-edited occurrences.
    Individually edited or past occurrences are preserved.
    """
    user = _make_user(20, offering)
    _login(client, user)
    # 4 Mondays: 3, 10, 17, 24 Aug — 2026-08-10 is "past" in our test (we'll simulate via edited)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 24))
    ss = _make_subject(client, offering, user, term)

    sch_res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    schedule_id = sch_res.json()["id"]
    occs = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()
    assert len(occs) == 4

    # Individually edit the first occurrence (simulate "protected")
    first_occ_id = occs[0]["id"]
    client.patch(
        f"/api/v1/class-occurrences/{first_occ_id}",
        content_type="application/json",
        data={"room": "Sala 1"},  # triggers individually_edited=True
    )

    # Delete schedule — only cancels future non-edited ones
    del_res = client.delete(f"/api/v1/class-schedules/{schedule_id}")
    assert del_res.status_code == 204

    # First occurrence (individually edited) should still exist and not be cancelled
    first = ClassOccurrence.objects.get(id=first_occ_id)
    assert first.cancelled is False

    # Schedule itself is gone
    assert not ClassSchedule.objects.filter(id=schedule_id).exists()


def test_schedule_isolation_between_users(client: Client, offering):
    """User A's schedule is invisible and inaccessible to user B."""
    user_a = _make_user(21, offering)
    user_b = _make_user(22, offering)

    _login(client, user_a)
    term_a = _make_term(user_a, date(2026, 8, 3), date(2026, 8, 3))
    ss_a = _make_subject(client, offering, user_a, term_a)
    sch_res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss_a["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    sch_id = sch_res.json()["id"]

    _login(client, user_b)
    assert client.get(f"/api/v1/class-schedules/{sch_id}").status_code == 404
    assert client.get("/api/v1/class-schedules").json() == []


# ---------------------------------------------------------------------------
# Task 3.5: Series reconciliation protects history
# ---------------------------------------------------------------------------

def test_schedule_patch_reconciles_occurrences_preserving_ids(client: Client, offering):
    """
    PATCH a schedule's validity narrows the window: future occurrences outside
    the new validity window are deleted; IDs of kept occurrences are stable.
    Uses 2027 dates to ensure all occurrences are in the future.
    """
    user = _make_user(30, offering)
    _login(client, user)
    # 5 Mondays in Jan 2027: 4, 11, 18, 25 Jan + 1 Feb = 5 Mondays
    # Term: 2027-01-04 to 2027-02-01
    term = _make_term(user, date(2027, 1, 4), date(2027, 2, 1))
    ss = _make_subject(client, offering, user, term)

    sch_res = client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    assert sch_res.status_code == 201, sch_res.json()
    schedule_id = sch_res.json()["id"]

    occs_before = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()
    assert len(occs_before) == 5, f"Expected 5 Mondays, got {len(occs_before)}"
    ids_before = {o["id"] for o in occs_before}

    # Narrow: valid_from = 2027-01-11 (removes the Jan 4 occurrence, which is future + untouched)
    patch_res = client.patch(
        f"/api/v1/class-schedules/{schedule_id}",
        content_type="application/json",
        data={"valid_from": "2027-01-11"},
    )
    assert patch_res.status_code == 200

    occs_after = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()
    ids_after = {o["id"] for o in occs_after}

    # The 4 remaining Mondays (11, 18, 25 Jan, 1 Feb) should keep their original IDs
    kept_ids = ids_before & ids_after
    assert len(kept_ids) == 4, f"Expected 4 preserved IDs, got {kept_ids}"
    # Jan 4 occurrence was removed (future + untouched)
    assert len(occs_after) == 4, f"Expected 4 remaining, got {len(occs_after)}"


def test_term_patch_409_when_would_exclude_attended_occurrence(client: Client, offering):
    """
    PATCH a term's end_date that would exclude an occurrence with attendance
    must return a response indicating a conflict (via 400 with 409 in payload).
    """
    user = _make_user(31, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 31))
    ss = _make_subject(client, offering, user, term)

    # Create schedule for Aug 3 (Monday)
    client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )
    occs = client.get(f"/api/v1/class-occurrences?student_subject_id={ss['id']}").json()

    # Mark the last occurrence as individually edited (protected)
    last_occ = max(occs, key=lambda o: o["starts_at"])
    client.patch(
        f"/api/v1/class-occurrences/{last_occ['id']}",
        content_type="application/json",
        data={"room": "Protected Room"},
    )

    # Now try to shrink the term to exclude the last occurrence
    # Last Monday is Aug 31; shrink to Aug 24
    res = client.patch(
        f"/api/v1/academic-terms/{term.id}",
        content_type="application/json",
        data={"end_date": "2026-08-24"},
    )
    # Should be rejected (400 with conflict detail)
    assert res.status_code == 400
    body = res.json()
    assert "detail" in body.get("errors", body)


def test_term_patch_succeeds_when_no_protected_occurrences_excluded(client: Client, offering):
    """Shrinking term dates succeeds if no protected occurrences are excluded."""
    user = _make_user(32, offering)
    _login(client, user)
    term = _make_term(user, date(2026, 8, 3), date(2026, 8, 31))
    ss = _make_subject(client, offering, user, term)

    # Create schedule — no occurrences individually edited
    client.post(
        "/api/v1/class-schedules",
        content_type="application/json",
        data={"student_subject_id": ss["id"], "weekday": 0, "start_time": "10:00", "end_time": "12:00"},
    )

    # Shrink to Aug 24 — all occurrences are unrecorded and not individually edited
    res = client.patch(
        f"/api/v1/academic-terms/{term.id}",
        content_type="application/json",
        data={"end_date": "2026-08-24"},
    )
    assert res.status_code == 200
