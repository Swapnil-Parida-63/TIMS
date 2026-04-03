import * as candidateService from './candidate.service.js';

export const createCandidate = async (req, res) => {
  try {
    if (!['admin', 'super_admin', 'executer'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
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
    if (!['admin', 'super_admin', 'executer'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
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
    const { reason, notes } = req.body;
    const message = await candidateService.deleteCandidate(req.params.id, req.user, reason, notes);
    res.json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDeletedLog = async (req, res) => {
  try {
    const DeletedCandidateLog = (await import('./deletedCandidateLog.model.js')).default;
    const logs = await DeletedCandidateLog
      .find({})
      .populate('deletedBy', 'name email')
      .sort({ deletedAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const reserveCandidate = async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const { reason, notes } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reserve reason must be provided' });
    }

    const Candidate = (await import('./candidate.model.js')).default;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status: 'reserved', reserveReason: reason, reserveNotes: notes || '' },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    res.json({ success: true, data: candidate, message: 'Candidate reserved' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};