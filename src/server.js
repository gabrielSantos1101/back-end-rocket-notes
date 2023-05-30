import express from 'express'

import routes from './routes/index.js'

const app = express()
app.use(express.json())

app.use(routes)

const PORT = 3333
app.listen(PORT, () => console.log(`server is running on localhost:${PORT}`))
