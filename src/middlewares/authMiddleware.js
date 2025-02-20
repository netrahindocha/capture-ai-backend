const authMiddleware = (req, res, next) => {
  if (req.isAuthenticated()) {
    console.log("Yes its authenticated");
    return next();
  } else {
    console.log("No its not authenticated");
    return res
      .status(401)
      .json({ authenticated: false, error: "Unauthorized: Please log in" });
  }
};

module.exports = authMiddleware;
