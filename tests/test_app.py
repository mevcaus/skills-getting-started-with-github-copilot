import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)


def test_get_activities_returns_data():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect at least one activity
    assert len(data) >= 1
    # Known key exists
    assert "Chess Club" in data


def test_signup_success_then_duplicate_fails():
    activity = "Science Club"
    email = "newstudent@mergington.edu"

    # Ensure precondition: not already signed up
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # First signup should succeed
    resp1 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp1.status_code == 200
    assert email in activities[activity]["participants"]

    # Second signup should fail with 400
    resp2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp2.status_code == 400
    assert resp2.json()["detail"] == "Student is already signed up"


def test_unregister_participant_success_and_not_found():
    activity = "Basketball Team"
    existing_email = "james@mergington.edu"
    not_found_email = "ghost@mergington.edu"

    # Unregister existing participant
    resp_del = client.delete(f"/activities/{activity}/participants/{existing_email}")
    assert resp_del.status_code == 200
    assert existing_email not in activities[activity]["participants"]

    # Unregister not found
    resp_404 = client.delete(f"/activities/{activity}/participants/{not_found_email}")
    assert resp_404.status_code == 404
    assert resp_404.json()["detail"] == "Participant not found for this activity"
