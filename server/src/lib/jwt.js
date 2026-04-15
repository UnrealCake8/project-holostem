import jwt from 'jsonwebtoken'

const defaultSecret = 'dev-secret-change-me'

export function signToken(payload) {
  const secret = process.env.JWT_SECRET || defaultSecret
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET || defaultSecret
  return jwt.verify(token, secret)
}
