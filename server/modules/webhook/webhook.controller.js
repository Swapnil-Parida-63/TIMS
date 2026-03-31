import * as candidateService from '../candidate/candidate.service.js';

export const handleGoogleFormWebhook = async (req, res) => {
  try {
    const rawPayload = req.body;
    
    console.log("\n=== INCOMING GOOGLE FORM WEBHOOK ===");
    console.log("Raw Payload:", JSON.stringify(rawPayload, null, 2));

    if (!rawPayload || Object.keys(rawPayload).length === 0) {
       console.log("Webhook rejected: Empty payload received.");
       return res.status(400).json({ success: false, message: "Empty payload" });
    }

    const result = await candidateService.createCandidateFromWebhook(rawPayload);

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      data: result
    });
  } catch (error) {
    console.error("Webhook processing error:", error.message);
    // We notify webhook failed, though often we 200 OK to stop retries.
    res.status(500).json({ success: false, message: error.message });
  }
};
