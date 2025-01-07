# Node Storage

Node Storage è un'applicazione per la gestione di file con autenticazione utente. Utilizza Express.js per il backend e Prisma come ORM per interagire con il database. Permette inoltre di inoltrare le richieste, previa autenticazione, ad un backend service esterno tramite un proxy middleware.

## Requisiti

- Node.js
- npm
- Un database supportato da Prisma (es. PostgreSQL, MySQL, SQLite)

## Installazione

1. Clona il repository:
    ```sh
    git clone https://github.com/FrancescoGiuliante/BE-node-storage-Eduhub.git
    cd node-storage-Eduhub
    ```

2. Installa le dipendenze:
    ```sh
    npm install
    ```

3. Configura le variabili d'ambiente:
    Crea un file `.env` nella radice del progetto e aggiungi le seguenti variabili:
    ```env
    DATABASE_URL="url_del_tuo_database"
    PORT=3000
    JWT_SECRET="la_tua_secret_jwt"
    ```

4. Esegui le migrazioni del database:
    ```sh
    npx prisma migrate dev
    ```

## Utilizzo

1. Avvia il server:
    ```sh
    npm run dev
    ```

2. L'applicazione sarà disponibile su `http://localhost:3000`.

## API

### Autenticazione

- `POST /auth/register`: Registra un nuovo utente.

    ```json
    { 
        "name": "John Doe",
        "email": "example@email.com",
        "password": "your_password", 
        "confirmPassword": "your_password",
    }
    ```


- `POST /auth/login`: Effettua il login di un utente.

	```json
    { 
        "email": "example@email.com",
        "password": "your_password", 
    }
    ```


- `GET /auth/user`: Restituisce i dati dell'utente autenticato.

	```json
    {
        "id": 1,
        "email": "email@example.com",
        "name": "John Doe",
        "createdAt": "2024-12-11T11:37:26.555Z",
        "updatedAt": "2024-12-11T11:37:26.555Z"
    }
    ```

### File

- `POST /files/upload`: Carica un file (richiede autenticazione).

    ```json
    { 
        "file": "file_da_caricare"
    }
    ```


- `GET /files`: Elenca i file dell'utente autenticato (richiede autenticazione).

    ```json
    [
        {
            "id": 1,
            "userId": 1,
            "filename": "file1.txt",
            "createdAt": "2024-12-11T11:37:26.555Z",
            "updatedAt": "2024-12-11T11:37:26.555Z"
        },
        {
            "id": 2,
            "userId": 1,
            "filename": "file2.txt",
            "createdAt": "2024-12-11T11:37:26.555Z",
            "updatedAt": "2024-12-11T11:37:26.555Z"
        }
    ]
    ```

    
- `GET /files/:userId/:filename`: Restituisce un file specifico.

- `DELETE /files/delete/:filename`: Elimina un file (richiede autenticazione).

## Middleware

- `authenticateToken`: Middleware per autenticare le richieste tramite token JWT.

## Proxy Middleware

L'applicazione include un proxy middleware che gestisce le richieste verso un backend service esterno. 
Tutte le richieste dirette a `/api/*` vengono inoltrate al backend service configurato.

### Configurazione
- Il proxy è configurato per inoltrare le richieste a `BACKEND_SERVICE_URL` (default: http://localhost:8080)
- Rimuove il prefisso `/api` dalle richieste inoltrate
- Richiede autenticazione JWT per tutte le richieste

### Headers propagati
- `X-User`: Informazioni dell'utente autenticato in formato JSON stringified

### Esempio di utilizzo
```http
GET /api/users
```
Viene inoltrato come:
```http
GET /users
X-User: {"id": 1, "email": "user@example.com", "name": "John Doe", "createdAt": "2024-12-11T11:37:26.555Z", "updatedAt": "2024-12-11T11:37:26.555Z"}
```

## Struttura del Progetto

- `src/`
  - `app.ts`: Punto di ingresso dell'applicazione.
  - `config/`: Configurazione del database.
  - `controllers/`: Logica dei controller per le rotte.
  - `middleware/`: Middleware per l'autenticazione.
  - `routes/`: Definizione delle rotte.

## Contributi

I contributi sono benvenuti! Sentiti libero di aprire issue o pull request.

## Licenza

Questo progetto è distribuito sotto licenza MIT.