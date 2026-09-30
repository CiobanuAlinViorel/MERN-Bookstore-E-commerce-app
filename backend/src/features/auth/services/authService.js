const jwt = require('jsonwebtoken');
const validator = require('validator');
const { User } = require('../models/User');
const AppError = require('../../../shared/utils/AppError');

const JWT_EXPIRES_IN = '1d';

function signToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET lipsește din .env');
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Token invalid sau expirat', 401);
  }
}

async function register({ email, password, name } = {}) {
  if (typeof email !== 'string' || !validator.isEmail(email)) throw new AppError('Email invalid', 400);
  if (typeof password !== 'string' || !validator.isLength(password, { min: 8, max: 72 }))
    throw new AppError('Parola trebuie să aibă între 8 și 72 de caractere', 400);

  const normalized = validator.normalizeEmail(email) || email.toLowerCase();
  if (await User.exists({ email: normalized })) throw new AppError('Emailul este deja folosit', 409);

  // role NU vine niciodată de la client: rămâne "user" (valoarea implicită din model)
  const user = await User.create({
    email: normalized,
    password, // hash-uit de pre('save') din modelul User
    name: typeof name === 'string' ? validator.escape(name.trim()) : undefined,
  });

  return { user, token: signToken(user) };
}

async function login({ email, password } = {}) {
  const invalid = new AppError('Email sau parolă incorectă', 401); // mesaj identic pentru ambele cazuri
  if (typeof email !== 'string' || typeof password !== 'string') throw invalid;

  const normalized = validator.normalizeEmail(email) || email.toLowerCase();
  const user = await User.findOne({ email: normalized }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw invalid;

  return { user, token: signToken(user) };
}

async function getUserById(id) {
  return User.findById(id); // null dacă nu există
}

module.exports = { register, login, verifyToken, getUserById, signToken };