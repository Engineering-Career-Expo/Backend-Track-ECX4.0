const { MongoClient } = require('mongodb')
require('dotenv').config();
let uri;
let dbConnection
let dbs;

module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect(process.env.MONGODB_URL)
        .then((client) =>{
		dbConnection = client.db()
		return cb()

        })
        .catch(err => {
            console.log(err)
            return cb(err)
        })
    },
    getDb: () => dbConnection,
 fetchBooks(req, res, next){
    dbs = dbConnection;
    let match_idx
    let reg = /\(([^)]+)\)/
    let obj =Object.assign({}, req.rawHeaders)
    for(i=0; i< Object.keys(obj).length; i++)
	if(obj[i].search("Mozilla") > -1)
        {
		match_idx = i
		break
	}
    let match  = reg.exec(obj[match_idx])
    if(match){
        console.log(req.ip , " <---> ", match[1] ,"| requested a book\n")
    	dbs.collection('userlog')
    	.insertOne({ip: req.ip, device: match[1], date: new Date()})
    }
    else
	console.log(req.ip , " <---> ",obj, "| requested a book\n")
    let books = []

    dbs.collection('books')
    .find()
    .sort({author: 1})
    .forEach(book=> books.push(book))
    .then(() => {
    var books_col = books.map(function(book) {
      return {
        author: book.author,
        title: book.Title,
        pages: book.pages,
	description: book.description , //book.description
      }
    });
    res.locals.books = books_col;
    next();
    })
    .catch((err) =>{
        return err;
    })
}

};
