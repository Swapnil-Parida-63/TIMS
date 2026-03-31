import * as candidateService from './candidate.service.js';

export const createCandidate = async (req, res) => {
  try {
    const candidate = await candidateService.createCandidate(req.body);
    res.status(201).json({ success: true, data: candidate });
    console.log('Candidate created successfully:', candidate._id);
  } catch (error) {
    console.error('Error creating candidate:', error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCandidates = async (req, res) => {
  try {
    const candidates = await candidateService.getCandidates();
    res.status(200).json({ success: true, data: candidates });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCandidateById = async (req, res) => {
  try {
    const candidate = await candidateService.getCandidateById(req.params.id);
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const candidate = await candidateService.updateCandidate(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: candidate });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    const message = await candidateService.deleteCandidate(req.params.id, req.user);
    res.json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};