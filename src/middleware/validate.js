const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(422).json({
      error: 'Validation failed',
      details: errorMessages
    });
  }
  next();
};

module.exports = validateRequest;