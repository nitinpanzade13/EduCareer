const User = require('../models/User');

const verifyAdmin = async (req, res, next) => {
  try {
    const uid = req.headers['x-user-uid']; 
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const user = await User.findOne({ uid });
    
    // ✅ ALLOW BOTH 'admin' AND 'superadmin'
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({ error: "Access Denied: Admins Only" });
    }

    req.user = user; // Attach user to request so we know their exact role
    next();
  } catch (error) {
    res.status(500).json({ error: "Server Error" });
  }
};

module.exports = verifyAdmin;