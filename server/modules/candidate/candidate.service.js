import Candidate from "./candidate.model";

export async function createCandidate(data) {

   if (!data.firstName || !data.lastName || !data.email || !data.phone) {
    throw new Error("Missing required fields: firstName, lastName, email, phone");
  }

  const candidate = await Candidate.create(data);
  return candidate;
}