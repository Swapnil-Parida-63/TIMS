import Teacher from "./teacher.model.js";
import Interview from "../interview/interview.model.js";

export const finalizeTeacher = async (interviewId) => {
  const interview = await Interview.findById(interviewId);

  if (!interview) throw new Error("Interview not found");

  if (!interview?.pricing?.details) {
    throw new Error("Pricing not finalized");
  }

  const existing = await Teacher.findOne({
  candidate: interview.candidate
});

if (existing) {
  throw new Error("Teacher already created");
}

  const teacher = await Teacher.create({
    candidate: interview.candidate,
    cpc: interview.pricing.cpc,
    category: interview.pricing.category,
    classCode: interview.pricing.classCode,
    pricing: interview.pricing.details
  });

  return teacher;
};