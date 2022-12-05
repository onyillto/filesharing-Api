const multer  = require('multer')
const dotenv = require('dotenv')
const express = require('express');
const connectDB = require('./config/db'); //Bring on the db from config folder
const ejs = require('ejs');
const File = require('./models/file')
const bcrypt = require('bcrypt')
const app = express();


//Load config
dotenv.config({path: './config/.env'})
//call db imported 
connectDB();
const PORT = 5000;


app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: 'uploads/' })
app.set('view engine', "ejs")

app.get('/', async (req, res) =>{
  res.render('index')
})

app.post('/upload', upload.single('file'),async (req, res)=> {
    const fileData = {
        path: req.file.path,
        originalName : req.file.originalname
      }
      if (req.body.password != null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10)
      }
      const file = await File.create(fileData)
      
      res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}`})
  })
app.route('/file/:id').get(handleDownload).post(handleDownload)
async function handleDownload(req,res){
    const file = await File.findById(req.params.id);

    if (file.password != null) {
        if (req.body.password == null) {
            res.render('password')
            return
        }
        if (!(await bcrypt.compare(req.body.password, file.password))) {
          res.render('password', {error: true}) 
          return 
        }
    }

    file.downloadCount++
    await file.save();
    console.log(file.downloadCount);

    res.download(file.path, file.originalName)
}
app.listen(PORT, () => console.log(`Server Connected to port ${PORT}`))