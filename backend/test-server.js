const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello from 3010!'));
app.listen(3010, () => console.log('✅ Express rodando na porta 3010'));
