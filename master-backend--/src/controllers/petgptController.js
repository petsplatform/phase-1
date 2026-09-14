const petgptService = require("../services/petgptService");

async function chat(req, res, next) {
  try {
    const response = await petgptService.chat(req.validated.body, req.customer || null);
    return res.json({ success: true, data: response });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  chat,
};
