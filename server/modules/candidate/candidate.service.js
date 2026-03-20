import Candidate from "./candidate.model.js";

export async function createCandidate(data) {

  const {firstName, lastName, email, phone} = data;

   if (!firstName || !lastName || !email || !phone) {
    throw new Error("Missing required fields: firstName, lastName, email, phone");
  }

  const existingCandidate = await Candidate.findOne({email})
  if (existingCandidate){
    throw new Error("A candidate with this email already exists");
  }

  const candidate = await Candidate.create(data);
  return candidate;
}