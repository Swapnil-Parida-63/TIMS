import Interview from "./interview.model.js";

export const createInterview = async (data) => {
  const interview = await Interview.create(data);
  return interview;
}