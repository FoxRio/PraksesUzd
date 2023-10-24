const express = require('express');
const app = express();
const Joi = require('joi');
const axios = require('axios');

app.use(express.json());

app.use((req, res, next) => {
  const incomingMessage = {
    type: 'messageIn',
    body: JSON.stringify(req.body),
    method: req.method,
    path: req.url,
    dateTime: new Date(),
  };
  console.log(`Incoming: ${JSON.stringify(incomingMessage)}`);
  next();
});

// Validates the given request returns the result of validation or the caught error
function validateRequest(request) {
  const schema = Joi.object({
    query: Joi.string().min(3).max(10).required(),
    page: Joi.number().integer().min(1).default(1),
  });

  return schema.validate(request);
}

// calls the external api, returns the response or throws an error.
async function callAPI(query, skip) {
  try {
    const response = await axios.get(`https://dummyjson.com/products/search?q=${query}&limit=2&skip=${skip}`);
    const responseData = response.data;
    return responseData;
  } catch (error) {
    throw error;
  }
}


app.post('/api/products', async (req, res, next) => {
  // Validate the request
  try {
    const result = validateRequest(req.body);
    if (result.error) {
      const errorMessage = result.error.details[0].message;
      const error = new Error(errorMessage);
      error.status = 400;
      throw error;
    }
    // Make a request to dummyjson.com
    const skip = (result.value.page - 1) * 2;
    const query = (result.value.query);
    // Send the request
    const responseData = await callAPI(query, skip);
    if (!responseData) {
      const errorMessage = 'Failed to fetch products from the online API';
      const error = new Error(errorMessage);
      error.status = 500;
      throw error;
    }
    if (!responseData.products.length) {
      const errorMessage = 'No products found that match the given parameters';
      const error = new Error(errorMessage);
      error.status = 404;
      throw error;
    }
    // Trasnsform the data
    const transformedProducts = responseData.products.map(product => ({
      title: product.title,
      description: product.description,
      "final price": +(product.price - (product.price * product.discountPercentage / 100)).toFixed(2) // + converts the result into a number
    }));
    res.json(transformedProducts);
    const outgoingMessage = {
      type: 'messageOut',
      body: JSON.stringify(transformedProducts),
      dateTime: new Date(),
    };
    console.log(`Outgoing: ${JSON.stringify(outgoingMessage)}`);
    return;
  }
  catch (error) {
    next(error);
  }
});

// from https://expressjs.com/en/guide/error-handling.html
app.use((err, req, res, next) => {
  // Set a default status code if not provided
  const statusCode = err.status || 500;
  // Prepare the response
  const errorResponse = {
    code: statusCode,
    message: err.message,
  };

  res.status(statusCode).json(errorResponse);

  // Information that will be passed to logging middleware
  req.errorToLog = {
    fault: err.stack,
    body: errorResponse
  };
  if (statusCode >= 400) {
    req.errorToLog.fault = err.stack;
  }
  next();
});

app.use((req, res, next) => {
  // if there response is with an error
  const outgoingMessage = {
    type: 'messageOut',
    body: JSON.stringify(req.errorToLog.body),
    dateTime: new Date(),
    fault: req.errorToLog.fault
  };
  console.log(`Outgoing: ${JSON.stringify(outgoingMessage)}`);
  return;
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening to port ${port}`));