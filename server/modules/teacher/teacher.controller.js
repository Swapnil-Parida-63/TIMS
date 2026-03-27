import * as teacherService from "./teacher.service.js";

export const finalizeTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await teacherService.finalizeTeacher(id);

    res.json({
      success: true,
      data: teacher
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};