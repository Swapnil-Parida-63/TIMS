import * as authService from './auth.service.js';

export const loginController =  async (req, res) => { // Controller for handling user login, it takes the email and password from the request body, calls the login function from the auth service, and returns the result in the response.
  try { 
    const { email, password } = req.body;
    const data = await authService.login(email, password);
    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const register = async (req, res) => {
  try {
    const user = await authService.registerUser(req.body);

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};