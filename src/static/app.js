document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML
        let participantsHTML = '<div class="participants-section"><h4>Participants:</h4>';
        if (details.participants.length > 0) {
            participantsHTML += '<ul class="participants-list no-bullets">';
            details.participants.forEach(participant => {
                participantsHTML += `
                    <li class="participant-item">
                        <span class="participant-email">${participant}</span>
                        <button class="delete-participant" aria-label="Remove participant" title="Remove" onclick="unregisterParticipant('${name}', '${participant}')">✕</button>
                    </li>`;
            });
            participantsHTML += '</ul>';
        } else {
          participantsHTML += '<p class="no-participants">No participants yet - be the first to sign up!</p>';
        }
        participantsHTML += '</div>';

        activityCard.innerHTML = `
          <h3>${name}</h3>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Spots available:</strong> ${spotsLeft} of ${details.max_participants}</p>
          ${participantsHTML}
          <button onclick="signUp('${name}')">Sign Up</button>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list to reflect new participant without page reload
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  // Expose unregister function globally for button onclick usage
  window.unregisterParticipant = async (activityName, email) => {
    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to unregister participant');
      }
      await fetchActivities();
    } catch (e) {
      alert(e.message);
    }
  };
});
