 = '// @desc    Get full exchange activity for profile dashboard
// @route   GET /api/exchange/activity
router.get(''/activity'', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, limit = 20, page = 1 } = req.query;

    const query = {
      : [{ requesterId: userId }, { responderId: userId }], status: ''pending'' }),
      ExchangeActivity.countDocuments({ : [{ requesterId: userId }, { responderId: userId }], status: ''completed'' }),
      ExchangeActivity.countDocuments({  = '// @desc    Get exchange activity history'
if ()) {
    .Replace( + 
    Write-Host 'Activity endpoint added successfully'
} else {
    Write-Host 'Marker not found'
}
