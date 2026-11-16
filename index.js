import dotenv from 'dotenv'
import connectDB from './src/db/database_connection.js';
import app from './app.js';

dotenv.config({
    path: './.env'
})

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

connectDB()
.then()
.catch((err) => {
  console.err("MongoDb connection Error", err)
  process.exit(1)
})