const isAdmin = (req, res, next) => {
  if (req.session.adminID) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

const isAdminLogout = (req, res, next) => {
  if (req.session.adminID) {
    res.redirect("/admin/dashboard");
  } else {
    next();
  }
};

export default {
  isAdmin,
  isAdminLogout
}