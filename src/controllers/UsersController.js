import bcryptjs from 'bcryptjs'
import { dbConnect } from '../database/sqlite/index.js'
import { AppError } from '../utils/AppError.js'

export class UserController {
  async create (req, res) {
    const { name, email, password } = req.body
    const database = await dbConnect()
    const checkUser = await database.get(
      'SELECT * FROM users WHERE email = (?)',
      [email]
    )

    if (checkUser) {
      throw new AppError('This email is already registered', 409)
    }

    const hashedPassword = await bcryptjs.hash(password, 8)

    await database.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    )

    res.status(201).json()
  }

  async update (req, res) {
    // eslint-disable-next-line camelcase
    const { name, email, password, old_password } = req.body
    const { id } = req.params

    const database = await dbConnect()
    const user = await database.get('SELECT * FROM users WHERE id = (?)', [id])

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const userWithUpdateEmail = await database.get('SELECT * FROM users WHERE email = (?)', [email])

    if (userWithUpdateEmail && userWithUpdateEmail.id !== user.id) {
      throw new AppError('This email is already registered', 409)
    }

    user.name = name ?? user.name
    user.email = email ?? user.email

    // eslint-disable-next-line camelcase
    if (password && old_password) {
      const checkOldPassword = await bcryptjs.compare(old_password, user.password)

      if (!checkOldPassword) {
        throw new AppError('Old password is required', 400)
      }

      user.password = await bcryptjs.hash(password, 8)
    }

    await database.run(
      `UPDATE users SET 
      name = (?), 
      email = (?), 
      password = (?), 
      updated_at = DATETIME('now') 
      WHERE id = (?)`, [name, email, user.password, id]
    )

    res.json()
  }
}
