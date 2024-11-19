const User = require("../../models/user-model");

// controllers/userController.js

const getReferralTree = async (req, res) => {
  try {
    const { userId } = req.params;

    const buildReferralTree = async (userId) => {
      const user = await User.findById(userId)
        .select("username email referredBy")
        .populate("referredBy", "username email");

      if (!user) return null;

      // Fetch each referred user's referral list recursively
      const referralTree = {
        userId: user._id,
        username: user.username,
        email: user.email,
        referrals: [],
      };

      for (const referredUser of user.referredBy) {
        const childTree = await buildReferralTree(referredUser._id); // Recursive call
        referralTree.referrals.push(childTree);
      }

      return referralTree;
    };

    const referralTree = await buildReferralTree(userId);

    res.status(200).json({ referralTree });
  } catch (error) {
    console.error("Error building referral tree:", error);
    res.status(500).json({ Error: "Server Error" });
  }
};

module.exports = {
  getReferralTree,
};
