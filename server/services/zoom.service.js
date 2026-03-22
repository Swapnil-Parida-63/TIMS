import axios from "axios";


// Function to get Zoom access token using account credentials grant
const getZoomAccessToken = async () => {
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
            topic: "Interview",
            type: 2,
            start_time: data.scheduledAt,
            settings: {
              join_before_host: false,
              approval_type: 0,
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
        };
      };