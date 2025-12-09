const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');
const config = require('./config');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(logger);

app.get('/', (req, res) => res.json({ status: 'ok' }));

// routes
app.use('/api', routes);

// swagger
setupSwagger(app);

// global error handler
app.use(errorHandler);

const port = config.port;
app.listen(port, () => {
  console.log(`Account service listening on port ${port}`);
});
