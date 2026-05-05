const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'static' folder
app.use(express.static(path.join(__dirname, 'static')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Autoassistentti server running' });
});

// Claude API proxy
// This keeps your API key secret on the server
// Frontend calls /api/chat instead of Anthropic directly
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system, max_tokens } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: max_tokens || 500,
        system: system || '',
        messages: messages || []
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.json(data);

  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Server error. Try again.' });
  }
});

// Catch all - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Autoassistentti running on port ${PORT}`);
});