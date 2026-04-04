const { body, query, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

const courseValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
    body('description').optional().trim().isLength({ max: 5000 }).withMessage('Description must be under 5000 characters'),
    body('category').optional().trim().isLength({ max: 100 }),
    body('level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid level'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    handleValidationErrors
  ],
  update: [
    param('id').isMongoId().withMessage('Invalid course ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
    handleValidationErrors
  ]
};

const enrollmentValidation = {
  enroll: [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    handleValidationErrors
  ],
  progress: [
    param('id').isMongoId().withMessage('Invalid enrollment ID'),
    body('lessonIndex').isInt({ min: 0 }).withMessage('lessonIndex must be a non-negative integer'),
    handleValidationErrors
  ]
};

const mentorshipValidation = {
  request: [
    body('mentorId').isMongoId().withMessage('Invalid mentor ID'),
    body('skill').trim().notEmpty().withMessage('Skill is required'),
    body('message').optional().trim().isLength({ max: 1000 }).withMessage('Message must be under 1000 characters'),
    handleValidationErrors
  ]
};

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

const courseReviewValidation = {
  create: [
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 2000 }).withMessage('Comment must be under 2000 characters'),
    handleValidationErrors
  ]
};

const xpValidation = {
  award: [
    body('amount').isInt({ min: 1 }).withMessage('XP amount must be a positive integer'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    handleValidationErrors
  ]
};

module.exports = {
  handleValidationErrors,
  courseValidation,
  enrollmentValidation,
  mentorshipValidation,
  paginationValidation,
  courseReviewValidation,
  xpValidation
};
