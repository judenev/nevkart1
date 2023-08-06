const MongoClient = require('mongodb').MongoClient
const { GridFsStorage } = require('multer-gridfs-storage');
const multer = require('multer');

const Grid = require('gridfs-stream');
const mongoURI = 'mongodb://localhost:27017'
const state = {
    db: null,
    gfs: null,
}
module.exports.connect = function (finished) {
    const url = mongoURI
    const dbname = 'NevKart'
    MongoClient.connect(url, (err, data) => {
        if (err) {
            console.log(err)
            return finished(err)
        }
        state.db = data.db(dbname)
       state.gfs = Grid(state.db, data);
        // console.log(state)
         state.gfs.collection('uploads');
    /*    const storage = new GridFsStorage({url,
            file: (req, file) => {
                return new Promise((resolve, reject) => {
                    const filename = path.extname(file.originalname);
                    const fileInfo = {
                        filename: filename,
                        bucketName: 'uploads'
                    };
                    resolve(fileInfo);
                });
            }
        });
        state.storage = storage
 state.upload = multer({ storage:storage }); */
        finished()
    })
}
module.exports.get = function () {
    return state.db
}

module.exports.gfs = () => {
    return state.gfs
} 

/* 
module.exports.storage = () => {
    return state.storage
}

 */

   

