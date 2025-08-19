
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.role) {
      return res.status(401).json({error: 'Not logged in'});
    }
    if (req.session.role !== role) {
      return res.status(403).json({error: 'Forbidden'});
    }
    next();
  };
}

export function requireAny(...roles){
  return (req, res, next) => {
    if (!req.session || !req.session.role) {
      return res.status(401).json({error: 'Not logged in'});
    }
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({error: 'Forbidden'});
    }
    next();
  };
}
