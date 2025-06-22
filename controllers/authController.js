const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

// Google OAuth - Initiate authentication
exports.googleAuth = passport.authenticate('google', { 
  scope: ['profile', 'email'] 
});

// Google OAuth - Handle callback
exports.googleCallback = [
  passport.authenticate('google', { 
    failureRedirect: '/login?error=Google login failed' 
  }),
  async (req, res) => {
    try {
      console.log('Google callback - User data:', req.user);
      
      // Tạo JWT token
      const accessToken = jwt.sign(
        {
          memberID: req.user._id,
          memberName: req.user.memberName,
          role: req.user.isAdmin ? "admin" : "user",
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Lưu user vào session
      req.session.user = {
        id: req.user._id,
        memberName: req.user.memberName,
        name: req.user.name,
        YOB: req.user.YOB,
        isAdmin: req.user.isAdmin,
        avatar: req.user.avatar,
        authProvider: req.user.authProvider,
        token: accessToken,
      };

      console.log('Google login successful for user:', req.user.name);
      
      // Redirect based on role
      if (req.user.isAdmin) {
        return res.redirect('/admin?success=' + encodeURIComponent('Welcome back, Admin!'));
      } else {
        return res.redirect('/?success=' + encodeURIComponent('Login successful with Google!'));
      }
    } catch (error) {
      console.error('Error in Google callback:', error);
      return res.redirect('/login?error=' + encodeURIComponent('Login failed. Please try again.'));
    }
  }
];

// Logout function
exports.logout = (req, res) => {
  try {
    console.log('Logout initiated for user:', req.session.user?.name);
    
    // Logout từ Passport (for Google OAuth)
    req.logout((err) => {
      if (err) {
        console.error('Passport logout error:', err);
        return res.redirect('/?error=' + encodeURIComponent('Logout failed'));
      }
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.redirect('/?error=' + encodeURIComponent('Logout failed'));
        }
        
        // Clear session cookie
        res.clearCookie('connect.sid');
        console.log('User logged out successfully');
        res.redirect('/?success=' + encodeURIComponent('Logout successful'));
      });
    });
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    res.redirect('/?error=' + encodeURIComponent('Logout failed'));
  }
};

// Alternative logout for API calls (if needed)
exports.logoutAPI = (req, res) => {
  try {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Logout failed' 
        });
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Session cleanup failed' 
          });
        }
        
        res.clearCookie('connect.sid');
        res.json({ 
          success: true, 
          message: 'Logout successful' 
        });
      });
    });
  } catch (error) {
    console.error('API logout error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};