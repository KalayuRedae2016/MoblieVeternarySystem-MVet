const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // const authHeader = req.headers['authorization'];
  //const token = authHeader && authHeader.split(' ')[1];
  const token= req.headers['token'];
  if (!token) {
    return res.status(403).json({ success: false, message: 'Token is not provided' });
  }
  const decoded = jwt.decode(token);
  if (!decoded || !decoded.bankName) {
    throw new Error('Invalid token or bankName missing');
  }
  const bankType = decoded.bankName;
  const SECRET_KEYS={
    "LIB":"LIB123456789",
    "WEGAGEB":"WEGAGEn123456789",
    "CBE":"CBE123456789"
    }
  const secretKey = SECRET_KEYS[bankType.toUpperCase()];
    
    if (!secretKey) {
      throw new Error(`No secret key found for bankType: ${bankType}`);
    }

  jwt.verify(token,secretKey,{ algorithms: ['HS256'] },(err,decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token verification failed',Error:err.message });
    }
    else{
      //console.log("verified Token:",token)
      // console.log("verified SecretKey:",secretKey)
      //console.log("verified bankName:",decoded.bankName)
    }
    next();
  });
};