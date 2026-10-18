// ===================================================================
// Google Apps Script for Hitesh & Neha Wedding RSVP
// ===================================================================
// HOW TO SET UP (Takes 1 minute):
// 1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1nkhwf71yGMcAonT_oi0jXdtV8Uc2SPH_h2SyaTJwfGA/edit
// 2. In the top menu, click: Extensions -> Apps Script
// 3. Delete any code in the editor, and paste THIS entire script.
// 4. Click the blue "Deploy" button (top right) -> "New deployment".
// 5. Click the gear icon next to "Select type" -> select "Web app".
// 6. Fill in:
//    - Description: RSVP Webhook
//    - Execute as: "Me" (your email)
//    - Who has access: "Anyone" (IMPORTANT: must be "Anyone" so guests can RSVP without logging in)
// 7. Click "Deploy" -> authorize permissions if prompted.
// 8. Copy the "Web app URL" (it ends with /exec) and paste it into assets/config.js as rsvpEndpoint!
// ===================================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Auto-create header row if the sheet is empty:
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Guest Name",
        "Attendance",
        "Number of Guests",
        "Phone / Email",
        "Dietary & Notes",
        "Event"
      ]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold");
    }

    var data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    sheet.appendRow([
      data.submittedAt || new Date().toISOString(),
      data.name || "",
      data.attendance === "attending" ? "Attending" : "Declined",
      data.guestCount || (data.attendance === "declined" ? "0" : "1"),
      data.contact || "",
      data.notes || "",
      data.event || "Hitesh & Neha Wedding"
    ]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Simple test function to test from Apps Script editor:
function testDoPost() {
  doPost({
    postData: {
      contents: JSON.stringify({
        submittedAt: new Date().toISOString(),
        name: "Test Guest",
        attendance: "attending",
        guestCount: "2",
        contact: "test@example.com",
        notes: "Excited to celebrate!",
        event: "Hitesh & Neha Wedding"
      })
    }
  });
}
