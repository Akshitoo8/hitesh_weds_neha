(() => {
  "use strict";
  document.documentElement.classList.add("js");
  const config = window.WEDDING_CONFIG || {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const welcome = document.querySelector("#welcome");
  const openInvitation = document.querySelector("#open-invitation");
  if (welcome && openInvitation && typeof welcome.showModal === "function") {
    welcome.showModal();
    openInvitation.addEventListener("click", () => {
      welcome.close();
      document.querySelector("#main")?.focus({ preventScroll: true });
    });
  }

  const revealElements = [...document.querySelectorAll(".reveal")];
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach((element) => observer.observe(element));
  }

  const weddingTime = new Date(document.querySelector("#wedding-date")?.dateTime || "").getTime();
  const countdown = document.querySelector("#countdown");
  const countdownMessage = document.querySelector("#countdown-message");
  let countdownTimer;
  const setCount = (id, value) => {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = String(value).padStart(2, "0");
  };
  const updateCountdown = () => {
    if (!Number.isFinite(weddingTime)) return;
    const remaining = weddingTime - Date.now();
    if (remaining <= 0) {
      ["days", "hours", "minutes", "seconds"].forEach((id) => setCount(id, 0));
      if (countdown) countdown.hidden = true;
      if (countdownMessage) countdownMessage.textContent = "Today, our forever begins. Thank you for celebrating with us.";
      if (countdownTimer) window.clearInterval(countdownTimer);
      return;
    }
    const day = 86_400_000;
    const hour = 3_600_000;
    const minute = 60_000;
    setCount("days", Math.floor(remaining / day));
    setCount("hours", Math.floor((remaining % day) / hour));
    setCount("minutes", Math.floor((remaining % hour) / minute));
    setCount("seconds", Math.floor((remaining % minute) / 1000));
  };
  updateCountdown();
  countdownTimer = window.setInterval(updateCountdown, 1000);
  document.addEventListener("visibilitychange", () => {
    window.clearInterval(countdownTimer);
    if (!document.hidden) {
      updateCountdown();
      countdownTimer = window.setInterval(updateCountdown, 1000);
    }
  });

  const attendance = document.querySelector("#attendance");
  const guestCount = document.querySelector("#guest-count");
  const guestCountField = document.querySelector("#guest-count-field");
  const syncGuestCount = () => {
    const isDeclining = attendance?.value === "declined";
    if (guestCount) {
      guestCount.disabled = isDeclining;
      guestCount.required = !isDeclining;
      if (isDeclining) guestCount.value = "";
    }
    if (guestCountField) guestCountField.hidden = isDeclining;
  };
  attendance?.addEventListener("change", syncGuestCount);

  const form = document.querySelector("#rsvp-form");
  const status = document.querySelector("#form-status");
  const submitButton = document.querySelector("#rsvp-submit");
  const setStatus = (message, state = "") => {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = state;
    status.focus();
  };

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncGuestCount();
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Please complete the required fields before sending your RSVP.", "error");
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    data.submittedAt = new Date().toISOString();
    data.event = "Hitesh and Neha wedding — 12 November 2026";

    // If an Apps Script Web App URL is configured, save directly to Google Sheets:
    if (config.rsvpEndpoint && config.rsvpEndpoint.startsWith("http")) {
      submitButton.disabled = true;
      setStatus("Saving your RSVP to Google Sheets…");
      try {
        await fetch(config.rsvpEndpoint, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(data)
        });
        form.reset();
        syncGuestCount();
        setStatus(data.attendance === "declined"
          ? "Thank you for letting us know — you will be missed."
          : "Your RSVP has been saved! We look forward to celebrating with you.", "success");
      } catch (error) {
        console.error("RSVP save failed", error);
        setStatus("We could not save your RSVP. Please check your connection or contact the families directly.", "error");
      } finally {
        submitButton.disabled = false;
      }
      return;
    }

    // Fallback if Apps Script Web App URL is not yet pasted in config.js:
    if (config.googleSheetUrl) {
      window.open(config.googleSheetUrl, "_blank");
    }
    form.reset();
    syncGuestCount();
    setStatus("Thank you! To enable 1-click automatic background recording to your Google Sheet, add your Google Apps Script Web App URL to assets/config.js.", "success");
  });
})();
