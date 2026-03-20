import * as candidateService from './candidate.service.js';

export const createCandidate = async (req, res) => {

  try{
    const candidate = await candidateService.createCandidate(req.body);
    res.status(201).json({
      success: true,
      data: candidate
    })
    console.log("Candidate created successfully:", candidate);
}
catch (error) {
  res.status(400).json({
    success: false,
    message: error.message
  });
 }
 console.log("Error creating candidate:", error);
};