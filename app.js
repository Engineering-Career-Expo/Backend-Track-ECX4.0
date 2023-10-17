const express = require('express')
const { connectToDb, getDb}  = require('./db')

const app = express()
let db

connectToDb((err) => {
    if (!err){
        app.listen(30000, () => {
            console.log("app listening on port 30000")
        })
        db = getDb()
    }
    else
	console.log("an error occured during connection")
})

app.get('/', (req, res) => {

    let users = []

    db.collection('userlog')
    .find()
    .sort({date: -1})
    .forEach(user=> users.push(user))
    .then(() => {
        res.status(200).json(users)
    })
    .catch((err) =>{
        res.status(500).json({error: 'Could not fetch the documents'})
    })
})

app.get('/books', (req, res) => {
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
    	db.collection('userlog')
    	.insertOne({ip: req.ip, device: match[1], date: new Date()})
    }
    else
	console.log(req.ip , " <---> ",obj, "| requested a book\n")
    let books = []

    db.collection('books')
    .find()
    .sort({author: 1})
    .forEach(book=> books.push(book))
    .then(() => {
        res.status(200).json(books)
    })
    .catch((err) =>{
        res.status(500).json({error: 'database query error occurred'})
    })
})

