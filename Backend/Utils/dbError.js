// Ginagawang malinaw na mensahe ang mga karaniwang MySQL error
// para hindi na puro "Something went wrong." ang lumalabas.
export function describeDbError(e) {
  const code = e?.code || e?.errors?.[0]?.code;
  const dbName = process.env.DB_NAME || 'visit_balayan';
  const fix = 'Run "npm run setup" in the Backend folder.';

  switch (code) {
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
    case 'ENOTFOUND':
    case 'PROTOCOL_CONNECTION_LOST':
      return { status: 503, message: 'Cannot reach MySQL. Start MySQL in the XAMPP Control Panel, then try again.' };
    case 'ER_ACCESS_DENIED_ERROR':
      return { status: 500, message: 'MySQL rejected the login. Check DB_USER and DB_PASSWORD in Backend/.env.' };
    case 'ER_BAD_DB_ERROR':
      return { status: 500, message: `Database "${dbName}" does not exist. ${fix}` };
    case 'ER_NO_SUCH_TABLE':
      return { status: 500, message: `A required table is missing (${e.sqlMessage}). ${fix}` };
    case 'ER_BAD_FIELD_ERROR':
      return { status: 500, message: `A required column is missing (${e.sqlMessage}). ${fix}` };
    case 'ER_DUP_ENTRY':
      return { status: 409, message: 'That record already exists.' };
    default:
      return null;
  }
}
