import { mapErrorToClientResponse } from '../helpers/apiErrorMapper.js';

export function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Source URL already exists' });
  }
  console.error(err);
  const clientError = mapErrorToClientResponse(err);
  const message = clientError ? clientError.message : (err.message || 'Something went wrong');
  const status = clientError ? clientError.status : 500;
  res.status(status).json({ error: message });
}
