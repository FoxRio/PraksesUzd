const express = require('express');
const app = express();
const Joi = require('joi');

app.use(express.json());

app.get('/', (req,res) =>{
    res.send('Hello Worldsds');
});

app.post('/api/products', (req,res) =>{
    // Validate the request.
    const schema = Joi.object({
        query: Joi.string().min(3).max(10).required(),
        page: Joi.number().integer().min(1).default('1'),
      });

    const result = schema.validate(req.body);
    if(result.error){
        res.status(400).send(result.error.details[0].message)
        return;
    }
    // Make a request to dummyjson.com

    // validate the response or handle errors

    // trasnsform the data

    // return response

    res.send('Hello Worldsds');
});
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening to port ${port}`));