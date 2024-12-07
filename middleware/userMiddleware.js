const isUser = (req, res, next) => {
    console.log('User ID:', req.session.userID);

    if (req.session.userID) {
        return next();
    } else {
        return res.redirect('/login');
    }
};

export default isUser;
