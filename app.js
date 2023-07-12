const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const app = express();
const port = 3000;

// Configuración de middleware
app.use(bodyParser.json());
// Clave secreta para firmar y verificar los tokens JWT
const secretKey = 'lisbeth123';

// Middleware de autenticación con JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.sendStatus(401);
  }
  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

// Ruta para autenticación
app.post('/auth', (req, res) => {
  const { username, password } = req.body;

  // Verificar las credenciales (solo como ejemplo)
  if (username === 'lisbeth' && password === 'lisbeth123') {
    // Generar el token JWT
    const token = jwt.sign({ username }, secretKey);
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Ruta raíz protegida con autenticación JWT
app.get('/', authenticateToken, (req, res) => {
  res.send('Bienvenido al Laboratorio');
});

// Ruta para evaluar el nivel de riesgo protegida con autenticación JWT
app.post('/risk-evaluation', authenticateToken, (req, res) => {
  // Validación de los datos de entrada
  const { sugar_percentage, fat_percentage, oxygen_percentage } = req.body;

  if (sugar_percentage > 100 || fat_percentage > 100 || oxygen_percentage > 100) {
    return res.status(400).json({ message: 'Invalid percentage value. Each value should be between 0 and 100.' });
  }

  // Evaluación del nivel de riesgo
  let riskLevel;

  if (sugar_percentage > 70 && fat_percentage > 88.5 && oxygen_percentage < 60) {
    riskLevel = 'HIGH';
  } else if (sugar_percentage >= 50 && sugar_percentage <= 70 && fat_percentage >= 62.2 && fat_percentage <= 88.5 && oxygen_percentage >= 60 && oxygen_percentage <= 70) {
    riskLevel = 'MEDIUM';
  } else if (sugar_percentage < 50 && fat_percentage < 62.2 && oxygen_percentage > 70) {
    riskLevel = 'LOW';
  } else {
    riskLevel = 'UNKNOWN';
  }

  // Guardar la información de la sangre evaluada y el nivel de riesgo
  saveBloodTestResult(req.body, riskLevel);

  res.json({ risk: riskLevel });
});

// Función para guardar la información de la sangre evaluada y el nivel de riesgo
function saveBloodTestResult(data, riskLevel) {
  // Aquí puedes implementar la lógica para guardar los datos en una base de datos
  console.log('Saving blood test result:', data, 'Risk level:', riskLevel);
}

// Endpoint para verificar el estudio de la sangre utilizando axios
app.post('/verify-risk-evaluation', (req, res) => {
  const url = 'http://localhost:3000/risk-evaluation';
  const data = {
    sugar_percentage: 80,
    fat_percentage: 90,
    oxygen_percentage: 55
  };

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIxMjMifQ.Lyfkbj7sO8gYrXvqgUcZdbM7OT0R0wN-CzW1eC_qQ9s';

  axios.post(url, data, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      console.log(response.data);
      res.json(response.data);
    })
    .catch(error => {
      console.error(error.response.data);
      res.status(500).json({ message: 'Error occurred' });
    });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
