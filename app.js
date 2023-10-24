const express = require('express');
const app = express();
const Joi = require('joi');
const axios = require('axios');

app.use(express.json());

// creates an error message object
function createErrorMessage(code, message) {
  return {
    code,
    message,
  };
}

// Validates the given request returns the result of validation or the caught error
function validateRequest(request) {
  const schema = Joi.object({
    query: Joi.string().min(3).max(10).required(),
    page: Joi.number().integer().min(1).default(1),
  });

  return schema.validate(request);
}

// calls the external api, returns the response or null if there was an error.
async function callAPI(query, skip) {
  try {
    const response = await axios.get(`https://dummyjson.com/products/search?q=${query}&limit=2&skip=${skip}`);
    const responseData = response.data;
    return responseData;
  } catch (error) {
    return null;
  }
}


app.post('/api/products', async (req, res) => {
  // Validate the request.
  const result = validateRequest(req.body);
  if (result.error) {
    const errorResponse = createErrorMessage(400, result.error.details[0].message);
    res.status(400).json(errorResponse);
    return;
  }
  // Make a request to dummyjson.com
  const skip = (result.value.page - 1) * 2;
  const query = (result.value.query);
  console.log(skip);
  console.log(result.value.page - 1);
  // Send the request
  const responseData = await callAPI(query, skip);
  if (!responseData) {
    const errorResponse = createErrorMessage(500, 'Failed to fetch products from the online API');
    res.status(500).json(errorResponse);
    return;
  }
  if (!responseData.products.length) {
    const errorResponse = createErrorMessage(404, 'No products found that match the given parameters');
    res.status(404).json(errorResponse);
    return;
  }
  // trasnsform the data
  const transformedProducts = responseData.products.map(product => ({
    title: product.title,
    description: product.description,
    "final price": +(product.price - (product.price * product.discountPercentage / 100)).toFixed(2) // + converts the result into a number
  }));

  res.json(transformedProducts);


});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening to port ${port}`));