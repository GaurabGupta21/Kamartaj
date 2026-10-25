// //that middleware Is the student logged in? Is the JWT valid?
// //allowRoles("student") Is the user a student?

// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// exports.protect = async(req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;

//         if(!authHeader || !authHeader.startsWith("Bearer ")){
//             return res.status(401).json({
//                 message: "Please login first",
//             });

//         }
//         const token = authHeader.split(" ")[1];

//         //verify token
//         const decoded = jwt.verify(
//             token,
//             process.env.JWT_SECRET 
//         );

//         //FIND USER IN DATABSE
//         const user = await User.findById(decoded.id);

//         if(!user){
//             return res.status(401).json({
//                 message: "User not found",
//             });
//         }
//         //if user is found only store important details
//         req.user = {
//             id: user._id.toString(),
//             name: user.name,
//             email: user.email,
//             role: user.role,
                    
//         };
//         next();
//     } catch (error){
//         return res.status(401).json({
//             message: "Invalid or expired token",
//         });
//     }
// };

// //checking weather the user have a permission
// exports.allowRoles = (...roles) => {
//     return (req, res, next) => {
//         if(!req.user || !roles.includes(req.user.role)){
//             return res.status(403).json({
//                 message: "Accenss Denied",
//             });
//         }
//         next();
//     };
// };

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please login first",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both userId (from login) and id/ _id safely
    const userId = decoded.userId || decoded.id || decoded._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access Denied",
      });
    }
    next();
  };
};

module.exports = { protect, allowRoles };