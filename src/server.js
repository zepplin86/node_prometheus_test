const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const promClient = require('prom-client');

// Prometheus metrics setup
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const todoCounter = new promClient.Counter({
  name: 'todo_operations_total',
  help: 'Total number of TODO operations',
  labelNames: ['operation']
});

// Database setup
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0
  )`);

  // Add initial TODO item
  db.run(`INSERT INTO todos (title, completed) VALUES (?, ?)`, 
    ['프로메테우스 학습하기', false], 
    function(err) {
      if (err) {
        console.error('Error creating initial TODO:', err);
      } else {
        console.log('Initial TODO item created with ID:', this.lastID);
      }
    }
  );
});

const app = express();
app.use(cors());
app.use(express.json());

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

// Middleware for request duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode.toString())
      .observe(duration / 1000);
  });
  next();
});

// TODO endpoints
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/todos', (req, res) => {
  const { title } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  db.run('INSERT INTO todos (title) VALUES (?)', [title], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    todoCounter.inc({ operation: 'create' });
    res.status(201).json({ id: this.lastID, title, completed: false });
  });
});

app.put('/todos/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  db.run('UPDATE todos SET completed = ? WHERE id = ?', [completed, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    todoCounter.inc({ operation: 'update' });
    res.json({ id, completed });
  });
});

app.delete('/todos/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM todos WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    todoCounter.inc({ operation: 'delete' });
    res.status(204).send();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 