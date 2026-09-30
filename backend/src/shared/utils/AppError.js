// Eroare "așteptată" aruncată din servicii; handlerul global o transformă în răspuns HTTP
class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
module.exports = AppError;