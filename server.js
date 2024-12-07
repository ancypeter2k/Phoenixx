// // // importing the app // // // 
import app from './app.js'

// // // port // // // 
const port=process.env.PORT || 8002

// // // starting the server // // // 
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
})