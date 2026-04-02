import axios from "axios";

// Export so the test controller can use it directly
export const getZoomAccessToken = async () => {
  const response = await axios.post(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {},
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
}


// Function to create a Zoom meeting
export const createZoomMeeting = async (data) => {
  const token = await getZoomAccessToken();

  const response = await axios.post(
    "https://api.zoom.us/v2/users/me/meetings",
    {
      topic: data.topic || "Interview",
      type: 2,
      start_time: data.scheduledAt,
      settings: {
        join_before_host: false,
        approval_type: 0,
        host_video: true,
        participant_video: true,
        auto_recording: "cloud"
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return {
    meetingId: response.data.id,
    joinUrl: response.data.join_url,
    startUrl: response.data.start_url,
    scheduledAt: data.scheduledAt, // pass through so email service can format the date
    duration: response.data.duration,
    topic: response.data.topic,
  };
};

// Function to fetch recording URL
export const fetchRecording = async (meetingId) => {
  try {
    const token = await getZoomAccessToken();
    const response = await axios.get(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = response.data;
    // According to Zoom API, individual files have download_url
    const recFile = data.recording_files?.find(f => f.file_type === 'MP4') || data.recording_files?.[0];
    
    return {
      downloadUrl: recFile?.download_url || data.share_url
    };
  } catch (err) {
    if (err.response?.status === 404) {
      return null; // Not available yet
    }
    throw err;
  }
};

// Function to permanently delete/trash a recording
export const deleteRecording = async (meetingId) => {
  try {
    const token = await getZoomAccessToken();
    await axios.delete(
      `https://api.zoom.us/v2/meetings/${meetingId}/recordings?action=trash`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return true;
  } catch (err) {
    if (err.response?.status === 404) {
      return false; // Already deleted
    }
    throw err;
  }
};

// Update an existing Zoom meeting's start time (reschedule)
export const updateZoomMeeting = async (meetingId, scheduledAt) => {
  const token = await getZoomAccessToken();
  await axios.patch(
    `https://api.zoom.us/v2/meetings/${meetingId}`,
    { start_time: new Date(scheduledAt).toISOString() },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};