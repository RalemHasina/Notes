require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')

app.use(express.json())
app.use(express.static('dist'))
app.use(cors())

const Note = require('./models/note')

let notes = [
  {
    id: 1,
    content: 'HTML is easy',
    important: true,
  },
  {
    id: 2,
    content: 'Browser can execute only Javascript',
    important: false,
  },
  {
    id: 3,
    content: 'GET and POST are the most important methods of HTTP protocol',
    important: true,
  }
]

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  })
})

app.get('/api/notes/:id', (request, response, next) => {
  Note.findById(request.params.id).then(note => {
    if (note) {
      response.json(note)
    } else {
      response.status(404).end()
    }
  })
  .catch(error => next(error))  

  // const id = Number(request.params.id)
  // const note = notes.find(note => note.id === id )
  // if (note) {
  //   response.json(note)
  // } else {
  //   response.status(404).end()
  // }
})

app.put('/api/notes/:id', (request, response, next) => {
  const { content, important } = request.body

  // const note = {
  //   content: body.content,
  //   important: body.important,
  // }

  Note.findByIdAndUpdate(
    request.params.id, 
    { content, important }, 
    { new: true, runValidators: true, context: 'query' })
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})

app.delete('/api/notes/:id', (request, response, next) => {
  Note.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))

  // const id = Number(request.params.id)
  // notes = notes.filter(note => note.id !== id )
  // response.status(204).end()
})


const generatedId = () => {
  const maxId = notes.length > 0 
  ? Math.max(...notes.map(n => n.id))
  : 0

  return maxId + 1
}

app.post('/api/notes', (request, response, next) => {
  const body = request.body

  // if (body.content === undefined) {
  //   return response.status(400).json({
  //     error: 'content missing'
  //   })
  // }
  
  const note = new Note({
    content: body.content,
    important: Boolean(body.important) || false,
    id: generatedId(),
  })

  note.save()
    .then(savedNote => {
      response.json(savedNote)
    })
    .catch(error => next(error))

  // notes = notes.concat(note)
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.log(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({
      error: 'malformatted id'
    })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({
      error: error.message
    })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT 
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})